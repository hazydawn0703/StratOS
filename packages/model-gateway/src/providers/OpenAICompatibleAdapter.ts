import type { ModelResponse } from '@stratos/shared-types';
import type { ProviderAdapter } from '../types.js';

export class OpenAICompatibleAdapter implements ProviderAdapter {
  readonly name = 'openai-compatible-placeholder';

  supportsStructuredJson(): boolean {
    return true;
  }

  async generate(_input: {
    prompt: string;
    tools?: unknown[];
    responseFormat?: 'text' | 'json';
    model?: string;
  }): Promise<ModelResponse> {
    throw new Error('OpenAICompatibleAdapter is a placeholder in initialization phase.');
  }
}
