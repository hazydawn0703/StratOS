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
  routingLayer?: {
    providers?: string[];
    hints?: string[];
  };
}

export interface StrategyCompilerLike<TStrategy extends CompiledStrategyLike = CompiledStrategyLike> {
  compile(stus: STU[], taskContext: TaskContext): TStrategy;
}

export interface RuleExecutionResultLike<TEffects extends Record<string, unknown>, TLog> {
  effects: TEffects;
  logs: TLog[];
}

export interface RuleEngineLike<TEffects extends Record<string, unknown>, TLog> {
  runPreGeneration(
    rules: Rule[],
    context: TaskContext
  ): RuleExecutionResultLike<TEffects, TLog>;
  runPostGeneration(
    rules: Rule[],
    modelResponse: ModelResponse,
    context: TaskContext
  ): RuleExecutionResultLike<TEffects, TLog>;
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

export interface RuntimeKernelRouteConfig {
  modelLayer?: string;
  preferredProvider?: string;
  fallbackProvider?: string;
}

export interface RuntimeKernelResult<
  TStrategy extends CompiledStrategyLike,
  TEffects extends Record<string, unknown>,
  TLog
> {
  context: TaskContext;
  strategy: TStrategy;
  preEffects: TEffects;
  preLogs: TLog[];
  modelResponse: ModelResponse;
  postEffects: TEffects;
  postLogs: TLog[];
}


export interface StrategyExecutionContext<TStrategy extends CompiledStrategyLike = CompiledStrategyLike> {
  taskContext: TaskContext;
  strategy: TStrategy;
  promptLayer: string[];
  ruleLayer: Rule[];
  routingLayer?: TStrategy['routingLayer'];
}

/**
 * Cross-domain strategy runtime orchestration kernel.
 * App layers should provide domain-specific inputs/adapters but not re-implement this chain.
 */
export class StrategyRuntimeKernel<
  TStrategy extends CompiledStrategyLike = CompiledStrategyLike,
  TEffects extends Record<string, unknown> = Record<string, unknown>,
  TLog = unknown
> {
  constructor(
    private readonly taskRuntime: TaskRuntimeLike,
    private readonly stuRegistry: STURegistryLike,
    private readonly strategyCompiler: StrategyCompilerLike<TStrategy>,
    private readonly ruleEngine: RuleEngineLike<TEffects, TLog>,
    private readonly modelGateway: ModelGatewayLike,
    private readonly defaultRoute: RuntimeKernelRouteConfig = {
      modelLayer: 'default',
      preferredProvider: 'mock'
    }
  ) {}

  createExecutionContext(input: RuntimeKernelInput): StrategyExecutionContext<TStrategy> {
    const context = this.taskRuntime.createTaskContext(input);
    const activeStus = this.stuRegistry.getActive(context);
    const strategy = this.strategyCompiler.compile(activeStus, context);

    return {
      taskContext: context,
      strategy,
      promptLayer: strategy.promptLayer,
      ruleLayer: strategy.ruleLayer,
      routingLayer: strategy.routingLayer
    };
  }

  async run(input: RuntimeKernelInput): Promise<RuntimeKernelResult<TStrategy, TEffects, TLog>> {
    const execution = this.createExecutionContext(input);

    const pre = this.ruleEngine.runPreGeneration(execution.ruleLayer, execution.taskContext);
    const modelResponse = await this.modelGateway.generateText(execution.promptLayer.join('\n'), {
      taskType: execution.taskContext.taskType,
      modelLayer: this.defaultRoute.modelLayer ?? 'default',
      preferredProvider:
        this.defaultRoute.preferredProvider ?? execution.routingLayer?.providers?.[0],
      fallbackProvider: this.defaultRoute.fallbackProvider
    });
    const post = this.ruleEngine.runPostGeneration(execution.ruleLayer, modelResponse, execution.taskContext);

    return {
      context: execution.taskContext,
      strategy: execution.strategy,
      preEffects: pre.effects,
      preLogs: pre.logs,
      modelResponse,
      postEffects: post.effects,
      postLogs: post.logs
    };
  }
}
