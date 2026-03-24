import type { FinanceTaskRequest } from '../adapters/types.js';
import type { TaskTransportResponse } from './types.js';

export type FinanceEndpointName = 'report' | 'review' | 'evaluation';

export interface FinanceEndpointRequest {
  endpoint: FinanceEndpointName;
  requestId?: string;
  payload: FinanceTaskRequest;
}

export interface FinanceEndpointHandler {
  handle(request: FinanceEndpointRequest): Promise<TaskTransportResponse>;
}
