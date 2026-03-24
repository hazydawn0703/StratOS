export interface ModelResponse {
  text?: string;
  json?: Record<string, unknown>;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  provider: string;
  model: string;
  latencyMs: number;
  error?: string;
}
