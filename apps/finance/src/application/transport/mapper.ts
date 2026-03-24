import type { MappedExecutionResult } from '../adapters/types.js';
import type { TaskTransportResponse, TransportMeta } from './types.js';

export const mapMappedExecutionResultToTransport = (
  result: MappedExecutionResult,
  requestId: string,
  meta: TransportMeta
): TaskTransportResponse => {
  if (!result.ok || !result.response) {
    return {
      ok: false,
      statusCode: 400,
      requestId,
      meta,
      data: null,
      error: {
        code: 'VALIDATION_FAILED',
        issues: result.issues
      }
    };
  }

  return {
    ok: true,
    statusCode: 200,
    requestId,
    meta,
    data: result.response,
    error: null
  };
};
