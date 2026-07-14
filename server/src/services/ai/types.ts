/**
 * Provider-agnostic input to any AI completion call.
 * All provider implementations (OpenAI, Anthropic, OpenAI-compatible) accept this shape.
 */
export interface AICompletionRequest {
  /** Instruction context prepended before the user turn (system role). */
  systemPrompt: string;
  /** The actual user message / task description. */
  userPrompt: string;
  /** Override the provider's default model (e.g. "gpt-4o-mini" for cheaper calls). */
  model?: string;
  /** Maximum tokens in the completion. Defaults to 2048. */
  maxTokens?: number;
  /** Sampling temperature in [0, 2]. Lower = more deterministic. Defaults to 0.7. */
  temperature?: number;
}

/** Normalised response returned by every provider regardless of the underlying SDK. */
export interface AICompletionResponse {
  /** Generated text content. */
  content: string;
  /** Resolved model name as reported by the provider (e.g. "gpt-4o-2024-08-06"). */
  model: string;
  /** Provider name that produced the response (e.g. "openai", "anthropic"). */
  provider: string;
  /** Token usage reported by the provider. May be absent for streaming or mock responses. */
  tokensUsed?: {
    input: number;
    output: number;
    total: number;
  };
}

/**
 * Contract every AI provider implementation must satisfy.
 * Adding a new provider = implementing this interface and registering it in `AIService`.
 */
export interface AIProvider {
  /** Unique identifier used as the provider key in the service registry. */
  name: string;
  /**
   * Send a completion request to the provider and return a normalised response.
   * Should throw with an `{ status, code, message }` shape on API errors so the
   * retry logic in `AIService` can classify retryable vs non-retryable failures.
   */
  complete(request: AICompletionRequest): Promise<AICompletionResponse>;
  /**
   * Returns true when the provider has all required configuration (API key, base URL…).
   * Called at startup and by `AIService.getAvailableProviders()`.
   */
  isAvailable(): boolean;
}
