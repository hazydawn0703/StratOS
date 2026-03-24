import type { AdapterValidationIssue, FinanceTaskResponse } from '../adapters/types.js';

export type TransportStage = 'report' | 'review' | 'evaluation';

export interface TransportMeta {
  stage: TransportStage;
  startedAt: string;
  endedAt: string;
  durationMs: number;
}

export interface TaskTransportSuccess {
  ok: true;
  statusCode: 200;
  requestId: string;
  meta: TransportMeta;
  data: FinanceTaskResponse;
  error: null;
}

export interface TaskTransportFailure {
  ok: false;
  statusCode: 400;
  requestId: string;
  meta: TransportMeta;
  data: null;
  error: {
    code: 'VALIDATION_FAILED';
    issues: AdapterValidationIssue[];
  };
}

export type TaskTransportResponse = TaskTransportSuccess | TaskTransportFailure;
