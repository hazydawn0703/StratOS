import type { TaskContext } from '@stratos/shared-types';
import { decidePromotionState } from './decision/promotionDecision.js';
import { StrategyLifecycleGuard } from './lifecycle/StrategyLifecycleGuard.js';
import { deterministicRollout } from './rollout/deterministicRollout.js';
import type { ExperimentRecord } from './types.js';

export class ExperimentEngine {
  private readonly experiments = new Map<string, ExperimentRecord>();
  private readonly lifecycleGuard = new StrategyLifecycleGuard();

  /**
   * Backward-compatible shortcut for legacy callers.
   * New callers should use registerCandidate -> markCandidateEvaluated -> startExperimentGuarded.
   */
  startExperiment(candidate: { id: string }): ExperimentRecord {
    this.lifecycleGuard.registerCandidate(candidate.id);
    this.lifecycleGuard.markEvaluated(candidate.id, 'legacy auto-evaluation bridge');
    return this.startExperimentGuarded(candidate.id);
  }

  registerCandidate(candidateId: string): void {
    this.lifecycleGuard.registerCandidate(candidateId);
  }

  markCandidateEvaluated(candidateId: string, note?: string): void {
    this.lifecycleGuard.markEvaluated(candidateId, note);
  }

  startExperimentGuarded(candidateId: string): ExperimentRecord {
    this.lifecycleGuard.markExperimenting(candidateId);

    const record: ExperimentRecord = {
      id: `exp-${candidateId}`,
      candidateId,
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

    if (decision === 'promoted') {
      this.lifecycleGuard.activate(exp.candidateId, `promotion approved by ${experimentId}`);
    } else {
      this.lifecycleGuard.rollback(exp.candidateId, `promotion rejected by ${experimentId}`);
    }

    return decision;
  }
}
