import { detectBiasFromSnapshot } from './detection/detectBias.js';
import type { BiasAlert, BiasSnapshot, CandidateGateResult } from './metrics/types.js';

export interface BiasSignalInput {
  confidenceScores: number[];
  rejectionFlags: boolean[];
  riskHints: boolean[];
  claimTiltValues: number[];
  reviewPassFlags: boolean[];
  errorDirectionValues: number[];
  severeErrorFlags: boolean[];
  rollbackFlags: boolean[];
}

export class BiasMonitor {
  computeSnapshot(input: BiasSignalInput): BiasSnapshot {
    const avg = (arr: number[]): number =>
      arr.length === 0 ? 0 : arr.reduce((sum, value) => sum + value, 0) / arr.length;
    const ratio = (arr: boolean[]): number => (arr.length === 0 ? 0 : arr.filter(Boolean).length / arr.length);

    return {
      behavior: {
        confidenceDistributionSkew: avg(input.confidenceScores),
        rejectionRate: ratio(input.rejectionFlags),
        riskHintRate: ratio(input.riskHints),
        claimOutputTilt: avg(input.claimTiltValues)
      },
      outcome: {
        reviewPassRate: ratio(input.reviewPassFlags),
        errorDirectionDrift: avg(input.errorDirectionValues),
        severeErrorRatio: ratio(input.severeErrorFlags),
        rollbackRate: ratio(input.rollbackFlags)
      }
    };
  }

  detectBias(snapshot: BiasSnapshot): BiasAlert {
    return detectBiasFromSnapshot(snapshot);
  }

  gateCandidate(candidateId: string, snapshot: BiasSnapshot): CandidateGateResult {
    const alert = this.detectBias(snapshot);
    return {
      candidate_id: candidateId,
      gate_status: alert.hasBiasRisk ? 'needs_bias_review' : 'ready_for_evaluation',
      bias_reasons: alert.reasons
    };
  }
}
