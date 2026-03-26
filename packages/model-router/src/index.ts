import type { CompiledRoutingConfig } from '@stratos/strategy-compiler';

export interface RoutingPolicy {
  allowProviders?: string[];
  denyProviders?: string[];
}

export interface ModelRouteDecision {
  provider: string;
  reason: string;
}

export class ModelRouter {
  route(routing: CompiledRoutingConfig, policy: RoutingPolicy = {}): ModelRouteDecision {
    const providers = routing.providers.filter((provider) => {
      const denied = policy.denyProviders?.includes(provider) ?? false;
      const allowed = policy.allowProviders ? policy.allowProviders.includes(provider) : true;
      return !denied && allowed;
    });

    const selected = providers[0] ?? 'mock';
    return {
      provider: selected,
      reason: providers[0]
        ? `selected:${selected}`
        : 'fallback:mock(no-provider-matched-policy)'
    };
  }
}
