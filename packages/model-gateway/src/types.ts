import type { ModelResponse } from '@stratos/shared-types';

export interface RoutingInput {
  taskType: string;
  modelLayer: string;
  preferredProvider?: string;
  fallbackProvider?: string;
  preferredModel?: string;
}

export interface ProviderAdapter {
  readonly name: string;
  supportsStructuredJson(): boolean;
  generate(input: {
    prompt: string;
    tools?: unknown[];
    responseFormat?: 'text' | 'json';
    model?: string;
  }): Promise<ModelResponse>;
}
