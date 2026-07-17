import OpenAI from "openai";
import type {
  AIProvider,
  AICompletionRequest,
  AICompletionResponse,
} from "../types";

export interface OpenAICompatibleConfig {
  /** Identifier used by the client and in logs (e.g. "openai", "rodium", "groq"). */
  name: string;
  /** API key. If empty/undefined the provider will report itself unavailable. */
  apiKey?: string;
  /** Base URL. Defaults to https://api.openai.com/v1 (i.e. real OpenAI). */
  baseURL?: string;
  /** Default model to use when the request doesn't specify one. */
  defaultModel: string;
  /** Optional extra headers (e.g. for OpenRouter's X-Title / HTTP-Referer). */
  defaultHeaders?: Record<string, string>;
}

/**
 * Generic provider for any OpenAI-compatible API:
 */
export class OpenAICompatibleProvider implements AIProvider {
  readonly name: string;
  private client: OpenAI | null = null;
  private defaultModel: string;

  constructor(config: OpenAICompatibleConfig) {
    this.name = config.name;
    this.defaultModel = config.defaultModel;

    if (config.apiKey) {
      this.client = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseURL,
        defaultHeaders: config.defaultHeaders,
      });
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.client) {
      throw new Error(
        `Provider "${this.name}" is not configured (missing API key).`
      );
    }

    const model = request.model ?? this.defaultModel;

    const response = await this.client.chat.completions.create({
      model,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 2048,
      messages: [
        { role: "system", content: request.systemPrompt },
        { role: "user", content: request.userPrompt },
      ],
    });

    const content = response.choices[0]?.message?.content ?? "";
    const usage = response.usage;

    return {
      content,
      model,
      provider: this.name,
      tokensUsed: usage
        ? {
            input: usage.prompt_tokens,
            output: usage.completion_tokens,
            total: usage.total_tokens,
          }
        : undefined,
    };
  }
}
