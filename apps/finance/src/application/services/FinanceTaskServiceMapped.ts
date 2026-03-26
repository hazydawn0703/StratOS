import type { FinanceTaskResponse, FinanceTaskRequest, MappedExecutionResult } from '../adapters/types.js';
import { FinanceTaskService } from './FinanceTaskService.js';

/**
 * Compatibility facade kept for historical imports.
 * Canonical mapped implementation now lives in FinanceTaskService.
 */
export class FinanceTaskServiceMapped {
  constructor(private readonly service = new FinanceTaskService()) {}

  runReportGenerationMapped(request: FinanceTaskRequest): Promise<FinanceTaskResponse> {
    return this.service.runReportGenerationMapped(request);
  }

  runReviewGenerationMapped(request: FinanceTaskRequest): Promise<FinanceTaskResponse> {
    return this.service.runReviewGenerationMapped(request);
  }

  runExperimentEvaluationMapped(request: FinanceTaskRequest): Promise<FinanceTaskResponse> {
    return this.service.runExperimentEvaluationMapped(request);
  }

  runReportGenerationMappedSafe(request: FinanceTaskRequest): Promise<MappedExecutionResult> {
    return this.service.runReportGenerationMappedSafe(request);
  }

  runReviewGenerationMappedSafe(request: FinanceTaskRequest): Promise<MappedExecutionResult> {
    return this.service.runReviewGenerationMappedSafe(request);
  }

  runExperimentEvaluationMappedSafe(request: FinanceTaskRequest): Promise<MappedExecutionResult> {
    return this.service.runExperimentEvaluationMappedSafe(request);
  }
}
