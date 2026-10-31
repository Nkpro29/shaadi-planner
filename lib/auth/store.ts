import { randomUUID } from "crypto";
import { readFile } from "fs/promises";
import path from "path";
import { OWNER_EMAIL, type ManagedUser, type UserRole } from "./constants";
import { getSql, resetSql, type Sql } from "./db";
import { OWNER_ID, OWNER_NAME, OWNER_PASSWORD_HASH } from "./owner-seed";
import { hashPassword, passwordError, verifyPassword } from "./password";

interface StoredUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password_hash: string;
  created_at: string | Date;
}

export class AuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const LOCAL_FILE = path.join(process.cwd(), "data", "auth.json");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let ready: Promise<void> | null = null;

function toManaged(user: StoredUser): ManagedUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: new Date(user.created_at).toISOString(),
  };
}

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "23505";
}

function isConnectionError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const code = "code" in error ? String((error as { code?: unknown }).code) : "";
  if (
    code === "CONNECTION_CLOSED" ||
    code === "CONNECTION_ENDED" ||
    code === "ECONNRESET" ||
    code === "EPIPE" ||
    code === "CONNECT_TIMEOUT"
  ) {
    return true;
  }
  return "cause" in error && isConnectionError((error as { cause?: unknown }).cause);
}

function withTimeout<T>(promise: Promise<T>, ms: number) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      const error = new Error("The database connection timed out.");
      (error as Error & { code: string }).code = "CONNECT_TIMEOUT";
      reject(error);
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function database() {
  const sql = getSql();
  if (!sql) throw new AuthError("Sign-in is not configured yet.", 500);
  if (!ready) {
    ready = ensure(sql).catch((error) => {
      ready = null;
      throw error;
    });
  }
  return { sql, pending: ready };
}

async function withDb<T>(task: (sql: Sql) => Promise<T>, attempt = 0): Promise<T> {
  const { sql, pending } = database();
  try {
    await withTimeout(pending, 12000);
    return await withTimeout(task(sql), 12000);
  } catch (error) {
    if (error instanceof AuthError) throw error;
    if (attempt < 1 && isConnectionError(error)) {
      ready = null;
      await resetSql();
      return withDb(task, attempt + 1);
    }
    console.error(error);
    throw new AuthError("Sign-in storage is unavailable.", 500);
  }
}

async function ensure(sql: Sql) {
  const existing = await sql<{ users: string | null; sessions: string | null }[]>`
    select to_regclass('public.app_users') as users, to_regclass('public.app_sessions') as sessions
  `;
  if (!existing[0]?.users || !existing[0]?.sessions) {
    await sql`
      create table if not exists public.app_users (
        id uuid primary key,
        email text not null unique,
        name text not null,
        role text not null check (role in ('owner', 'member')),
        password_hash text not null,
        created_at timestamptz not null default now()
      )
    `;
    await sql`
      create table if not exists public.app_sessions (
        id uuid primary key,
        user_id uuid not null references public.app_users (id) on delete cascade,
        expires_at timestamptz not null
      )
    `;
    await sql`create index if not exists app_sessions_user_id_idx on public.app_sessions (user_id)`;
    await sql`alter table public.app_users enable row level security`;
    await sql`alter table public.app_sessions enable row level security`;
    await sql`revoke all on table public.app_users from anon, authenticated`;
    await sql`revoke all on table public.app_sessions from anon, authenticated`;
  }
  await sql`
    insert into public.app_users (id, email, name, role, password_hash)
    values (${OWNER_ID}::uuid, ${OWNER_EMAIL}, ${OWNER_NAME}, 'owner', ${OWNER_PASSWORD_HASH})
    on conflict (email) do nothing
  `;
  await importLocalUsers(sql);
}

