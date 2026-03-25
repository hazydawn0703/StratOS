export interface Review {
  predictionId: string;
  outcome: 'hit' | 'miss' | 'mixed' | 'pending';
  reviewSummary: string;
  directionScore: number;
  timingScore: number;
  evidenceScore: number;
  confidenceCalibrationScore: number;
  missedCounterevidence: string;
  lessonLearned: string;
  errorPatterns: string[];
}
