import type { FinanceTaskResult } from '../types.js';
import type { FinanceTaskResponse } from './types.js';

export const mapTaskResponse = (result: FinanceTaskResult): FinanceTaskResponse => ({
  taskType: result.context.taskType,
  provider: result.modelResponse.provider,
  model: result.modelResponse.model,
  promptCount: result.strategy.promptLayer.length,
  ruleLogCount: result.preLogs.length + result.postLogs.length,
  hasError: Boolean(result.modelResponse.error)
});
