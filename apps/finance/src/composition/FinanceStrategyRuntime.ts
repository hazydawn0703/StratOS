import { MockTaskRuntime, StrategyRuntimeKernel } from '@stratos/core';
import { ModelGateway, MockProviderAdapter } from '@stratos/model-gateway';
import { ModelRouter } from '@stratos/model-router';
import type { RuntimeEffects, RuleExecutionLog } from '@stratos/rule-engine';
import { RuleExecutionEngine } from '@stratos/rule-engine';
import type { CompiledStrategyBundle } from '@stratos/strategy-compiler';
import { StrategyCompiler } from '@stratos/strategy-compiler';
import { STURegistry } from '@stratos/stu-registry';
import type { STU } from '@stratos/shared-types';
import type { FinanceTaskInput, FinanceTaskResult } from '../application/types.js';

/**
 * Finance strategy runtime:
 * - delegates generic orchestration to package-level StrategyRuntimeKernel
 * - keeps finance app focused on bootstrap + domain wiring
 */
export class FinanceStrategyRuntime {
  private readonly taskRuntime = new MockTaskRuntime();
  private readonly modelGateway = new ModelGateway([new MockProviderAdapter()]);
  private readonly modelRouter = new ModelRouter();
  private readonly ruleEngine = new RuleExecutionEngine();
  private readonly strategyCompiler = new StrategyCompiler();
  private readonly stuRegistry = new STURegistry();
  private readonly kernel = new StrategyRuntimeKernel<CompiledStrategyBundle, RuntimeEffects, RuleExecutionLog>(
    this.taskRuntime,
    this.stuRegistry,
    this.strategyCompiler,
    this.ruleEngine,
    this.modelGateway
  );

  registerSTU(stu: STU): void {
    this.stuRegistry.register(stu);
  }

  run(input: FinanceTaskInput): Promise<FinanceTaskResult> {
    const runtimeRouting = (input.metadata?.runtimeRouting as Record<string, unknown> | undefined) ?? {};
    const providerCandidates = [String(runtimeRouting.provider ?? 'mock'), 'mock'];
    const decision = this.modelRouter.route(
      { providers: providerCandidates, hints: [] },
      { allowProviders: providerCandidates }
    );
    return this.kernel.run({
      ...input,
      runtimeRouting: {
        preferredProvider: decision.provider,
        fallbackProvider: String(runtimeRouting.fallbackProvider ?? 'mock'),
        preferredModel: String(runtimeRouting.defaultModelAlias ?? 'mock-model-v1'),
        modelLayer: String(runtimeRouting.structuredOutputMode ?? 'default')
      },
      metadata: {
        ...(input.metadata ?? {}),
        runtimeTrace: {
          routingDecision: decision,
          reviewerEnabled: runtimeRouting.reviewerEnabled !== false,
          reviewerModelAlias: runtimeRouting.reviewerModelAlias ?? null,
          guardrails: {
            cost: runtimeRouting.costGuardrail ?? null,
            latencyMs: runtimeRouting.latencyGuardrailMs ?? null
          },
          secretRefs: Array.isArray(runtimeRouting.secretRefKeys) ? runtimeRouting.secretRefKeys : []
        }
      }
    });
  }
}
