import type { FinanceTaskInput, FinanceTaskResult } from '../types.js';
import type { FinanceTaskRequest, FinanceTaskResponse } from '../adapters/types.js';
import { mapTaskRequest } from '../adapters/taskRequestMapper.js';
import { mapTaskResponse } from '../adapters/taskResponseMapper.js';
import { financeRuntimeBootstrap } from '../../bootstrap/runtimeBootstrap.js';

/**
 * Phase service boundary:
 * - Stable v1 methods keep phase-3 signatures for compatibility.
 * - Phase-4 mapped methods provide explicit request/response adapters.
 */
export class FinanceTaskService {
  constructor(private readonly runtime = financeRuntimeBootstrap()) {}

  // v1 compatibility surface
  runReportGeneration(input: Omit<FinanceTaskInput, 'taskType'>): Promise<FinanceTaskResult> {
    return this.runtime.run({ ...input, taskType: 'report_generation' });
  }

  runReviewGeneration(input: Omit<FinanceTaskInput, 'taskType'>): Promise<FinanceTaskResult> {
    return this.runtime.run({ ...input, taskType: 'review_generation' });
  }

  runExperimentEvaluation(input: Omit<FinanceTaskInput, 'taskType'>): Promise<FinanceTaskResult> {
    return this.runtime.run({ ...input, taskType: 'experiment_evaluation' });
  }

  // v2 mapped surface (Phase 4)
  async runReportGenerationMapped(request: FinanceTaskRequest): Promise<FinanceTaskResponse> {
    const raw = await this.runReportGeneration(mapTaskRequest(request, 'report_generation'));
    return mapTaskResponse(raw);
  }

  async runReviewGenerationMapped(request: FinanceTaskRequest): Promise<FinanceTaskResponse> {
    const raw = await this.runReviewGeneration(mapTaskRequest(request, 'review_generation'));
    return mapTaskResponse(raw);
  }

  async runExperimentEvaluationMapped(request: FinanceTaskRequest): Promise<FinanceTaskResponse> {
    const raw = await this.runExperimentEvaluation(mapTaskRequest(request, 'experiment_evaluation'));
    return mapTaskResponse(raw);
  }
}
