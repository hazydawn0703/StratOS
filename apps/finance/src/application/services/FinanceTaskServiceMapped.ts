import type { FinanceTaskResponse, FinanceTaskRequest, MappedExecutionResult } from '../adapters/types.js';
import { mapTaskRequest } from '../adapters/taskRequestMapper.js';
import { mapTaskResponse } from '../adapters/taskResponseMapper.js';
import { assertValidTaskRequest, validateTaskRequestResult } from '../adapters/validation.js';
import { FinanceTaskService } from './FinanceTaskService.js';

/**
 * Phase-4 mapped service kept in standalone file to avoid merge hotspots in
 * phase-3 stable service files.
 */
export class FinanceTaskServiceMapped {
  constructor(private readonly service = new FinanceTaskService()) {}

  async runReportGenerationMapped(request: FinanceTaskRequest): Promise<FinanceTaskResponse> {
    assertValidTaskRequest(request);
    const raw = await this.service.runReportGeneration(mapTaskRequest(request, 'report_generation'));
    return mapTaskResponse(raw);
  }

  async runReviewGenerationMapped(request: FinanceTaskRequest): Promise<FinanceTaskResponse> {
    assertValidTaskRequest(request);
    const raw = await this.service.runReviewGeneration(mapTaskRequest(request, 'review_generation'));
    return mapTaskResponse(raw);
  }

  async runExperimentEvaluationMapped(request: FinanceTaskRequest): Promise<FinanceTaskResponse> {
    assertValidTaskRequest(request);
    const raw = await this.service.runExperimentEvaluation(mapTaskRequest(request, 'experiment_evaluation'));
    return mapTaskResponse(raw);
  }
  async runReportGenerationMappedSafe(request: FinanceTaskRequest): Promise<MappedExecutionResult> {
    const validation = validateTaskRequestResult(request);
    if (!validation.ok) return { ok: false, issues: validation.issues };

    const response = await this.runReportGenerationMapped(request);
    return { ok: true, response, issues: [] };
  }

  async runReviewGenerationMappedSafe(request: FinanceTaskRequest): Promise<MappedExecutionResult> {
    const validation = validateTaskRequestResult(request);
    if (!validation.ok) return { ok: false, issues: validation.issues };

    const response = await this.runReviewGenerationMapped(request);
    return { ok: true, response, issues: [] };
  }

  async runExperimentEvaluationMappedSafe(request: FinanceTaskRequest): Promise<MappedExecutionResult> {
    const validation = validateTaskRequestResult(request);
    if (!validation.ok) return { ok: false, issues: validation.issues };

    const response = await this.runExperimentEvaluationMapped(request);
    return { ok: true, response, issues: [] };
  }

}
