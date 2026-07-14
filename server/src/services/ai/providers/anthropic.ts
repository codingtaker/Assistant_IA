import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, AICompletionRequest, AICompletionResponse } from "../types";

export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";
  private client: Anthropic | null = null;
  private defaultModel: string;

  constructor() {
    this.defaultModel =
      process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-20241022";
    if (process.env.ANTHROPIC_API_KEY) {
      this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.client) {
      throw new Error(
        "Anthropic provider is not configured. Set ANTHROPIC_API_KEY."
      );
    }

    const model = request.model ?? this.defaultModel;

    const response = await this.client.messages.create({
      model,
      max_tokens: request.maxTokens ?? 2048,
      temperature: request.temperature ?? 0.7,
      system: request.systemPrompt,
      messages: [{ role: "user", content: request.userPrompt }],
    });

    const content =
      response.content
        .filter((block) => block.type === "text")
        .map((block) => (block as { type: "text"; text: string }).text)
        .join("") ?? "";

    const usage = response.usage;

    return {
      content,
      model,
      provider: this.name,
      tokensUsed: {
        input: usage.input_tokens,
        output: usage.output_tokens,
        total: usage.input_tokens + usage.output_tokens,
      },
    };
  }
}
