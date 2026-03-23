import { MockTaskRuntime } from '@stratos/core';
import { ModelGateway, MockProviderAdapter } from '@stratos/model-gateway';
import { RuleExecutionEngine } from '@stratos/rule-engine';
import { StrategyCompiler } from '@stratos/strategy-compiler';
import { STURegistry } from '@stratos/stu-registry';
import type { STU } from '@stratos/shared-types';
import type { FinanceTaskInput, FinanceTaskResult } from '../application/types.js';

/**
 * Finance strategy runtime (phase skeleton):
 * - only wires framework packages
 * - keeps business logic/page/API out of app layer for now
 */
export class FinanceStrategyRuntime {
  private readonly taskRuntime = new MockTaskRuntime();
  private readonly modelGateway = new ModelGateway([new MockProviderAdapter()]);
  private readonly ruleEngine = new RuleExecutionEngine();
  private readonly strategyCompiler = new StrategyCompiler();
  private readonly stuRegistry = new STURegistry();

  registerSTU(stu: STU): void {
    this.stuRegistry.register(stu);
  }

  async run(input: FinanceTaskInput): Promise<FinanceTaskResult> {
    const context = this.taskRuntime.createTaskContext(input);
    const activeStus = this.stuRegistry.getActive(context);
    const strategy = this.strategyCompiler.compile(activeStus, context);

    const pre = this.ruleEngine.runPreGeneration(strategy.ruleLayer, context);
    const modelResponse = await this.modelGateway.generateText(
      strategy.promptLayer.join('\n') || 'mock finance prompt',
      {
        taskType: context.taskType,
        modelLayer: 'default',
        preferredProvider: 'mock'
      }
    );
    const post = this.ruleEngine.runPostGeneration(strategy.ruleLayer, modelResponse, context);

    return {
      context,
      strategy,
      preEffects: pre.effects,
      preLogs: pre.logs,
      modelResponse,
      postEffects: post.effects,
      postLogs: post.logs
    };
  }
}
