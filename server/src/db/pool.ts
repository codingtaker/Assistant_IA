import { Pool } from "pg";

/**
 * Shared PostgreSQL connection pool (Neon).
 *
 * The connection string is read from `DATABASE_URL`. Neon requires SSL; the
 * `sslmode=require` in the URL is honoured by `pg`. We keep the pool small
 * because Neon's serverless driver pools on its side too.
 *
 * Import this singleton everywhere — never create a new Pool per request.
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // Fail fast at startup rather than on the first query.
  throw new Error(
    "DATABASE_URL is not set. Copy your Neon connection string into server/.env."
  );
}

export const pool = new Pool({
  connectionString,
  // Neon terminates idle connections; keep the pool lean.
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on("error", (err) => {
  console.error("[db] Unexpected idle client error:", err.message);
});
