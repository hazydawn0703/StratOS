import type { FinanceTaskRequest } from '../adapters/types.js';
import { FinanceTaskService } from '../services/FinanceTaskService.js';
import { mapMappedExecutionResultToTransport } from './mapper.js';
import { buildTraceIds, finishTransportTimer, startTransportTimer } from './observability.js';
import type { TaskTransportResponse } from './types.js';

/**
 * Phase-7/8/9/10 placeholder transport facade.
 * Keeps HTTP/API details out while shaping transport-ready responses.
 */
export class FinanceTaskTransportFacade {
  private requestCounter = 0;

  constructor(private readonly service = new FinanceTaskService()) {}

  async report(request: FinanceTaskRequest, requestId?: string): Promise<TaskTransportResponse> {
    const id = requestId ?? this.createRequestId('report');
    const timer = startTransportTimer('report');
    const traceIds = buildTraceIds(id, 'report');
    const result = await this.service.runReportGenerationMappedSafe(request);
    return mapMappedExecutionResultToTransport(result, id, finishTransportTimer(timer, traceIds));
  }

  async review(request: FinanceTaskRequest, requestId?: string): Promise<TaskTransportResponse> {
    const id = requestId ?? this.createRequestId('review');
    const timer = startTransportTimer('review');
    const traceIds = buildTraceIds(id, 'review');
    const result = await this.service.runReviewGenerationMappedSafe(request);
    return mapMappedExecutionResultToTransport(result, id, finishTransportTimer(timer, traceIds));
  }

  async evaluation(request: FinanceTaskRequest, requestId?: string): Promise<TaskTransportResponse> {
    const id = requestId ?? this.createRequestId('evaluation');
    const timer = startTransportTimer('evaluation');
    const traceIds = buildTraceIds(id, 'evaluation');
    const result = await this.service.runExperimentEvaluationMappedSafe(request);
    return mapMappedExecutionResultToTransport(result, id, finishTransportTimer(timer, traceIds));
  }

  private createRequestId(prefix: string): string {
    this.requestCounter += 1;
    return `${prefix}-${Date.now()}-${this.requestCounter}`;
  }
}