async function importLocalUsers(sql: Sql) {
  let raw: string;
  try {
    raw = await readFile(LOCAL_FILE, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
    throw error;
  }

  const parsed = JSON.parse(raw) as {
    users?: Array<{ id?: string; email?: string; name?: string; role?: string; passwordHash?: string; createdAt?: string }>;
  };
  for (const user of parsed.users ?? []) {
    if (!user.id || !user.email || !user.name || !user.passwordHash) continue;
    if (user.role !== "owner" && user.role !== "member") continue;
    try {
      await sql`
        insert into public.app_users (id, email, name, role, password_hash, created_at)
        values (
          ${user.id}::uuid,
          ${normalizeEmail(user.email)},
          ${user.name},
          ${user.role},
          ${user.passwordHash},
          ${user.createdAt ?? new Date().toISOString()}
        )
        on conflict (email) do nothing
      `;
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
    }
  }
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function authenticate(email: string, password: string) {
  return withDb(async (sql) => {
    const rows = await sql<StoredUser[]>`
      select id, email, name, role, password_hash, created_at
      from public.app_users
      where email = ${normalizeEmail(email)}
      limit 1
    `;
    const user = rows[0];
    const hash = user?.password_hash ?? OWNER_PASSWORD_HASH;
    if (!user || !verifyPassword(password, hash)) return null;
    return toManaged(user);
  });
}

export function createSession(userId: string, expiresAt: Date) {
  return withDb(async (sql) => {
    const id = randomUUID();
    await sql`
      insert into public.app_sessions (id, user_id, expires_at)
      values (${id}::uuid, ${userId}::uuid, ${expiresAt.toISOString()})
    `;
    await sql`delete from public.app_sessions where expires_at <= now()`;
    return id;
  });
}

export function userForSession(sessionId: string, userId: string) {
  return withDb(async (sql) => {
    const rows = await sql<StoredUser[]>`
      select u.id, u.email, u.name, u.role, u.password_hash, u.created_at
      from public.app_sessions s
      join public.app_users u on u.id = s.user_id
      where s.id = ${sessionId}::uuid
        and s.user_id = ${userId}::uuid
        and s.expires_at > now()
      limit 1
    `;
    return rows[0] ? toManaged(rows[0]) : null;
  });
}

export function revokeSession(sessionId: string) {
  return withDb(async (sql) => {
    await sql`delete from public.app_sessions where id = ${sessionId}::uuid`;
  });
}

export function listUsers() {
  return withDb(async (sql) => {
    const rows = await sql<StoredUser[]>`
      select id, email, name, role, password_hash, created_at
      from public.app_users
      order by case when role = 'owner' then 0 else 1 end, name
    `;
    return rows.map(toManaged);
  });
}

export function createUser(input: { name: string; email: string; password: string }) {
  return withDb(async (sql) => {
    const name = input.name.trim();
    const email = normalizeEmail(input.email);
    if (!name) throw new AuthError("Enter a name.", 400);
    if (name.length > 80) throw new AuthError("Use a shorter name.", 400);
    if (!EMAIL_RE.test(email)) throw new AuthError("Enter a valid email address.", 400);
    const tooShort = passwordError(input.password);
    if (tooShort) throw new AuthError(tooShort, 400);

    try {
      const rows = await sql<StoredUser[]>`
        insert into public.app_users (id, email, name, role, password_hash)
        values (${randomUUID()}::uuid, ${email}, ${name}, 'member', ${hashPassword(input.password)})
        returning id, email, name, role, password_hash, created_at
      `;
      return toManaged(rows[0]);
    } catch (error) {
      if (isUniqueViolation(error)) throw new AuthError("Someone with that email already has a sign-in.", 409);
      throw error;
    }
  });
}

export function updateUser(userId: string, input: { name?: string; password?: string }, keepSessionId?: string) {
  return withDb(async (sql) => {
    const rows = await sql<StoredUser[]>`
      select id, email, name, role, password_hash, created_at
      from public.app_users
      where id = ${userId}::uuid
      limit 1
    `;
    const user = rows[0];
    if (!user) throw new AuthError("That person was not found.", 404);

    if (typeof input.name === "string") {
      const name = input.name.trim();
      if (!name) throw new AuthError("Enter a name.", 400);
      if (name.length > 80) throw new AuthError("Use a shorter name.", 400);
      user.name = name;
    }

    if (typeof input.password === "string") {
      const tooShort = passwordError(input.password);
      if (tooShort) throw new AuthError(tooShort, 400);
      user.password_hash = hashPassword(input.password);
      await sql`
        delete from public.app_sessions
        where user_id = ${userId}::uuid
          and (${keepSessionId ?? null}::uuid is null or id <> ${keepSessionId ?? null}::uuid)
      `;
    }

    const saved = await sql<StoredUser[]>`
      update public.app_users
      set name = ${user.name}, password_hash = ${user.password_hash}
      where id = ${userId}::uuid
      returning id, email, name, role, password_hash, created_at
    `;
    return toManaged(saved[0]);
  });
}

export function deleteUser(userId: string) {
  return withDb(async (sql) => {
    const rows = await sql<StoredUser[]>`
      select id, email, name, role, password_hash, created_at
      from public.app_users
      where id = ${userId}::uuid
      limit 1
    `;
    const user = rows[0];
    if (!user) throw new AuthError("That person was not found.", 404);
    if (user.role === "owner") throw new AuthError("Your account stays on the planner.", 400);
    await sql`delete from public.app_users where id = ${userId}::uuid`;
  });
}
