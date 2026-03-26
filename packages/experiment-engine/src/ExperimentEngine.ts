import type {
  EvaluationInput,
  EvaluationResult,
  ExperimentCandidate,
  ExperimentMode,
  ExperimentResult,
  PromotionAuditRecord,
  PromotionPolicy
} from '@stratos/shared-types';
import type { TaskContext } from '@stratos/shared-types';
import { decidePromotionAction } from './decision/promotionDecision.js';
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
      candidateVersion: 'candidate-v1',
      baselineVersion: 'baseline-v1',
      mode: 'shadow',
      bucket: 'default',
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

    const latest = exp.metrics.at(-1);
    const decision: 'promoted' | 'rolled_back' = (latest?.actionableScore ?? 0) >= 0.6 ? 'promoted' : 'rolled_back';
    exp.state = decision;

    if (decision === 'promoted') {
      await this.lifecycleGuard.activate(exp.candidateId, `promotion approved by ${experimentId}`);
    } else {
      await this.lifecycleGuard.rollback(exp.candidateId, `promotion rejected by ${experimentId}`);
    }

    return decision;
  }

  runExperiment(input: {
    experimentId: string;
    candidateId: string;
    candidateVersion: string;
    baselineVersion: string;
    mode: ExperimentMode;
    bucket: string;
    sampleSize: number;
    observationWindowHours: number;
    metrics: Record<string, number>;
    rollbackReady: boolean;
    notes?: string[];
  }): ExperimentResult {
    const record: ExperimentRecord = {
      id: input.experimentId,
      candidateId: input.candidateId,
      candidateVersion: input.candidateVersion,
      baselineVersion: input.baselineVersion,
      mode: input.mode,
      bucket: input.bucket,
      state: input.mode,
      metrics: [input.metrics]
    };
    this.experiments.set(input.experimentId, record);
    return {
      experiment_id: input.experimentId,
      candidate_id: input.candidateId,
      candidate_version: input.candidateVersion,
      baseline_version: input.baselineVersion,
      mode: input.mode,
      bucket: input.bucket,
      sample_size: input.sampleSize,
      observation_window_hours: input.observationWindowHours,
      metrics: input.metrics,
      rollback_ready: input.rollbackReady,
      notes: input.notes ?? []
    };
  }

  async evaluatePromotion(input: {
    policy: PromotionPolicy;
    evaluation: EvaluationResult;
    experiment: ExperimentResult;
    sourceErrorPatternId: string;
    impactedTaskType: string;
  }): Promise<{ decision: PromotionAuditRecord['decision']; audit: PromotionAuditRecord }> {
    const action = decidePromotionAction({
      policy: input.policy,
      evaluation: input.evaluation,
      experiment: input.experiment
    });
    const decision: PromotionAuditRecord['decision'] = {
      candidate_id: input.evaluation.candidate_id,
      candidate_version: input.evaluation.candidate_version,
      baseline_version: input.evaluation.baseline_version,
      action,
      reasons: [
        `evaluation:${input.evaluation.recommendation}`,
        `experiment_mode:${input.experiment.mode}`,
        `sample_size:${input.experiment.sample_size}`
      ],
      requires_manual_approval: input.policy.require_manual_approval
    };

    if (action === 'promote') {
      await this.lifecycleGuard.activate(input.evaluation.candidate_id, 'promotion approved');
    } else if (action === 'rollback' || action === 'deprecate') {
      await this.lifecycleGuard.rollback(input.evaluation.candidate_id, 'rollback/deprecate decision');
    }

    return {
      decision,
      audit: {
        audit_id: `audit-${input.evaluation.candidate_id}`,
        candidate_id: input.evaluation.candidate_id,
        source_error_pattern_id: input.sourceErrorPatternId,
        evaluation: input.evaluation,
        experiment: input.experiment,
        decision,
        active_stu_version: action === 'promote' ? input.evaluation.candidate_version : undefined,
        impacted_task_type: input.impactedTaskType,
        created_at: new Date().toISOString()
      }
    };
  }
}
