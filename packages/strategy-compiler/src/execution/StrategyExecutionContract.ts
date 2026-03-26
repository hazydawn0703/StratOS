import type { TaskContext } from '@stratos/shared-types';
import type { CompiledStrategyBundle } from '../types.js';

export interface PromptExecutionInput {
  promptLayer: string[];
  taskType: string;
}

export interface RuleExecutionInput {
  ruleLayer: CompiledStrategyBundle['ruleLayer'];
  taskContext: TaskContext;
}

export interface RoutingExecutionInput {
  routingLayer: CompiledStrategyBundle['routingLayer'];
  taskContext: TaskContext;
}

export interface StrategyExecutionContract {
  prompt: PromptExecutionInput;
  rules: RuleExecutionInput;
  routing: RoutingExecutionInput;
}

export const buildStrategyExecutionContract = (
  bundle: CompiledStrategyBundle,
  taskContext: TaskContext
): StrategyExecutionContract => ({
  prompt: {
    promptLayer: bundle.promptLayer,
    taskType: taskContext.taskType
  },
  rules: {
    ruleLayer: bundle.ruleLayer,
    taskContext
  },
  routing: {
    routingLayer: bundle.routingLayer,
    taskContext
  }
});
