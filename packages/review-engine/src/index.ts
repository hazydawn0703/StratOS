import type { StrategyClaimRecord } from '@stratos/claim-extractor';

export interface OutcomeRecord {
  outcome_id: string;
  claim_id: string;
  outcome_label: 'hit' | 'miss' | 'partial';
  evidence: string;
  outcome_timestamp: string;
}

export interface StructuredReview {
  review_id: string;
  review_target: string;
  result_label: 'confirmed' | 'rejected' | 'partial';
  error_summary: string;
  attribution: string;
  severity: 'low' | 'medium' | 'high';
  review_timestamp: string;
}

export class ReviewEngine {
  review(claim: StrategyClaimRecord, outcome: OutcomeRecord): StructuredReview {
    const resultLabel =
      outcome.outcome_label === 'hit'
        ? 'confirmed'
        : outcome.outcome_label === 'miss'
          ? 'rejected'
          : 'partial';

    return {
      review_id: `review-${claim.claim_id}-${outcome.outcome_id}`,
      review_target: claim.claim_id,
      result_label: resultLabel,
      error_summary:
        resultLabel === 'rejected' ? `claim failed against outcome ${outcome.outcome_id}` : 'no critical error',
      attribution: outcome.evidence,
      severity: resultLabel === 'rejected' ? 'high' : resultLabel === 'partial' ? 'medium' : 'low',
      review_timestamp: new Date().toISOString()
    };
  }
}
