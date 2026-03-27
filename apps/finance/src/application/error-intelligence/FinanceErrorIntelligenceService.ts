import { ExperimentEngine } from '@stratos/experiment-engine';
import { FinanceRepository } from '../../domain/repository.js';
import type { FinanceErrorPattern, FinanceSTUCandidateProposal, PredictionReview } from '../../domain/models.js';
import { ErrorPatternPromotionPolicy } from '../policies/financePolicies.js';

export class FinanceErrorIntelligenceService {
  private readonly promotionPolicy = new ErrorPatternPromotionPolicy();
  private readonly experimentEngine = new ExperimentEngine();

  constructor(private readonly repo = new FinanceRepository()) {}

  aggregatePatterns(reviews: PredictionReview[]): FinanceErrorPattern[] {
    const buckets = new Map<FinanceErrorPattern['patternCode'], PredictionReview[]>();
    const register = (code: FinanceErrorPattern['patternCode'], review: PredictionReview): void => {
      const list = buckets.get(code) ?? [];
      list.push(review);
      buckets.set(code, list);
    };

    for (const review of reviews) {
      if (review.directionIssue) register('directional_bias', review);
      if (review.timingIssue) register('timing_mismatch', review);
      if (review.confidenceIssue) register('confidence_overstatement', review);
      if (review.evidenceIssue) register('evidence_gap', review);
      if (review.result === 'incorrect' && !review.timingIssue) register('event_miss', review);
    }

    return [...buckets.entries()].map(([patternCode, grouped]) => {
      const pattern: FinanceErrorPattern = {
        id: `pattern-${patternCode}`,
        patternCode,
        supportCount: grouped.length,
        severity: grouped.length >= 5 ? 'high' : grouped.length >= 3 ? 'medium' : 'low',
        reviewIds: grouped.map((r) => r.id)
      };
      return this.repo.savePattern(pattern);
    });
  }

  async proposeSTUCandidates(patterns: FinanceErrorPattern[]): Promise<FinanceSTUCandidateProposal[]> {
    const proposals: FinanceSTUCandidateProposal[] = [];
    for (const pattern of patterns) {
      if (!this.promotionPolicy.canPromote(pattern)) continue;

      const proposal: FinanceSTUCandidateProposal = {
        id: `finance-stu-${pattern.id}`,
        patternId: pattern.id,
        scope: 'finance',
        proposedRules: [`mitigate:${pattern.patternCode}`, `support>=${pattern.supportCount}`],
        rationale: `Generated from finance error pattern ${pattern.patternCode}`
      };

      await this.experimentEngine.registerCandidate(proposal.id);
      proposals.push(this.repo.saveSTUProposal(proposal));
    }

    return proposals;
  }
}
