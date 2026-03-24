import type { MappedExecutionResult } from '../adapters/types.js';
import type { TaskTransportResponse } from './types.js';

export const mapMappedExecutionResultToTransport = (
  result: MappedExecutionResult,
  requestId: string
): TaskTransportResponse => {
  if (!result.ok || !result.response) {
    return {
      ok: false,
      statusCode: 400,
      requestId,
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
    data: result.response,
    error: null
  };
};
