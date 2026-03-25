import type { ModelResponse, Rule, STU, TaskContext } from '@stratos/shared-types';

export interface TaskRuntimeLike {
  createTaskContext(seed: Partial<TaskContext>): TaskContext;
}

export interface STURegistryLike {
  getActive(taskContext: TaskContext): STU[];
}

export interface CompiledStrategyLike {
  promptLayer: string[];
  ruleLayer: Rule[];
}

export interface StrategyCompilerLike {
  compile(stus: STU[], taskContext: TaskContext): CompiledStrategyLike;
}

export interface RuleExecutionResultLike {
  effects: Record<string, unknown>;
  logs: unknown[];
}

export interface RuleEngineLike {
  runPreGeneration(rules: Rule[], context: TaskContext): RuleExecutionResultLike;
  runPostGeneration(rules: Rule[], modelResponse: ModelResponse, context: TaskContext): RuleExecutionResultLike;
}

export interface ModelGatewayLike {
  generateText(
    prompt: string,
    input: {
      taskType: string;
      modelLayer: string;
      preferredProvider?: string;
      fallbackProvider?: string;
    }
  ): Promise<ModelResponse>;
}

export interface RuntimeKernelInput extends Partial<TaskContext> {
  taskType: string;
}

export interface RuntimeKernelResult {
  context: TaskContext;
  strategy: CompiledStrategyLike;
  preEffects: Record<string, unknown>;
  preLogs: unknown[];
  modelResponse: ModelResponse;
  postEffects: Record<string, unknown>;
  postLogs: unknown[];
}

/**
 * Cross-domain strategy runtime orchestration kernel.
 * App layers should provide domain-specific inputs/adapters but not re-implement this chain.
 */
export class StrategyRuntimeKernel {
  constructor(
    private readonly taskRuntime: TaskRuntimeLike,
    private readonly stuRegistry: STURegistryLike,
    private readonly strategyCompiler: StrategyCompilerLike,
    private readonly ruleEngine: RuleEngineLike,
    private readonly modelGateway: ModelGatewayLike
  ) {}

  async run(input: RuntimeKernelInput): Promise<RuntimeKernelResult> {
    const context = this.taskRuntime.createTaskContext(input);
    const activeStus = this.stuRegistry.getActive(context);
    const strategy = this.strategyCompiler.compile(activeStus, context);

    const pre = this.ruleEngine.runPreGeneration(strategy.ruleLayer, context);
    const modelResponse = await this.modelGateway.generateText(strategy.promptLayer.join('\n'), {
      taskType: context.taskType,
      modelLayer: 'default',
      preferredProvider: 'mock'
    });
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
