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
    this.statusCode = last?.status && last.status >= 400 && last.status < 600 ? last.status : 502;
  }
}

/**
 * Error codes that indicate a billing / credit problem on the current provider.
 */
const BILLING_ERROR_CODES = new Set([
  "insufficient_quota",
  "billing_hard_limit_reached",
  "payment_required",
  "credit_balance_insufficient",
  "out_of_credits",
  "quota_exceeded",
  "insufficient_credits",
]);

/**
 * Regex covering billing-related phrases across providers:
 */
const BILLING_MESSAGE_RE =
  /insufficient.*(quota|credit|fund|balance)|credit balance|balance is too low|out of credit|billing limit|payment required|plans.*billing|upgrade.*credit|purchase.*credit/i;

/**
 * True when the error is specifically about the current provider having no
 * remaining credit/quota — meaning the same request will likely succeed on a
 * different provider.
 */
function isBillingError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const anyErr = err as {
    status?: number;
    code?: string;
    type?: string;
    message?: string;
    error?: unknown;
  };

  if (anyErr.status === 402) return true;

  if (typeof anyErr.code === "string" && BILLING_ERROR_CODES.has(anyErr.code)) return true;
  if (typeof anyErr.type === "string" && BILLING_ERROR_CODES.has(anyErr.type)) return true;

  // Anthropic SDK wraps the parsed response body in err.error
  if (anyErr.error && typeof anyErr.error === "object") {
    const body = anyErr.error as { error?: { type?: string; message?: string } };
    if (body.error?.type && BILLING_ERROR_CODES.has(body.error.type)) return true;
    if (typeof body.error?.message === "string" && BILLING_MESSAGE_RE.test(body.error.message)) return true;
  }

  if (typeof anyErr.message === "string" && BILLING_MESSAGE_RE.test(anyErr.message)) return true;

  return false;
}

/**
 * Decide whether an error is transient and worth retrying on another provider.
 */
function isRetryableError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;

  if (isBillingError(err)) return true;

  const anyErr = err as { status?: number; code?: string; message?: string };

  if (typeof anyErr.status === "number") {
    if (anyErr.status === 402) return true;
    if (anyErr.status === 408 || anyErr.status === 429) return true;
    if (anyErr.status >= 500 && anyErr.status < 600) return true;
    return false;
  }

  const networkCodes = new Set([
    "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN", "EPIPE",
  ]);
  if (typeof anyErr.code === "string" && networkCodes.has(anyErr.code)) return true;

  if (
    typeof anyErr.message === "string" &&
    /socket hang up|network|fetch failed/i.test(anyErr.message)
  ) return true;

  return false;
}

function describeError(err: unknown): { status?: number; code?: string; message: string } {
  const anyErr = err as { status?: number; code?: string; type?: string; message?: string } | undefined;
  return {
    status: typeof anyErr?.status === "number" ? anyErr.status : undefined,
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
 * on transient / billing errors.
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
    if (available.length === 0) return [];

    const chain: ProviderName[] = [];

    // 1. Start with the explicitly requested provider (if available)
    if (requested && available.includes(requested)) {
      chain.push(requested);
    } else if (!requested && available.includes(this.defaultProvider)) {
      chain.push(this.defaultProvider);
    } else if (available.length > 0) {
      chain.push(available[0]);
    }

    // 2. Append fallback order, skipping already-added entries
    for (const id of this.fallbackOrder) {
      if (!chain.includes(id) && available.includes(id)) {
        chain.push(id);
      }
    }

    // 3. Append any remaining available providers not in the fallback list
    for (const id of available) {
      if (!chain.includes(id)) chain.push(id);
    }

    return chain;
  }

  /**
   * Run an AI completion request, falling back through providers on retryable errors.
   * @param request   Completion parameters.
   * @param providerName  Optional provider ID override (user selection).
   */
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
        "No AI provider is configured. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or another provider's API key."
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
        console.info(
          `[AI ${requestId}] Provider "${name}" succeeded (${durationMs}ms)`
        );
        return result;
      } catch (err) {
        const durationMs = Date.now() - started;
        const { status, code, message } = describeError(err);
        const billing = isBillingError(err);
        const retryable = isRetryableError(err);

        const attempt: ProviderAttempt = {
          provider: name,
          durationMs,
          status,
          code,
          message,
          retryable,
        };
        attempts.push(attempt);

        const reason = billing
          ? "BILLING/CREDIT ERROR — switching provider"
          : retryable
            ? "retryable error — trying next provider"
            : `NON-RETRYABLE error (status=${status ?? "?"}, code=${code ?? "?"}, ${durationMs}ms)`;

        console.warn(
          `[AI ${requestId}] Provider "${name}" failed [${reason}] (${durationMs}ms): ${message}`
        );

        if (!retryable || i === order.length - 1) {
          // Non-retryable error or last provider — stop
          throw new AIAllProvidersFailedError(attempts);
        }

        // Log the next provider we'll try
        const nextName = order[i + 1];
        if (nextName) {
          console.info(
            `[AI ${requestId}] — switching to "${nextName}"`
          );
        }
      }
    }

    // Should never reach here
    throw new AIAllProvidersFailedError(attempts);
  }
}

export const aiService = new AIService(buildProviderRegistry());
