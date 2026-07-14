import type { AIProvider, AICompletionRequest, AICompletionResponse } from "./types";
import { OpenAIProvider } from "./providers/openai";
import { AnthropicProvider } from "./providers/anthropic";
import { OpenAICompatibleProvider } from "./providers/openai-compatible";
import { randomUUID } from "crypto";

type ProviderName = string;

interface ProviderAttempt {
  provider: ProviderName;
  durationMs: number;
  status?: number;
  code?: string;
  message: string;
  retryable: boolean;
}

/**
 * Aggregated error thrown when every provider attempt fails.
 * Exposes the full chain of attempts for logging / debugging.
 */
export class AIAllProvidersFailedError extends Error {
  readonly statusCode: number;
  readonly attempts: ProviderAttempt[];

  constructor(attempts: ProviderAttempt[]) {
    const last = attempts[attempts.length - 1];
    super(
      `All AI providers failed. Last error from "${last?.provider}": ${last?.message ?? "unknown"}`
    );
    this.name = "AIAllProvidersFailedError";
    this.attempts = attempts;
    // Preserve last provider status for the HTTP response when possible
    this.statusCode = last?.status && last.status >= 400 && last.status < 600 ? last.status : 502;
  }
}

/**
 * Decide whether an error is transient and worth retrying on another provider.
 * Retry on:
 *   - HTTP 408 (timeout), 429 (rate limit / quota), 5xx (server errors)
 *   - Network errors (ECONNREFUSED, ECONNRESET, ETIMEDOUT, ENOTFOUND, EAI_AGAIN, socket hang up)
 * Do NOT retry on:
 *   - 4xx client errors (400, 401, 403, 404) — same input will fail on the other provider
 */
function isRetryableError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;

  const anyErr = err as { status?: number; code?: string; message?: string };

  if (typeof anyErr.status === "number") {
    if (anyErr.status === 408 || anyErr.status === 429) return true;
    if (anyErr.status >= 500 && anyErr.status < 600) return true;
    return false;
  }

  const networkCodes = new Set([
    "ECONNREFUSED",
    "ECONNRESET",
    "ETIMEDOUT",
    "ENOTFOUND",
    "EAI_AGAIN",
    "EPIPE",
  ]);
  if (typeof anyErr.code === "string" && networkCodes.has(anyErr.code)) return true;

  if (typeof anyErr.message === "string" && /socket hang up|network|fetch failed/i.test(anyErr.message)) {
    return true;
  }

  return false;
}

function describeError(err: unknown): { status?: number; code?: string; message: string } {
  const anyErr = err as { status?: number; code?: string; message?: string } | undefined;
  return {
    status: typeof anyErr?.status === "number" ? anyErr.status : undefined,
    code: typeof anyErr?.code === "string" ? anyErr.code : undefined,
    message: err instanceof Error ? err.message : String(err),
  };
}

class AIService {
  private providers: Map<ProviderName, AIProvider>;
  private defaultProvider: ProviderName;

  constructor() {
    this.providers = new Map();
    this.providers.set("openai", new OpenAIProvider());
    this.providers.set("anthropic", new AnthropicProvider());

    // Register extra OpenAI-compatible providers declared via env vars.
    // Example:
    //   EXTRA_PROVIDERS=rodium,groq,openrouter
    // RODIUM_API_KEY=... 
    // RODIUM_BASE_URL=https://api.rodiumai.io/v1 
    // RODIUM_MODEL=anthropic/claude-opus-4-7
    //   GROQ_API_KEY=... GROQ_BASE_URL=https://api.groq.com/openai/v1 GROQ_MODEL=llama-3.3-70b-versatile
    this.registerExtraProviders();

    const envDefault = process.env.DEFAULT_AI_PROVIDER as ProviderName | undefined;
    this.defaultProvider = envDefault ?? "openai";
  }

