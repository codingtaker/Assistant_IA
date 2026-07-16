import rateLimit from "express-rate-limit";
import { createHash } from "crypto";

/**
 * Rate-limiter applied to the pitch generation endpoint.
 *
 * Default limits (overridable via env vars):
 *  - Window : 60 seconds  (`RATE_LIMIT_WINDOW_MS`)
 *  - Max requests : 20    (`RATE_LIMIT_MAX_REQUESTS`)
 *
 * Keyed by API key (SHA-256 of the `x-api-key` header) rather than IP, so the
 * limit follows the client and cannot be diluted by rotating IPs or shared by
 * many users behind one NAT. Requests without a key fall back to the client IP
 * (they are rejected by `apiKeyAuth` with 401 anyway).
 *
 * Requires `app.set("trust proxy", 1)` in index.ts so `req.ip` is the real
 * client IP behind a single reverse proxy (Render / Railway / Vercel).
 *
 * Responses include `RateLimit-*` headers and a 429 JSON error when exceeded.
 */
export const pitchRateLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const apiKey = req.header("x-api-key");
    if (apiKey) {
      return "key:" + createHash("sha256").update(apiKey, "utf8").digest("hex");
    }
    return "ip:" + (req.ip ?? "unknown");
  },
  message: {
    error: "Too many requests. Please wait before generating another pitch.",
  },
});
