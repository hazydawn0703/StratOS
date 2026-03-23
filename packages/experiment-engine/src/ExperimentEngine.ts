import type { TaskContext } from '@stratos/shared-types';
import { decidePromotionState } from './decision/promotionDecision.js';
import { deterministicRollout } from './rollout/deterministicRollout.js';
import type { ExperimentRecord } from './types.js';

export class ExperimentEngine {
  private readonly experiments = new Map<string, ExperimentRecord>();

  startExperiment(candidate: { id: string }): ExperimentRecord {
    const record: ExperimentRecord = {
      id: `exp-${candidate.id}`,
      candidateId: candidate.id,
      state: 'shadow',
      metrics: []
    };
    this.experiments.set(record.id, record);
    return record;
  }

  decideExposure(experimentId: string, taskContext: TaskContext): number {
    return deterministicRollout(`${experimentId}:${taskContext.taskType}`);
  }

  recordMetrics(experimentId: string, metrics: Record<string, number>): void {
    const exp = this.experiments.get(experimentId);
    if (!exp) return;
    exp.metrics.push(metrics);
    exp.state = exp.metrics.length > 2 ? 'canary' : 'shadow';
  }

  decidePromotion(experimentId: string): 'promoted' | 'rolled_back' {
    const exp = this.experiments.get(experimentId);
    if (!exp) return 'rolled_back';
    const decision = decidePromotionState(exp);
    exp.state = decision;
    return decision;
  }
}
