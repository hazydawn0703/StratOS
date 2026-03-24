import type { MappedExecutionResult } from '../adapters/types.js';
import type { TaskTransportResponse } from './types.js';

export const mapMappedExecutionResultToTransport = (
  result: MappedExecutionResult
): TaskTransportResponse => {
  if (!result.ok || !result.response) {
    return {
      ok: false,
      statusCode: 400,
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
    data: result.response,
    error: null
  };
};
