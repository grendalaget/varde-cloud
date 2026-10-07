import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

// Local dev falls back to a plain SQLite file — no server needed.
// Prod sets TURSO_DATABASE_URL (libsql://...) + TURSO_AUTH_TOKEN.
const url = process.env.TURSO_DATABASE_URL ?? "file:./varde.db";

const globalForDb = globalThis as unknown as { libsql?: Client };
export const client =
  globalForDb.libsql ??
  createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
if (process.env.NODE_ENV !== "production") {
  globalForDb.libsql = client;
}

export const db = drizzle(client);
