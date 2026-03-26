import type {
  ExperimentMode,
  ExperimentResult,
  PromotionAuditRecord,
  PromotionDecision,
  PromotionPolicy
} from '@stratos/shared-types';

export type ExperimentState = ExperimentMode | 'rolled_back' | 'promoted';

export interface ExperimentRecord {
  id: string;
  candidateId: string;
  candidateVersion: string;
  baselineVersion: string;
  mode: ExperimentMode;
  bucket: string;
  state: ExperimentState;
  metrics: Array<Record<string, number>>;
}

export interface PromotionGovernanceInput {
  policy: PromotionPolicy;
  evaluation: {
    candidate_id: string;
    candidate_version: string;
    baseline_version: string;
    recommendation: 'promote' | 'hold';
    risk_notes: string[];
    sample_failures: string[];
  };
  experiment: ExperimentResult;
}

export interface PromotionGovernanceResult {
  decision: PromotionDecision;
  audit: PromotionAuditRecord;
}
