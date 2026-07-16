import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import { pool } from "./pool";

/**
 * Apply the SQL schema to the configured Neon database.
 * Idempotent — every statement uses IF NOT EXISTS, so re-running is safe.
 *
 * Usage:  npm run db:migrate   (from server/)
 */
async function migrate(): Promise<void> {
  const sql = readFileSync(join(__dirname, "schema.sql"), "utf8");
  console.info("[migrate] Applying schema.sql to Neon…");
  await pool.query(sql);
  console.info("[migrate] Done. Tables are ready.");
}

migrate()
  .then(() => pool.end())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[migrate] Failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
