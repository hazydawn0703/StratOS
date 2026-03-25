import type { TraceIds, TransportMeta, TransportStage } from './types.js';

export interface TransportTimer {
  stage: TransportStage;
  startedAtMs: number;
}

export const startTransportTimer = (stage: TransportStage): TransportTimer => ({
  stage,
  startedAtMs: Date.now()
});

export const buildTraceIds = (requestId: string, stage: TransportStage): TraceIds => ({
  strategyTraceId: `${stage}-strategy-${requestId}`,
  ruleTraceId: `${stage}-rule-${requestId}`
});

export const finishTransportTimer = (timer: TransportTimer, traceIds: TraceIds): TransportMeta => {
  const endedAtMs = Date.now();
  return {
    stage: timer.stage,
    startedAt: new Date(timer.startedAtMs).toISOString(),
    endedAt: new Date(endedAtMs).toISOString(),
    durationMs: Math.max(endedAtMs - timer.startedAtMs, 0),
    traceIds
  };
};
