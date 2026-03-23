export interface EvaluationMetrics {
  predictionValidity: number;
  confidenceCalibration: number;
  missedCounterevidenceRate: number;
  vaguenessScore: number;
  specificityScore: number;
  actionableScore: number;
}

export interface EvaluationResult {
  candidateId: string;
  metrics: EvaluationMetrics;
  notes: string[];
}
