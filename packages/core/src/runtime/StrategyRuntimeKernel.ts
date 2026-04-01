import type { ModelResponse, Rule, STU, TaskContext } from '@stratos/shared-types';

export interface TaskRuntimeLike {
  createTaskContext(seed: Partial<TaskContext>): TaskContext;
}

export interface RuntimeCompilationInput {
  active_stus: STU[];
  experiment_stus: STU[];
  candidate_stus: STU[];
}

export interface STURegistryLike {
  getActive(taskContext: TaskContext): STU[];
  getCompilationInput?(taskContext: TaskContext, options?: { includeCandidates?: boolean }): RuntimeCompilationInput;
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
  compile(stus: STU[] | RuntimeCompilationInput, taskContext: TaskContext): TStrategy;
}

export interface RuleExecutionResultLike<TEffects extends object, TLog> {
  effects: TEffects;
  logs: TLog[];
}

export interface RuleEngineLike<TEffects extends object, TLog> {
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
      preferredModel?: string;
    }
  ): Promise<ModelResponse>;
}

export interface RuntimeKernelInput extends Partial<TaskContext> {
  taskType: string;
  runtimeRouting?: {
    preferredProvider?: string;
    fallbackProvider?: string;
    preferredModel?: string;
    modelLayer?: string;
  };
}

export interface RuntimeKernelRouteConfig {
  modelLayer?: string;
  preferredProvider?: string;
  fallbackProvider?: string;
}

export interface RuntimeKernelResult<
  TStrategy extends CompiledStrategyLike,
  TEffects extends object,
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
  TEffects extends object = Record<string, unknown>,
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
    const compileInput =
      this.stuRegistry.getCompilationInput?.(context, { includeCandidates: false }) ??
      this.stuRegistry.getActive(context);
    const strategy = this.strategyCompiler.compile(compileInput, context);

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
      modelLayer: input.runtimeRouting?.modelLayer ?? this.defaultRoute.modelLayer ?? 'default',
      preferredProvider:
        input.runtimeRouting?.preferredProvider ??
        this.defaultRoute.preferredProvider ??
        execution.routingLayer?.providers?.[0],
      fallbackProvider: input.runtimeRouting?.fallbackProvider ?? this.defaultRoute.fallbackProvider,
      preferredModel: input.runtimeRouting?.preferredModel
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
