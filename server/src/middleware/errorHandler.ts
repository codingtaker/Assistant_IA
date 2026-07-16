import type { Request, Response, NextFunction } from "express";
import { AIAllProvidersFailedError } from "../services/ai";

export interface AppError extends Error {
  statusCode?: number;
  status?: number;
  code?: string;
}

/**
 * Central error handler.
 *
 * Principle: log the FULL detail server-side (always), but never leak internal
 * error text, stack traces, or provider internals to the client in production.
 *   - dev  → verbose responses (message, stack, provider attempts) for debugging
 *   - prod → generic message for 5xx; the operational message is kept only for
 *            client (4xx) errors, which are safe and actionable for the caller.
 *
 * `isDev` defaults to false unless NODE_ENV is explicitly "development", so an
 * unset NODE_ENV in production fails closed (generic responses).
 */
export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isDev = process.env.NODE_ENV === "development";
  const statusCode = err.statusCode ?? err.status ?? 500;
  const isClientError = statusCode >= 400 && statusCode < 500;

  if (err instanceof AIAllProvidersFailedError) {
    // Full provider chain is logged server-side only.
    console.error(
      `[Error] ${req.method} ${req.originalUrl} → AIAllProvidersFailedError:\n` +
        err.attempts
          .map(
            (a) =>
              `  - ${a.provider}: status=${a.status ?? "?"} code=${a.code ?? "?"} retryable=${a.retryable} (${a.durationMs}ms) → ${a.message}`
          )
          .join("\n")
    );

    if (isDev) {
      res.status(err.statusCode).json({
        error: {
          message: "All AI providers failed",
          code: "AI_PROVIDERS_EXHAUSTED",
          attempts: err.attempts.map((a) => ({
            provider: a.provider,
            status: a.status,
            code: a.code,
            retryable: a.retryable,
            durationMs: a.durationMs,
            message: a.message,
          })),
        },
      });
    } else {
      // Never expose provider names, statuses, or messages in production.
      res.status(err.statusCode).json({
        error: {
          message: "AI service temporarily unavailable. Please try again shortly.",
          code: "AI_PROVIDERS_EXHAUSTED",
        },
      });
    }
    return;
  }

  console.error(
    `[Error] ${req.method} ${req.originalUrl} → status=${statusCode} code=${err.code ?? "?"}: ${err.message}`,
    isDev ? `\n${err.stack}` : ""
  );

  if (isDev) {
    res.status(statusCode).json({
      error: {
        message: err.message || "Internal server error",
        code: err.code,
        stack: err.stack,
      },
    });
    return;
  }

  if (isClientError) {
    // 4xx: the message is a safe, actionable description of what the caller did wrong.
    res.status(statusCode).json({
      error: {
        message: err.message || "Request error",
        code: err.code,
      },
    });
    return;
  }

  // 5xx / unknown: generic response — no internal details.
  res.status(statusCode).json({
    error: {
      message: "Internal server error",
      code: "INTERNAL_ERROR",
    },
  });
}
