import type { FinanceTaskRequest } from '../adapters/types.js';
import { FinanceTaskService } from '../services/FinanceTaskService.js';
import { mapMappedExecutionResultToTransport } from './mapper.js';
import type { TaskTransportResponse } from './types.js';

/**
 * Phase-7/8 placeholder transport facade.
 * Keeps HTTP/API details out while shaping transport-ready responses.
 */
export class FinanceTaskTransportFacade {
  private requestCounter = 0;

  constructor(private readonly service = new FinanceTaskService()) {}

  async report(request: FinanceTaskRequest, requestId?: string): Promise<TaskTransportResponse> {
    const id = requestId ?? this.createRequestId('report');
    const result = await this.service.runReportGenerationMappedSafe(request);
    return mapMappedExecutionResultToTransport(result, id);
  }

  async review(request: FinanceTaskRequest, requestId?: string): Promise<TaskTransportResponse> {
    const id = requestId ?? this.createRequestId('review');
    const result = await this.service.runReviewGenerationMappedSafe(request);
    return mapMappedExecutionResultToTransport(result, id);
  }

  async evaluation(request: FinanceTaskRequest, requestId?: string): Promise<TaskTransportResponse> {
    const id = requestId ?? this.createRequestId('evaluation');
    const result = await this.service.runExperimentEvaluationMappedSafe(request);
    return mapMappedExecutionResultToTransport(result, id);
  }

  private createRequestId(prefix: string): string {
    this.requestCounter += 1;
    return `${prefix}-${Date.now()}-${this.requestCounter}`;
  }
}
