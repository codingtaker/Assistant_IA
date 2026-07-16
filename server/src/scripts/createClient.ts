import "dotenv/config";
import { randomBytes } from "crypto";
import { pool } from "../db/pool";
import { hashKey } from "../middleware/auth";

/**
 * Create a new API client and print its key ONCE.
 *
 * Usage (from server/):
 *   npm run client:create -- "Client name" [quota]
 *
 * Examples:
 *   npm run client:create -- "Web app"           # default quota (100)
 *   npm run client:create -- "Partner Acme" 5000 # custom quota
 *
 * The plaintext key is shown a single time and never stored — only its
 * SHA-256 hash goes to the database. Copy it immediately.
 */
async function main(): Promise<void> {
  const name = process.argv[2];
  const quota = process.argv[3] ? Number(process.argv[3]) : 100;

  if (!name) {
    console.error('Usage: npm run client:create -- "Client name" [quota]');
    process.exit(1);
  }
  if (!Number.isFinite(quota) || quota <= 0) {
    console.error("Quota must be a positive number.");
    process.exit(1);
  }

  // 32 random bytes → 43-char url-safe token. "sp_live_" prefix aids recognition.
  const key = "sp_live_" + randomBytes(32).toString("base64url");
  const keyHash = hashKey(key);
  const keyPrefix = key.slice(0, 12);

  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO api_clients (name, key_hash, key_prefix, quota_limit)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [name, keyHash, keyPrefix, quota]
  );

  console.info("\n✅ API client created\n");
  console.info(`   Name  : ${name}`);
  console.info(`   ID    : ${rows[0].id}`);
  console.info(`   Quota : ${quota} generations / 30 days`);
  console.info("\n   API KEY (shown once — copy it now):\n");
  console.info(`   ${key}\n`);
  console.info("   Send it as header:  x-api-key: <key>\n");
}

main()
  .then(() => pool.end())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed to create client:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
