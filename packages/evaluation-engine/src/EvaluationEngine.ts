import type { EvaluationInput } from '@stratos/shared-types';
import type {
  CandidateEvaluationInput,
  CandidateEvaluationSummary,
  EvaluationResult
} from './metrics/types.js';
import { mockScore } from './scorers/mockScorer.js';

export class EvaluationEngine {
  evaluateCandidate(
    candidate: { id: string },
    _evaluationSet: unknown[],
    _baseline: { id: string }
  ): EvaluationResult {
    return {
      candidateId: candidate.id,
      metrics: mockScore(),
      notes: ['mock scorer applied']
    };
  }

  compareResults(baselineResult: EvaluationResult, candidateResult: EvaluationResult): EvaluationResult {
    return {
      candidateId: candidateResult.candidateId,
      metrics: {
        predictionValidity: candidateResult.metrics.predictionValidity - baselineResult.metrics.predictionValidity,
        confidenceCalibration:
          candidateResult.metrics.confidenceCalibration - baselineResult.metrics.confidenceCalibration,
        missedCounterevidenceRate:
          candidateResult.metrics.missedCounterevidenceRate - baselineResult.metrics.missedCounterevidenceRate,
        vaguenessScore: candidateResult.metrics.vaguenessScore - baselineResult.metrics.vaguenessScore,
        specificityScore: candidateResult.metrics.specificityScore - baselineResult.metrics.specificityScore,
        actionableScore: candidateResult.metrics.actionableScore - baselineResult.metrics.actionableScore
      },
      notes: ['delta comparison']
    };
  }

  buildEvaluationInput(input: {
    candidateId: string;
    baselineId: string;
    gateStatus: EvaluationInput['gate_status'];
    biasReasons: string[];
    supportCount: number;
    candidateScore: number;
    baselineScore: number;
  }): EvaluationInput {
    return {
      candidate_id: input.candidateId,
      baseline_id: input.baselineId,
      gate_status: input.gateStatus,
      bias_reasons: input.biasReasons,
      support_count: input.supportCount,
      candidate_score: input.candidateScore,
      baseline_score: input.baselineScore
    };
  }

  evaluateCandidateAgainstBaseline(input: CandidateEvaluationInput): CandidateEvaluationSummary {
    const delta = input.candidateScore - input.baselineScore;
    const recommendation = delta > 0 && input.supportCount > 0 ? 'promote' : 'hold';
    return {
      candidateId: input.candidateId,
      baselineId: input.baselineId,
      delta,
      recommendation,
      rationale:
        recommendation === 'promote'
          ? 'candidate outperformed baseline with supporting review evidence'
          : 'insufficient candidate advantage or support evidence'
    };
  }

  evaluateFromInput(input: EvaluationInput): CandidateEvaluationSummary {
    return this.evaluateCandidateAgainstBaseline({
      candidateId: input.candidate_id,
      baselineId: input.baseline_id,
      candidateScore: input.candidate_score,
      baselineScore: input.baseline_score,
      supportCount: input.support_count
    });
  }
}
