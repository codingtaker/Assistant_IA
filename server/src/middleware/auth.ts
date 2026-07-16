import type { Request, Response, NextFunction } from "express";
import { createHash } from "crypto";
import { pool } from "../db/pool";

/**
 * SHA-256 hex digest of a plaintext key.
 * Keys are high-entropy random tokens, so a plain SHA-256 (no per-key salt) is
 * sufficient here — we only need a fast, deterministic lookup value and to avoid
 * storing the secret. (Use bcrypt/argon2 only for low-entropy human passwords.)
 */
export function hashKey(plaintext: string): string {
  return createHash("sha256").update(plaintext, "utf8").digest("hex");
}

/** Extract the bearer key from `x-api-key` or `Authorization: Bearer <key>`. */
function extractKey(req: Request): string | null {
  const header = req.header("x-api-key");
  if (header && header.trim()) return header.trim();

  const auth = req.header("authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice("Bearer ".length).trim();
    if (token) return token;
  }
  return null;
}

/**
 * Authenticate a request by API key and enforce the client's rolling quota.
 *
 * On success: attaches `req.client` and calls `next()`. The quota window is
 * reset atomically if it has elapsed, but the usage counter is only incremented
 * on a *successful* generation (see `consumeQuota`), so failed calls are free.
 *
 * Responses:
 *   401 — missing/unknown/inactive key
 *   429 — quota exhausted for the current window
 *   503 — database unreachable
 */
export async function apiKeyAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const key = extractKey(req);
  if (!key) {
    res.status(401).json({
      error: { message: "Missing API key.", code: "AUTH_REQUIRED" },
    });
    return;
  }

  const keyHash = hashKey(key);

  try {
    // Reset the window in the same statement if it has elapsed, then return the row.
    const { rows } = await pool.query<{
      id: string;
      name: string;
      quota_limit: number;
      quota_used: number;
      quota_reset_at: string;
    }>(
      `UPDATE api_clients
         SET quota_used     = CASE WHEN quota_reset_at < now() THEN 0 ELSE quota_used END,
             quota_reset_at = CASE WHEN quota_reset_at < now()
                                   THEN now() + interval '30 days'
                                   ELSE quota_reset_at END,
             last_used_at   = now()
       WHERE key_hash = $1 AND active = true
       RETURNING id, name, quota_limit, quota_used, quota_reset_at`,
      [keyHash]
    );

    const client = rows[0];
    if (!client) {
      // Same response for unknown and inactive keys — don't leak which.
      res.status(401).json({
        error: { message: "Invalid API key.", code: "AUTH_INVALID" },
      });
      return;
    }

    if (client.quota_used >= client.quota_limit) {
      res.status(429).json({
        error: {
          message: "Quota exceeded. Try again after your quota resets.",
          code: "QUOTA_EXCEEDED",
          quotaResetAt: client.quota_reset_at,
        },
      });
      return;
    }

    req.client = {
      id: client.id,
      name: client.name,
      quotaLimit: client.quota_limit,
      quotaUsed: client.quota_used,
      quotaResetAt: client.quota_reset_at,
    };
    next();
  } catch (err) {
    console.error(
      "[auth] Database error during authentication:",
      err instanceof Error ? err.message : err
    );
    res.status(503).json({
      error: { message: "Authentication service unavailable.", code: "AUTH_UNAVAILABLE" },
    });
  }
}

/**
 * Atomically consume one unit of quota for a client, guarding against the race
 * where concurrent requests slip past the read check. Returns the remaining
 * quota, or `null` if the client just hit their limit (caller may 429).
 * Call this only after a successful generation.
 */
export async function consumeQuota(clientId: string): Promise<number | null> {
  const { rows } = await pool.query<{ remaining: number }>(
    `UPDATE api_clients
        SET quota_used = quota_used + 1
      WHERE id = $1 AND quota_used < quota_limit
      RETURNING (quota_limit - quota_used) AS remaining`,
    [clientId]
  );
  return rows[0]?.remaining ?? null;
}
