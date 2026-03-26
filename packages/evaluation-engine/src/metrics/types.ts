import type { EvaluationInput } from '@stratos/shared-types';
import type { EvaluationResult as PromotionEvaluationResult } from '@stratos/shared-types';

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

export interface CandidateEvaluationInput {
  candidateId: string;
  baselineId: string;
  candidateScore: number;
  baselineScore: number;
  supportCount: number;
}

export interface CandidateEvaluationSummary {
  candidateId: string;
  baselineId: string;
  delta: number;
  recommendation: 'promote' | 'hold';
  rationale: string;
}

export type FrameworkEvaluationInput = EvaluationInput;
export type FrameworkEvaluationResult = PromotionEvaluationResult;
