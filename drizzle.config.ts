import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "turso",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    // Local dev uses a plain file: SQLite db; prod uses the Turso URL + token.
    url: process.env.TURSO_DATABASE_URL ?? "file:./varde.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
