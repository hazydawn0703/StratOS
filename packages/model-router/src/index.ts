import type { CompiledRoutingConfig } from '@stratos/strategy-compiler';

export interface RoutingPolicy {
  allowProviders?: string[];
  denyProviders?: string[];
}

export interface RouteMetadata {
  policyApplied: boolean;
  deniedProviders: string[];
  fallbackUsed: boolean;
}

export interface ModelRouteDecision {
  provider: string;
  reason: string;
  metadata: RouteMetadata;
}

export class ModelRouter {
  route(routing: CompiledRoutingConfig, policy: RoutingPolicy = {}): ModelRouteDecision {
    const deniedProviders = policy.denyProviders ?? [];
    const providers = routing.providers.filter((provider) => {
      const denied = deniedProviders.includes(provider);
      const allowed = policy.allowProviders ? policy.allowProviders.includes(provider) : true;
      return !denied && allowed;
    });

    const selected = providers[0] ?? 'mock';
    const fallbackUsed = !providers[0];
    return {
      provider: selected,
      reason: fallbackUsed
        ? 'fallback:mock(no-provider-matched-policy)'
        : `selected:${selected}`,
      metadata: {
        policyApplied: Boolean(policy.allowProviders?.length || policy.denyProviders?.length),
        deniedProviders,
        fallbackUsed
      }
    };
  }
}
