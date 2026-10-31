import postgres from "postgres";

export type Sql = ReturnType<typeof postgres>;

const globalForSql = globalThis as unknown as { sql?: Sql };

function connectionString() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return null;
  let next = raw;
  if (/^postgres(?:ql)?:\/\/[^/?]+\/?$/.test(next)) {
    next = next.replace(/\/?$/, "/postgres");
  }
  if (!/[?&]sslmode=/.test(next)) {
    next += `${next.includes("?") ? "&" : "?"}sslmode=require`;
  }
  return next;
}

export function getSql() {
  const url = connectionString();
  if (!url) return null;
  if (!globalForSql.sql) {
    globalForSql.sql = postgres(url, {
      prepare: false,
      fetch_types: false,
      max: 3,
      idle_timeout: 10,
      max_lifetime: 60,
      connect_timeout: 10,
    });
  }
  return globalForSql.sql;
}

export async function resetSql() {
  const current = globalForSql.sql;
  globalForSql.sql = undefined;
  if (!current) return;
  await current.end({ timeout: 1 }).catch(() => undefined);
}
