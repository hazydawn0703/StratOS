import type { Prediction } from './prediction.js';
import type { Review } from './review.js';

/**
 * Framework-level neutral names that remain backward compatible with finance-era naming.
 */
export type StrategyClaim = Prediction;
export type OutcomeReview = Review;

export interface StrategyArtifact {
  claim: StrategyClaim;
  review?: OutcomeReview;
}