  private registerExtraProviders(): void {
    const list = (process.env.EXTRA_PROVIDERS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const id of list) {
      const upper = id.toUpperCase().replace(/[^A-Z0-9]/g, "_");
      const apiKey = process.env[`${upper}_API_KEY`];
      const baseURL = process.env[`${upper}_BASE_URL`];
      const defaultModel = process.env[`${upper}_MODEL`];

      if (!apiKey) {
        console.warn(
          `[AI] Extra provider "${id}" skipped: missing ${upper}_API_KEY`
        );
        continue;
      }
      if (!baseURL) {
        console.warn(
          `[AI] Extra provider "${id}" skipped: missing ${upper}_BASE_URL`
        );
        continue;
      }
      if (!defaultModel) {
        console.warn(
          `[AI] Extra provider "${id}" skipped: missing ${upper}_MODEL`
        );
        continue;
      }

      if (this.providers.has(id)) {
        console.warn(
          `[AI] Extra provider "${id}" overrides a built-in with the same name`
        );
      }

      // Optional extra headers (comma-separated: EXTRA_HEADERS_XXX="Key1: val, Key2: val")
      const rawHeaders = process.env[`${upper}_HEADERS`];
      const defaultHeaders = rawHeaders
        ? Object.fromEntries(
            rawHeaders
              .split(",")
              .map((h) => h.split(":").map((s) => s.trim()))
              .filter(([k, v]) => k && v)
          )
        : undefined;

      this.providers.set(
        id,
        new OpenAICompatibleProvider({
          name: id,
          apiKey,
          baseURL,
          defaultModel,
          defaultHeaders,
        })
      );

      console.info(
        `[AI] Registered extra provider "${id}" → ${baseURL} (model=${defaultModel})`
      );
    }
  }

  getAvailableProviders(): ProviderName[] {
    return Array.from(this.providers.entries())
      .filter(([, p]) => p.isAvailable())
      .map(([name]) => name);
  }

  async complete(
    request: AICompletionRequest,
    providerName?: ProviderName
  ): Promise<AICompletionResponse> {
    const requestId = randomUUID().slice(0, 8);
    const startingProvider = providerName ?? this.defaultProvider;

    if (!this.providers.has(startingProvider)) {
      throw new Error(`Unknown AI provider: ${startingProvider}`);
    }

    // Build attempt order: requested provider first, then any other available ones as fallbacks.
    const available = this.getAvailableProviders();
    if (available.length === 0) {
      throw new Error(
        "No AI provider is configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY."
      );
    }

    const order: ProviderName[] = [
      ...(available.includes(startingProvider) ? [startingProvider] : []),
      ...available.filter((p) => p !== startingProvider),
    ];

    if (!available.includes(startingProvider)) {
      console.warn(
        `[AI ${requestId}] Requested provider "${startingProvider}" not configured — starting with "${order[0]}"`
      );
    }

    const attempts: ProviderAttempt[] = [];

    for (let i = 0; i < order.length; i++) {
      const name = order[i];
      const provider = this.providers.get(name)!;
      const isFallback = i > 0;
      const started = Date.now();

      console.info(
        `[AI ${requestId}] ${isFallback ? "Fallback attempt" : "Attempt"} ${i + 1}/${order.length} → provider="${name}"`
      );

      try {
        const result = await provider.complete(request);
        const durationMs = Date.now() - started;

        if (isFallback) {
          console.warn(
            `[AI ${requestId}] Recovered via fallback "${name}" after ${attempts.length} failure(s) (${durationMs}ms)`
          );
        } else {
          console.info(
            `[AI ${requestId}] Success via "${name}" model="${result.model}" (${durationMs}ms, tokens=${result.tokensUsed?.total ?? "n/a"})`
          );
        }
        return result;
      } catch (err) {
        const durationMs = Date.now() - started;
        const { status, code, message } = describeError(err);
        const retryable = isRetryableError(err);

        attempts.push({ provider: name, durationMs, status, code, message, retryable });

        const hasMoreProviders = i < order.length - 1;

        if (!retryable) {
          console.error(
            `[AI ${requestId}] Provider "${name}" failed with NON-RETRYABLE error (status=${status ?? "?"}, code=${code ?? "?"}, ${durationMs}ms): ${message}`
          );
          // Non-retryable → rethrow immediately, don't try other providers
          throw err;
        }

        if (hasMoreProviders) {
          console.warn(
            `[AI ${requestId}] Provider "${name}" failed (status=${status ?? "?"}, code=${code ?? "?"}, ${durationMs}ms): ${message} — will try "${order[i + 1]}"`
          );
        } else {
          console.error(
            `[AI ${requestId}] Provider "${name}" failed (status=${status ?? "?"}, code=${code ?? "?"}, ${durationMs}ms): ${message} — no more providers to try`
          );
        }
      }
    }

    // All retryable attempts exhausted
    console.error(
      `[AI ${requestId}] All ${attempts.length} provider attempt(s) failed:`,
      attempts.map((a) => `${a.provider}(status=${a.status ?? "?"}, ${a.durationMs}ms)`).join(" → ")
    );
    throw new AIAllProvidersFailedError(attempts);
  }
}

export const aiService = new AIService();
