import { MockTaskRuntime, StrategyRuntimeKernel } from '@stratos/core';
import { ModelGateway, MockProviderAdapter } from '@stratos/model-gateway';
import { RuleExecutionEngine } from '@stratos/rule-engine';
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
  private readonly ruleEngine = new RuleExecutionEngine();
  private readonly strategyCompiler = new StrategyCompiler();
  private readonly stuRegistry = new STURegistry();
  private readonly kernel = new StrategyRuntimeKernel(
    this.taskRuntime,
    this.stuRegistry,
    this.strategyCompiler,
    this.ruleEngine,
    this.modelGateway
  );

  registerSTU(stu: STU): void {
    this.stuRegistry.register(stu);
  }

  async run(input: FinanceTaskInput): Promise<FinanceTaskResult> {
    const result = await this.kernel.run(input);
    return {
      ...result,
      strategy: result.strategy as FinanceTaskResult['strategy'],
      preEffects: result.preEffects as FinanceTaskResult['preEffects'],
      preLogs: result.preLogs as FinanceTaskResult['preLogs'],
      postEffects: result.postEffects as FinanceTaskResult['postEffects'],
      postLogs: result.postLogs as FinanceTaskResult['postLogs']
    };
  }
}
