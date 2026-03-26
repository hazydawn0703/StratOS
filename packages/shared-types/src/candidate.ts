export type ErrorPatternLifecycleState =
  | 'observed'
  | 'clustered'
  | 'named'
  | 'validated'
  | 'promoted_to_stu_candidate';

export interface ErrorPatternProtocol {
  pattern_id: string;
  lifecycle_state: ErrorPatternLifecycleState;
  name: string;
  review_ids: string[];
  evidence_refs: string[];
  count: number;
}

export interface STUCandidate {
  candidate_id: string;
  source_error_pattern_id: string;
  review_refs: string[];
  evidence_refs: string[];
  scope_note: string;
  strategy_summary: string;
  schema_version: '1.0';
  created_at: string;
}

export type CandidateGateStatus = 'needs_bias_review' | 'ready_for_evaluation';

export interface EvaluationInput {
  candidate_id: string;
  baseline_id: string;
  support_count: number;
  gate_status: CandidateGateStatus;
  bias_reasons: string[];
  candidate_score: number;
  baseline_score: number;
}

export interface ExperimentCandidate {
  candidate_id: string;
  gate_status: CandidateGateStatus;
  evaluation_recommendation: 'promote' | 'hold';
  evaluation_delta: number;
}
