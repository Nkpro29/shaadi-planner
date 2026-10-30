import { randomUUID } from "crypto";
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import { OWNER_EMAIL, type ManagedUser, type UserRole } from "./constants";
import { OWNER_ID, OWNER_NAME, OWNER_PASSWORD_HASH } from "./owner-seed";
import { hashPassword, passwordError, verifyPassword } from "./password";

interface StoredUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  createdAt: string;
}

interface StoredSession {
  id: string;
  userId: string;
  expiresAt: string;
}

interface AuthFile {
  users: StoredUser[];
  sessions: StoredSession[];
}

export class AuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const FILE = path.join(process.cwd(), "data", "auth.json");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let chain: Promise<void> = Promise.resolve();

function withLock<T>(task: () => Promise<T>) {
  const result = chain.then(task, task);
  chain = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

function ownerRecord(now = new Date().toISOString()): StoredUser {
  return {
    id: OWNER_ID,
    email: OWNER_EMAIL,
    name: OWNER_NAME,
    role: "owner",
    passwordHash: OWNER_PASSWORD_HASH,
    createdAt: now,
  };
}

function toManaged(user: StoredUser): ManagedUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function persist(data: AuthFile) {
  await mkdir(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2));
  await rename(tmp, FILE);
}

async function load(): Promise<AuthFile> {
  let data: AuthFile;
  try {
    data = JSON.parse(await readFile(FILE, "utf8")) as AuthFile;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    data = { users: [ownerRecord()], sessions: [] };
    await persist(data);
    return data;
  }

  if (!data || !Array.isArray(data.users) || !Array.isArray(data.sessions)) {
    throw new AuthError("The sign-in records could not be read.", 500);
  }

  let changed = false;
  if (!data.users.some((user) => user.role === "owner" && user.email === OWNER_EMAIL)) {
    data.users.unshift(ownerRecord());
    changed = true;
  }

  const now = Date.now();
  const sessions = data.sessions.filter((session) => Date.parse(session.expiresAt) > now);
  if (sessions.length !== data.sessions.length) {
    data.sessions = sessions;
    changed = true;
  }

  if (changed) await persist(data);
  return data;
}

export function authenticate(email: string, password: string) {
  return withLock(async () => {
    const data = await load();
    const user = data.users.find((item) => item.email === normalizeEmail(email));
    const hash = user?.passwordHash ?? OWNER_PASSWORD_HASH;
    const matches = verifyPassword(password, hash);
    if (!user || !matches) return null;
    return toManaged(user);
  });
}

export function createSession(userId: string, expiresAt: Date) {
  return withLock(async () => {
    const data = await load();
    const id = randomUUID();
    data.sessions.push({ id, userId, expiresAt: expiresAt.toISOString() });
    await persist(data);
    return id;
  });
}

export function userForSession(sessionId: string, userId: string) {
  return withLock(async () => {
    const data = await load();
    const session = data.sessions.find((item) => item.id === sessionId && item.userId === userId);
    if (!session || Date.parse(session.expiresAt) <= Date.now()) return null;
    const user = data.users.find((item) => item.id === userId);
    return user ? toManaged(user) : null;
  });
}

export function revokeSession(sessionId: string) {
  return withLock(async () => {
    const data = await load();
    data.sessions = data.sessions.filter((session) => session.id !== sessionId);
    await persist(data);
  });
}

export function listUsers() {
  return withLock(async () => {
    const data = await load();
    return data.users
      .map(toManaged)
      .sort((left, right) => {
        if (left.role !== right.role) return left.role === "owner" ? -1 : 1;
        return left.name.localeCompare(right.name);
      });
  });
}

export function createUser(input: { name: string; email: string; password: string }) {
  return withLock(async () => {
    const name = input.name.trim();
    const email = normalizeEmail(input.email);
    if (!name) throw new AuthError("Enter a name.", 400);
    if (name.length > 80) throw new AuthError("Use a shorter name.", 400);
    if (!EMAIL_RE.test(email)) throw new AuthError("Enter a valid email address.", 400);
    const tooShort = passwordError(input.password);
    if (tooShort) throw new AuthError(tooShort, 400);

    const data = await load();
    if (data.users.some((user) => user.email === email)) {
      throw new AuthError("Someone with that email already has a sign-in.", 409);
    }

    const user: StoredUser = {
      id: randomUUID(),
      email,
      name,
      role: "member",
      passwordHash: hashPassword(input.password),
      createdAt: new Date().toISOString(),
    };
    data.users.push(user);
    await persist(data);
    return toManaged(user);
  });
}

export function updateUser(userId: string, input: { name?: string; password?: string }, keepSessionId?: string) {
  return withLock(async () => {
    const data = await load();
    const user = data.users.find((item) => item.id === userId);
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
      user.passwordHash = hashPassword(input.password);
      data.sessions = data.sessions.filter((session) => session.userId !== user.id || session.id === keepSessionId);
    }

    await persist(data);
    return toManaged(user);
  });
}

export function deleteUser(userId: string) {
  return withLock(async () => {
    const data = await load();
    const user = data.users.find((item) => item.id === userId);
    if (!user) throw new AuthError("That person was not found.", 404);
    if (user.role === "owner") throw new AuthError("Your account stays on the planner.", 400);
    data.users = data.users.filter((item) => item.id !== userId);
    data.sessions = data.sessions.filter((session) => session.userId !== userId);
    await persist(data);
  });
}
