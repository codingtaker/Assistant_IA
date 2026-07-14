import type { Request, Response, NextFunction } from "express";
import { AIAllProvidersFailedError } from "../services/ai";

export interface AppError extends Error {
  statusCode?: number;
  status?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isDev = process.env.NODE_ENV === "development";
  const statusCode = err.statusCode ?? err.status ?? 500;

  if (err instanceof AIAllProvidersFailedError) {
    console.error(
      `[Error] ${req.method} ${req.originalUrl} → AIAllProvidersFailedError:`,
      err.attempts.map(
        (a) =>
          `  - ${a.provider}: status=${a.status ?? "?"} code=${a.code ?? "?"} retryable=${a.retryable} (${a.durationMs}ms) → ${a.message}`
      ).join("\n")
    );

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
          ...(isDev && { message: a.message }),
        })),
      },
    });
    return;
  }

  console.error(
    `[Error] ${req.method} ${req.originalUrl} → status=${statusCode} code=${err.code ?? "?"}: ${err.message}`,
    isDev ? `\n${err.stack}` : ""
  );

  res.status(statusCode).json({
    error: {
      message: err.message || "Internal server error",
      code: err.code,
      ...(isDev && { stack: err.stack }),
    },
  });
}
