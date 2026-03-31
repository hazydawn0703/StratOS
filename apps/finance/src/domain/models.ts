export type FinanceTaskType =
  | 'daily_brief_generation'
  | 'weekly_portfolio_review'
  | 'stock_deep_dive'
  | 'risk_alert_generation'
  | 'prediction_extraction'
  | 'prediction_review'
  | 'error_pattern_scan'
  | 'finance_candidate_generation'
  | 'finance_evaluation_run'
  | 'finance_experiment_check'
  | 'bias_snapshot_generation'
  | 'timeline_rebuild'
  | 'manual_review_requested';

export type ArtifactType = 'daily_brief' | 'weekly_review' | 'stock_deep_dive' | 'risk_alert';
export type PredictionType = 'risk' | 'valuation' | 'event' | 'thesis';
export type TriggerType = 'time_based' | 'event_based';

export interface Portfolio {
  id: string;
  name: string;
  baseCurrency: string;
  createdAt: string;
}

export interface Holding {
  id: string;
  portfolioId: string;
  ticker: string;
  quantity: number;
  averageCost: number;
  updatedAt: string;
}

export interface WatchlistItem {
  id: string;
  ticker: string;
  thesis: string;
  priority: 'low' | 'medium' | 'high';
  addedAt: string;
}

export interface FinanceArtifact {
  id: string;
  taskType: FinanceTaskType;
  artifactType: ArtifactType;
  title: string;
  ticker?: string;
  generatedAt: string;
  body: string;
  evidence: string[];
}

export interface FinancePrediction {
  id: string;
  artifactId: string;
  type: PredictionType;
  ticker?: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  horizonDays: number;
  confidence: number;
  thesis: string;
  triggerType: TriggerType;
  triggerAt?: string;
  triggerEvent?: string;
  evidence: string[];
  admittedAt: string;
}

export interface PredictionOutcome {
  id: string;
  predictionId: string;
  observedAt: string;
  outcomeLabel: 'confirmed' | 'rejected' | 'partial' | 'insufficient';
  evidence: string;
}

export interface PredictionReview {
  id: string;
  predictionId: string;
  outcomeId: string;
  reviewedAt: string;
  result: 'correct' | 'incorrect' | 'mixed';
  directionIssue: boolean;
  timingIssue: boolean;
  evidenceIssue: boolean;
  confidenceIssue: boolean;
  summary: string;
}

export interface FinanceErrorPattern {
  id: string;
  patternCode:
    | 'directional_bias'
    | 'timing_mismatch'
    | 'confidence_overstatement'
    | 'evidence_gap'
    | 'event_miss';
  supportCount: number;
  severity: 'low' | 'medium' | 'high';
  reviewIds: string[];
}

export interface FinanceSTUCandidateProposal {
  id: string;
  patternId: string;
  scope: 'finance';
  proposedRules: string[];
  rationale: string;
}
