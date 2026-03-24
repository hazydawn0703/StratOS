import type { AdapterValidationIssue, FinanceTaskResponse } from '../adapters/types.js';

export interface TaskTransportSuccess {
  ok: true;
  statusCode: 200;
  data: FinanceTaskResponse;
  error: null;
}

export interface TaskTransportFailure {
  ok: false;
  statusCode: 400;
  data: null;
  error: {
    code: 'VALIDATION_FAILED';
    issues: AdapterValidationIssue[];
  };
}

export type TaskTransportResponse = TaskTransportSuccess | TaskTransportFailure;
