import type { FinanceTaskResult } from '../types.js';
import type { FinanceTaskRequest, FinanceTaskResponse } from '../adapters/types.js';
import { mapTaskRequest } from '../adapters/taskRequestMapper.js';
import { mapTaskResponse } from '../adapters/taskResponseMapper.js';
import { financeRuntimeBootstrap } from '../../bootstrap/runtimeBootstrap.js';

/**
 * Phase service boundary:
 * app-facing entrypoints map to framework pipeline task types,
 * while keeping finance business logic out of this layer.
 */
export class FinanceTaskService {
  constructor(private readonly runtime = financeRuntimeBootstrap()) {}

  async runReportGeneration(request: FinanceTaskRequest): Promise<FinanceTaskResponse> {
    const raw = await this.runRaw(mapTaskRequest(request, 'report_generation'));
    return mapTaskResponse(raw);
  }

  async runReviewGeneration(request: FinanceTaskRequest): Promise<FinanceTaskResponse> {
    const raw = await this.runRaw(mapTaskRequest(request, 'review_generation'));
    return mapTaskResponse(raw);
  }

  async runExperimentEvaluation(request: FinanceTaskRequest): Promise<FinanceTaskResponse> {
    const raw = await this.runRaw(mapTaskRequest(request, 'experiment_evaluation'));
    return mapTaskResponse(raw);
  }

  private runRaw(input: {
    taskType: string;
    thesisType: string;
    riskLevel: 'low' | 'medium' | 'high';
    ticker?: string;
    metadata?: Record<string, unknown>;
  }): Promise<FinanceTaskResult> {
    return this.runtime.run(input);
  }
}
