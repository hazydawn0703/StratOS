import type { FinanceTaskInput, FinanceTaskResult } from '../types.js';
import type { FinanceTaskRequest, FinanceTaskResponse, MappedExecutionResult } from '../adapters/types.js';
import { mapTaskRequest } from '../adapters/taskRequestMapper.js';
import { mapTaskResponse } from '../adapters/taskResponseMapper.js';
import { assertValidTaskRequest, validateTaskRequestResult } from '../adapters/validation.js';
import { financeRuntimeBootstrap } from '../../bootstrap/runtimeBootstrap.js';

/**
 * Phase service boundary:
 * app-facing entrypoints map to framework pipeline task types,
 * while keeping finance business logic out of this layer.
 */
export class FinanceTaskService {
  constructor(private readonly runtime = financeRuntimeBootstrap()) {}

  // phase-3 stable surface
  runReportGeneration(input: Omit<FinanceTaskInput, 'taskType'>): Promise<FinanceTaskResult> {
    return this.runtime.run({ ...input, taskType: 'report_generation' });
  }

  runReviewGeneration(input: Omit<FinanceTaskInput, 'taskType'>): Promise<FinanceTaskResult> {
    return this.runtime.run({ ...input, taskType: 'review_generation' });
  }

  runExperimentEvaluation(input: Omit<FinanceTaskInput, 'taskType'>): Promise<FinanceTaskResult> {
    return this.runtime.run({ ...input, taskType: 'experiment_evaluation' });
  }

  // phase-4 mapped surface
  async runReportGenerationMapped(request: FinanceTaskRequest): Promise<FinanceTaskResponse> {
    assertValidTaskRequest(request);
    const raw = await this.runReportGeneration(mapTaskRequest(request, 'report_generation'));
    return mapTaskResponse(raw);
  }

  async runReviewGenerationMapped(request: FinanceTaskRequest): Promise<FinanceTaskResponse> {
    assertValidTaskRequest(request);
    const raw = await this.runReviewGeneration(mapTaskRequest(request, 'review_generation'));
    return mapTaskResponse(raw);
  }

  async runExperimentEvaluationMapped(request: FinanceTaskRequest): Promise<FinanceTaskResponse> {
    assertValidTaskRequest(request);
    const raw = await this.runExperimentEvaluation(mapTaskRequest(request, 'experiment_evaluation'));
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
