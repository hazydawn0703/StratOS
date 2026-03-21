import type { FinanceTaskInput, FinanceTaskResult } from '../types.js';
import { financeRuntimeBootstrap } from '../../bootstrap/runtimeBootstrap.js';

/**
 * Phase service boundary:
 * app-facing entrypoints map to framework pipeline task types,
 * while keeping finance business logic out of this layer.
 */
export class FinanceTaskService {
  constructor(private readonly runtime = financeRuntimeBootstrap()) {}

  runReportGeneration(input: Omit<FinanceTaskInput, 'taskType'>): Promise<FinanceTaskResult> {
    return this.runtime.run({ ...input, taskType: 'report_generation' });
  }

  runReviewGeneration(input: Omit<FinanceTaskInput, 'taskType'>): Promise<FinanceTaskResult> {
    return this.runtime.run({ ...input, taskType: 'review_generation' });
  }

  runExperimentEvaluation(input: Omit<FinanceTaskInput, 'taskType'>): Promise<FinanceTaskResult> {
    return this.runtime.run({ ...input, taskType: 'experiment_evaluation' });
  }
}
