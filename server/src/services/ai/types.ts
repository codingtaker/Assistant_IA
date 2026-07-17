export interface AICompletionRequest {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AICompletionResponse {
  content: string;
  model: string;
  provider: string;

  tokensUsed?: {
    input: number;
    output: number;
    total: number;
  };
}
export interface AIProvider {
  name: string;
  complete(request: AICompletionRequest): Promise<AICompletionResponse>;

  isAvailable(): boolean;
}
