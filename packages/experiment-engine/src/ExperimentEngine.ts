import type { EvaluationInput, ExperimentCandidate } from '@stratos/shared-types';
import type { TaskContext } from '@stratos/shared-types';
import { decidePromotionState } from './decision/promotionDecision.js';
import { StrategyLifecycleGuard } from './lifecycle/StrategyLifecycleGuard.js';
import { deterministicRollout } from './rollout/deterministicRollout.js';
import type { ExperimentRecord } from './types.js';

export class ExperimentEngine {
  private readonly experiments = new Map<string, ExperimentRecord>();
  private readonly lifecycleGuard = new StrategyLifecycleGuard();

  async registerCandidate(candidateId: string): Promise<void> {
    await this.lifecycleGuard.registerCandidate(candidateId);
  }

  async markCandidateEvaluated(candidateId: string, note?: string): Promise<void> {
    await this.lifecycleGuard.markEvaluated(candidateId, note);
  }

  createExperimentCandidate(
    evaluationInput: EvaluationInput,
    evaluation: { recommendation: 'promote' | 'hold'; delta: number }
  ): ExperimentCandidate {
    return {
      candidate_id: evaluationInput.candidate_id,
      gate_status: evaluationInput.gate_status,
      evaluation_recommendation: evaluation.recommendation,
      evaluation_delta: evaluation.delta
    };
  }

  async startExperimentGuarded(candidateId: string): Promise<ExperimentRecord> {
    await this.lifecycleGuard.markExperimenting(candidateId);

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

  async decidePromotion(experimentId: string): Promise<'promoted' | 'rolled_back'> {
    const exp = this.experiments.get(experimentId);
    if (!exp) return 'rolled_back';

    const decision = decidePromotionState(exp);
    exp.state = decision;

    if (decision === 'promoted') {
      await this.lifecycleGuard.activate(exp.candidateId, `promotion approved by ${experimentId}`);
    } else {
      await this.lifecycleGuard.rollback(exp.candidateId, `promotion rejected by ${experimentId}`);
    }

    return decision;
  }
}
