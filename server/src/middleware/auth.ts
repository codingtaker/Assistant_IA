import type { Request, Response, NextFunction } from "express";
import { createHash } from "crypto";
import { pool } from "../db/pool";

/**
 * SHA-256 hex digest of a plaintext key.
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
 * Whether API key auth is required.
 * Set REQUIRE_API_KEY=false (or leave DATABASE_URL unset) to bypass in local dev.
 */
function isAuthRequired(): boolean {
  const envFlag = process.env.REQUIRE_API_KEY;
  if (envFlag !== undefined) return envFlag !== "false" && envFlag !== "0";
  // Auto-disable when no DATABASE_URL is configured (open-source / local dev)
  return Boolean(process.env.DATABASE_URL);
}

/**
 * Authenticate a request by API key and enforce the client's rolling quota.
 *
 * When REQUIRE_API_KEY=false or DATABASE_URL is not set, this middleware is a
 * no-op — useful for local development and open-source contributors.
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
  // Bypass auth in local dev when not explicitly required
  if (!isAuthRequired()) {
    next();
    return;
  }

  const key = extractKey(req);
  if (!key) {
    res.status(401).json({
      error: { message: "Missing API key.", code: "AUTH_REQUIRED" },
    });
    return;
  }

  const keyHash = hashKey(key);

  try {
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
    console.error("[auth] DB error:", err instanceof Error ? err.message : err);
    res.status(503).json({
      error: { message: "Authentication service unavailable.", code: "AUTH_UNAVAILABLE" },
    });
  }
}

/**
 * Consume one quota unit after a successful generation.
 * Returns remaining quota, or null if the client hit their limit.
 * No-op when auth is disabled.
 */
export async function consumeQuota(clientId: string): Promise<number | null> {
  if (!isAuthRequired()) return null;
  const { rows } = await pool.query<{ remaining: number }>(
    `UPDATE api_clients
        SET quota_used = quota_used + 1
      WHERE id = $1 AND quota_used < quota_limit
      RETURNING (quota_limit - quota_used) AS remaining`,
    [clientId]
  );
  return rows[0]?.remaining ?? null;
}
