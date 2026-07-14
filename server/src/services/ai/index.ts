import type { AIProvider, AICompletionRequest, AICompletionResponse } from "./types";
import { buildProviderRegistry, type ProviderRegistry } from "./providers/registry";
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

/**
 * Orchestrates AI completion across a set of providers with automatic fallback
 * on transient errors. Provider discovery lives in `providers/registry.ts` — this
 * class only handles routing, fallback logic, and observability.
 */
export class AIService {
  private readonly providers: Map<ProviderName, AIProvider>;
  private readonly defaultProvider: ProviderName;
  private readonly fallbackOrder: ProviderName[];

  constructor(registry: ProviderRegistry) {
    this.providers = registry.providers;
    this.defaultProvider = registry.defaultProvider;
    this.fallbackOrder = registry.fallbackOrder;
  }

  /** List provider IDs that are configured and ready to accept requests. */
  getAvailableProviders(): ProviderName[] {
    return Array.from(this.providers.entries())
      .filter(([, p]) => p.isAvailable())
      .map(([name]) => name);
  }

  /**
   * Build the ordered list of providers to try for a given request.
   * Priority: explicit request > default > fallback chain > any other available.
   */
  private planAttempts(requested?: ProviderName): ProviderName[] {
    const available = this.getAvailableProviders();
    const availableSet = new Set(available);

    const head =
      requested && availableSet.has(requested)
        ? requested
        : availableSet.has(this.defaultProvider)
          ? this.defaultProvider
          : this.fallbackOrder.find((id) => availableSet.has(id)) ?? available[0];

    if (!head) return [];

    const chain = [head, ...this.fallbackOrder.filter((id) => id !== head && availableSet.has(id))];

    // Ensure any remaining available providers still get a chance (in registration order).
    for (const id of available) {
      if (!chain.includes(id)) chain.push(id);
    }
    return chain;
  }

  async complete(
    request: AICompletionRequest,
    providerName?: ProviderName
  ): Promise<AICompletionResponse> {
    const requestId = randomUUID().slice(0, 8);

    if (providerName && !this.providers.has(providerName)) {
      throw new Error(`Unknown AI provider: ${providerName}`);
    }

    const order = this.planAttempts(providerName);
    if (order.length === 0) {
      throw new Error(
        "No AI provider is configured. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or an EXTRA_PROVIDERS entry."
      );
    }

    if (providerName && order[0] !== providerName) {
      console.warn(
        `[AI ${requestId}] Requested provider "${providerName}" not available — starting with "${order[0]}"`
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

    console.error(
      `[AI ${requestId}] All ${attempts.length} provider attempt(s) failed:`,
      attempts.map((a) => `${a.provider}(status=${a.status ?? "?"}, ${a.durationMs}ms)`).join(" → ")
    );
    throw new AIAllProvidersFailedError(attempts);
  }
}

// Default singleton built from environment. Tests can construct their own AIService.
export const aiService = new AIService(buildProviderRegistry());
