import rateLimit from "express-rate-limit";

/**
 * Rate-limiter applied to the pitch generation endpoint.
 *
 * Default limits (overridable via env vars):
 *  - Window : 60 seconds  (`RATE_LIMIT_WINDOW_MS`)
 *  - Max requests : 20    (`RATE_LIMIT_MAX_REQUESTS`)
 *
 * Responses include `RateLimit-*` headers (RFC 6585 draft standard).
 * Returns a 429 JSON error when the limit is exceeded.
 */
export const pitchRateLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please wait before generating another pitch.",
  },
});
