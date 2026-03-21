import type { FinanceTaskInput } from '../types.js';
import type { FinanceTaskRequest } from './types.js';

export const mapTaskRequest = (
  request: FinanceTaskRequest,
  taskType: FinanceTaskInput['taskType']
): FinanceTaskInput => ({
  taskType,
  thesisType: request.thesisType,
  riskLevel: request.riskLevel,
  ticker: request.ticker,
  metadata: request.metadata
});
