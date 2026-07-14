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
 * Error codes that indicate a billing / credit problem on the current provider.
 * These are provider-specific strings embedded inside the SDK error object.
 *
 * OpenAI  — err.code === "insufficient_quota"
 * Anthropic — err.type === "payment_required" | status 402
 * Generic compatible providers may use similar codes.
 */
const BILLING_ERROR_CODES = new Set([
  "insufficient_quota",       // OpenAI
  "billing_hard_limit_reached", // OpenAI (older name)
  "payment_required",         // Anthropic / generic
  "credit_balance_insufficient", // Anthropic
  "out_of_credits",           // Groq, DeepSeek, etc.
  "quota_exceeded",           // Mistral / generic
  "insufficient_credits",     // generic
]);

/**
 * True when the error is specifically about the current provider having no
 * remaining credit/quota — meaning the *same request* will likely succeed on a
 * different provider, so fallback is strongly recommended.
 */
function isBillingError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const anyErr = err as { status?: number; code?: string; type?: string; message?: string };

  // HTTP 402 Payment Required (Anthropic credit exhausted)
  if (anyErr.status === 402) return true;

  // Provider-specific error codes attached to the SDK error
  if (typeof anyErr.code === "string" && BILLING_ERROR_CODES.has(anyErr.code)) return true;
  if (typeof anyErr.type === "string" && BILLING_ERROR_CODES.has(anyErr.type)) return true;

  // Fallback: scan the message for well-known phrases
  if (typeof anyErr.message === "string" &&
    /insufficient.*(quota|credit|fund|balance)|out of credit|billing limit|payment required/i
      .test(anyErr.message)
  ) {
    return true;
  }

  return false;
}

/**
 * Decide whether an error is transient and worth retrying on another provider.
 *
 * Retry on:
 *   - HTTP 402 (credit exhausted — Anthropic)
 *   - HTTP 408 (request timeout)
 *   - HTTP 429 (rate limit OR quota exceeded — both warrant trying another provider)
 *   - HTTP 5xx (server-side errors)
 *   - Network errors (ECONNREFUSED, ECONNRESET, ETIMEDOUT, ENOTFOUND, EAI_AGAIN, EPIPE)
 *   - Billing / credit error codes from any provider (see BILLING_ERROR_CODES)
 *
 * Do NOT retry on:
 *   - HTTP 400 (bad request — same payload will fail everywhere)
 *   - HTTP 401 (invalid API key — retrying with same key is pointless)
 *   - HTTP 403 (forbidden — permissions issue)
 *   - HTTP 404 (model not found)
 *   - Other 4xx not listed above
 */
function isRetryableError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;

  // Billing errors are always worth retrying on another provider
  if (isBillingError(err)) return true;

  const anyErr = err as { status?: number; code?: string; message?: string };

  if (typeof anyErr.status === "number") {
    // 402 already handled by isBillingError above, but keep explicit for clarity
    if (anyErr.status === 402) return true;
    if (anyErr.status === 408 || anyErr.status === 429) return true;
    if (anyErr.status >= 500 && anyErr.status < 600) return true;
    // All other 4xx: non-retryable (same input, same result)
    return false;
  }

  // Network-level errors (no HTTP status)
  const networkCodes = new Set([
    "ECONNREFUSED",
    "ECONNRESET",
    "ETIMEDOUT",
    "ENOTFOUND",
    "EAI_AGAIN",
    "EPIPE",
  ]);
  if (typeof anyErr.code === "string" && networkCodes.has(anyErr.code)) return true;

  if (
    typeof anyErr.message === "string" &&
    /socket hang up|network|fetch failed/i.test(anyErr.message)
  ) {
    return true;
  }

  return false;
}

function describeError(err: unknown): { status?: number; code?: string; message: string } {
  const anyErr = err as { status?: number; code?: string; type?: string; message?: string } | undefined;
  return {
    status: typeof anyErr?.status === "number" ? anyErr.status : undefined,
    // Prefer .code; fall back to .type (Anthropic uses .type in some errors)
    code: typeof anyErr?.code === "string"
      ? anyErr.code
      : typeof anyErr?.type === "string"
        ? anyErr.type
        : undefined,
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

        attempts.push({ provider: name, durationMs, status, code, message, re