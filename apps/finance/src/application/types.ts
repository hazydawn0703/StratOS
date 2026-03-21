import type { ModelResponse, TaskContext } from '@stratos/shared-types';
import type { CompiledStrategyBundle } from '@stratos/strategy-compiler';
import type { RuntimeEffects, RuleExecutionLog } from '@stratos/rule-engine';

export interface FinanceTaskInput {
  taskType: string;
  thesisType: string;
  riskLevel: 'low' | 'medium' | 'high';
  ticker?: string;
  metadata?: Record<string, unknown>;
}

export interface FinanceTaskResult {
  context: TaskContext;
  strategy: CompiledStrategyBundle;
  preEffects: RuntimeEffects;
  preLogs: RuleExecutionLog[];
  modelResponse: ModelResponse;
  postEffects: RuntimeEffects;
  postLogs: RuleExecutionLog[];
}
