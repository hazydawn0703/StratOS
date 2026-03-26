export type PromotionAction = 'promote' | 'hold' | 'rollback' | 'deprecate' | 'manual_review';

export interface PromotionPolicy {
  policy_id: string;
  app: string;
  min_sample_size: number;
  min_observation_window_hours: number;
  require_manual_approval: boolean;
  promote_threshold: number;
  rollback_threshold: number;
}

export interface EvaluationResult {
  candidate_id: string;
  candidate_version: string;
  baseline_id: string;
  baseline_version: string;
  metric_deltas: Record<string, number>;
  risk_notes: string[];
  sample_failures: string[];
  recommendation: 'promote' | 'hold';
}

export type ExperimentMode = 'shadow' | 'canary' | 'partial' | 'cohort' | 'full';

export interface ExperimentResult {
  experiment_id: string;
  candidate_id: string;
  candidate_version: string;
  baseline_version: string;
  mode: ExperimentMode;
  bucket: string;
  sample_size: number;
  observation_window_hours: number;
  metrics: Record<string, number>;
  rollback_ready: boolean;
  notes: string[];
}

export interface PromotionDecision {
  candidate_id: string;
  candidate_version: string;
  baseline_version: string;
  action: PromotionAction;
  reasons: string[];
  requires_manual_approval: boolean;
}

export interface PromotionAuditRecord {
  audit_id: string;
  candidate_id: string;
  source_error_pattern_id: string;
  evaluation: EvaluationResult;
  experiment: ExperimentResult;
  decision: PromotionDecision;
  active_stu_version?: string;
  impacted_task_type: string;
  created_at: string;
}
