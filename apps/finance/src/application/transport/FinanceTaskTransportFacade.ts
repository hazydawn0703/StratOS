import type { FinanceTaskRequest } from '../adapters/types.js';
import { FinanceTaskService } from '../services/FinanceTaskService.js';
import { mapMappedExecutionResultToTransport } from './mapper.js';
import type { TaskTransportResponse } from './types.js';

/**
 * Phase-7 placeholder transport facade.
 * Keeps HTTP/API details out while shaping transport-ready responses.
 */
export class FinanceTaskTransportFacade {
  constructor(private readonly service = new FinanceTaskService()) {}

  async report(request: FinanceTaskRequest): Promise<TaskTransportResponse> {
    const result = await this.service.runReportGenerationMappedSafe(request);
    return mapMappedExecutionResultToTransport(result);
  }

  async review(request: FinanceTaskRequest): Promise<TaskTransportResponse> {
    const result = await this.service.runReviewGenerationMappedSafe(request);
    return mapMappedExecutionResultToTransport(result);
  }

  async evaluation(request: FinanceTaskRequest): Promise<TaskTransportResponse> {
    const result = await this.service.runExperimentEvaluationMappedSafe(request);
    return mapMappedExecutionResultToTransport(result);
  }
}
