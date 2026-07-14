import { OpenAICompatibleProvider } from "./openai-compatible";

/**
 * Real OpenAI — thin wrapper over the generic OpenAI-compatible provider,
 * kept for backwards compatibility and clearer naming.
 */
export class OpenAIProvider extends OpenAICompatibleProvider {
  constructor() {
    super({
      name: "openai",
      apiKey: process.env.OPENAI_API_KEY,
      // baseURL omitted → SDK default (https://api.openai.com/v1)
      defaultModel: process.env.OPENAI_MODEL ?? "gpt-4o",
    });
  }
}
