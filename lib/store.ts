import { LibsqlStore } from "@eidentic/libsql";

/**
 * A single shared libSQL store for the whole playground. Every visitor's data is isolated by
 * `scopeKey` (we scope memory to a per-browser `sessionId`), so one database safely serves everyone.
 *
 * - Local dev: no env → persists to ./playground.db (a real file, so memory survives restarts).
 * - Production (Vercel etc.): set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (the serverless filesystem
 *   is ephemeral, so a remote libSQL/Turso DB is required for memory to persist between requests).
 */
let store: LibsqlStore | null = null;
let migrated: Promise<void> | null = null;

export function getStore(): LibsqlStore {
  if (!store) {
    const url = process.env.TURSO_DATABASE_URL || "file:playground.db";
    const authToken = process.env.TURSO_AUTH_TOKEN;
    store = new LibsqlStore(authToken ? { url, authToken } : { url });
  }
  return store;
}

/** Run migrations once per process (idempotent). */
export async function ensureMigrated(): Promise<void> {
  const s = getStore();
  migrated ??= s.migrate();
  await migrated;
  return;
}
