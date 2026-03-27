import { FinanceRepository } from '../../domain/repository.js';
import type { FinancePrediction, PredictionOutcome, PredictionReview, TriggerType } from '../../domain/models.js';

export interface RegisterOutcomeInput {
  predictionId: string;
  outcomeLabel: PredictionOutcome['outcomeLabel'];
  evidence: string;
}

export class FinanceReviewService {
  constructor(private readonly repo = new FinanceRepository()) {}

  shouldTriggerReview(prediction: FinancePrediction, now = new Date()): boolean {
    if (prediction.triggerType === 'time_based') {
      return prediction.triggerAt !== undefined && now >= new Date(prediction.triggerAt);
    }

    return prediction.triggerType === 'event_based' && Boolean(prediction.triggerEvent);
  }

  registerOutcome(input: RegisterOutcomeInput): PredictionOutcome {
    const outcome: PredictionOutcome = {
      id: `outcome-${Date.now().toString(36)}`,
      predictionId: input.predictionId,
      observedAt: new Date().toISOString(),
      outcomeLabel: input.outcomeLabel,
      evidence: input.evidence
    };
    return this.repo.saveOutcome(outcome);
  }

  reviewPrediction(prediction: FinancePrediction, outcome: PredictionOutcome): PredictionReview {
    const incorrect = outcome.outcomeLabel === 'rejected';
    const mixed = outcome.outcomeLabel === 'partial';
    const result: PredictionReview['result'] = incorrect ? 'incorrect' : mixed ? 'mixed' : 'correct';

    const review: PredictionReview = {
      id: `review-${Date.now().toString(36)}`,
      predictionId: prediction.id,
      outcomeId: outcome.id,
      reviewedAt: new Date().toISOString(),
      result,
      directionIssue: incorrect,
      timingIssue: prediction.triggerType === 'time_based' && outcome.outcomeLabel !== 'confirmed',
      evidenceIssue: outcome.evidence.trim().length < 20,
      confidenceIssue: prediction.confidence >= 0.75 && outcome.outcomeLabel !== 'confirmed',
      summary: `review(${prediction.id}): ${outcome.outcomeLabel}`
    };

    return this.repo.saveReview(review);
  }

  listReviews(): PredictionReview[] {
    return this.repo.listReviews();
  }

  listByTrigger(trigger: TriggerType): FinancePrediction[] {
    return this.repo.listPredictions().filter((p) => p.triggerType === trigger);
  }
}
