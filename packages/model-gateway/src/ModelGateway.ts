import type { ModelResponse } from '@stratos/shared-types';
import type { ProviderAdapter, RoutingInput } from './types.js';

export class ModelGateway {
  constructor(private readonly providers: ProviderAdapter[]) {}

  private resolveProvider(routing: RoutingInput): ProviderAdapter {
    return (
      this.providers.find((provider) => provider.name === routing.preferredProvider) ??
      this.providers.find((provider) => provider.name === routing.fallbackProvider) ??
      this.providers[0]
    );
  }

  async generateText(prompt: string, routing: RoutingInput): Promise<ModelResponse> {
    return this.resolveProvider(routing).generate({
      prompt,
      responseFormat: 'text',
      model: routing.preferredModel
    });
  }

  async generateStructuredJson(prompt: string, routing: RoutingInput): Promise<ModelResponse> {
    const provider = this.resolveProvider(routing);
    if (!provider.supportsStructuredJson()) {
      throw new Error(`Provider ${provider.name} does not support structured json.`);
    }

    return provider.generate({ prompt, responseFormat: 'json', model: routing.preferredModel });
  }

  async generateWithTools(
    prompt: string,
    tools: unknown[],
    routing: RoutingInput
  ): Promise<ModelResponse> {
    return this.resolveProvider(routing).generate({
      prompt,
      tools,
      responseFormat: 'text',
      model: routing.preferredModel
    });
  }
}
