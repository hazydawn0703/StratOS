export interface BiasBehaviorSignals {
  confidenceDistributionSkew: number;
  rejectionRate: number;
  riskHintRate: number;
  claimOutputTilt: number;
}

export interface BiasOutcomeSignals {
  reviewPassRate: number;
  errorDirectionDrift: number;
  severeErrorRatio: number;
  rollbackRate: number;
}

export interface BiasSnapshot {
  behavior: BiasBehaviorSignals;
  outcome: BiasOutcomeSignals;
}

export interface BiasAlert {
  hasBiasRisk: boolean;
  reasons: string[];
  severity: 'low' | 'medium' | 'high';
}

export interface CandidateGateResult {
  candidate_id: string;
  gate_status: 'needs_bias_review' | 'ready_for_evaluation';
  bias_reasons: string[];
}
