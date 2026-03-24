import type { EvaluationMetrics } from '../metrics/types.js';

export const mockScore = (): EvaluationMetrics => ({
  predictionValidity: 0.6,
  confidenceCalibration: 0.55,
  missedCounterevidenceRate: 0.4,
  vaguenessScore: 0.45,
  specificityScore: 0.65,
  actionableScore: 0.62
});
