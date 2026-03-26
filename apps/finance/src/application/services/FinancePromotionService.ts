import { EvaluationEngine } from '@stratos/evaluation-engine';
import { ExperimentEngine } from '@stratos/experiment-engine';
import { ReplayAuditEngine } from '@stratos/replay-debug';
import type { PromotionAuditRecord, PromotionPolicy, TaskContext } from '@stratos/shared-types';
import { StrategyCompiler } from '@stratos/strategy-compiler';
import { STURegistry } from '@stratos/stu-registry';
import type { STUCandidate } from '@stratos/error-utilization';

export const financePromotionPolicy: PromotionPolicy = {
  policy_id: 'finance-default-policy-v1',
  app: 'finance',
  min_sample_size: 10,
  min_observation_window_hours: 24,
  require_manual_approval: false,
  promote_threshold: 0.2,
  rollback_threshold: -0.2
};

export interface FinancePromotionInput {
  candidate: STUCandidate;
  taskType: string;
  baselineVersion: string;
  candidateVersion: string;
  evaluationMetrics: Record<string, number>;
  experimentMode: 'shadow' | 'canary' | 'partial' | 'cohort' | 'full';
  governance?: {
    autoApproveManualReview?: boolean;
    approver?: string;
  };
}

export interface FinancePromotionResult {
  audit: PromotionAuditRecord;
  compileAuditSummary: string;
}

export class FinancePromotionService {
  private readonly evaluationEngine = new EvaluationEngine();
  private readonly experimentEngine = new ExperimentEngine();
  private readonly compiler = new StrategyCompiler();
  private readonly replayAudit = new ReplayAuditEngine();

  constructor(
    private readonly policy: PromotionPolicy = financePromotionPolicy,
    private readonly registry: STURegistry = new STURegistry()
  ) {}

  async run(input: FinancePromotionInput): Promise<FinancePromotionResult> {
    await this.experimentEngine.registerCandidate(input.candidate.candidate_id);
    await this.experimentEngine.markCandidateEvaluated(input.candidate.candidate_id, 'finance promotion evaluation');
    await this.experimentEngine.startExperimentGuarded(input.candidate.candidate_id);

    this.registry.registerCandidate({
      candidate: input.candidate,
      app: 'finance',
      task_type: input.taskType,
      artifact_type: 'analysis_report',
      candidate_version: input.candidateVersion
    });
    this.registry.assignExperimentBucket({
      experiment_id: `exp-${input.candidate.candidate_id}`,
      bucket: 'finance-cohort-a',
      candidate_id: input.candidate.candidate_id,
      candidate_version: input.candidateVersion
    });

    const evaluation = this.evaluationEngine.evaluateForPromotion({
      candidateId: input.candidate.candidate_id,
      candidateVersion: input.candidateVersion,
      baselineId: 'finance-baseline',
      baselineVersion: input.baselineVersion,
      metricDeltas: input.evaluationMetrics,
      riskNotes: [],
      sampleFailures: []
    });

    const experiment = this.experimentEngine.runExperiment({
      experimentId: `exp-${input.candidate.candidate_id}`,
      candidateId: input.candidate.candidate_id,
      candidateVersion: input.candidateVersion,
      baselineVersion: input.baselineVersion,
      mode: input.experimentMode,
      bucket: 'finance-cohort-a',
      sampleSize: 25,
      observationWindowHours: 48,
      metrics: input.evaluationMetrics,
      rollbackReady: true
    });

    const { audit } = await this.experimentEngine.evaluatePromotion({
      policy: this.policy,
      evaluation,
      experiment,
      sourceErrorPatternId: input.candidate.source_error_pattern_id,
      impactedTaskType: input.taskType
    });
    let finalAudit = audit;

    if (
      audit.decision.action === 'manual_review' &&
      audit.decision.requires_manual_approval &&
      input.governance?.autoApproveManualReview
    ) {
      finalAudit = await this.experimentEngine.approvePromotion({
        candidateId: input.candidate.candidate_id,
        approver: input.governance.approver ?? 'finance-auto-approver',
        note: 'auto approval enabled by feature flag',
        approve: true,
        audit
      });
    }

    if (finalAudit.decision.action === 'promote' && finalAudit.active_stu_version) {
      this.registry.activate(input.candidate.candidate_id, finalAudit.active_stu_version);
    }

    const taskContext: TaskContext = {
      taskType: input.taskType,
      thesisType: 'finance',
      riskLevel: 'medium',
      metadata: { from: 'promotion-flow' }
    };
    const compiled = this.compiler.compile(this.registry.getCompilationInput(taskContext), taskContext);
    const compileAuditSummary = this.replayAudit.explainPromotionChange({
      candidate_id: finalAudit.candidate_id,
      source_error_pattern_id: finalAudit.source_error_pattern_id,
      baseline_version: finalAudit.evaluation.baseline_version,
      candidate_version: finalAudit.evaluation.candidate_version,
      experiment_mode: finalAudit.experiment.mode,
      experiment_bucket: finalAudit.experiment.bucket,
      promotion_action: finalAudit.decision.action,
      decision_reasons: finalAudit.decision.reasons,
      active_stu_version: compiled.audit.activeStuVersions[0]?.split('@')[1]
    });

    return { audit: finalAudit, compileAuditSummary };
  }
}
