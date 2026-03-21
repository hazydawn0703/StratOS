import type { ModelResponse } from '@stratos/shared-types';
import type { ProviderAdapter } from '../types.js';

export class MockProviderAdapter implements ProviderAdapter {
  readonly name = 'mock';

  supportsStructuredJson(): boolean {
    return true;
  }

  async generate(input: {
    prompt: string;
    tools?: unknown[];
    responseFormat?: 'text' | 'json';
  }): Promise<ModelResponse> {
    return {
      provider: this.name,
      model: 'mock-model-v1',
      latencyMs: 1,
      text: input.responseFormat === 'json' ? undefined : `MOCK:${input.prompt}`,
      json: input.responseFormat === 'json' ? { echoedPrompt: input.prompt } : undefined
    };
  }
}
