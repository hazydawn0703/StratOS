import type { PromotionAction } from '@stratos/shared-types';
import type { PromotionGovernanceInput } from '../types.js';

export const decidePromotionAction = (input: PromotionGovernanceInput): PromotionAction => {
  const { policy, evaluation, experiment } = input;

  if (!experiment.rollback_ready) return 'manual_review';
  if (evaluation.sample_failures.length > 0) return 'rollback';
  if (evaluation.risk_notes.length > 0) return 'manual_review';
  if (experiment.sample_size < policy.min_sample_size) return 'hold';
  if (experiment.observation_window_hours < policy.min_observation_window_hours) return 'hold';

  const deltaScore = Object.values(experiment.metrics).reduce((sum, item) => sum + item, 0);
  if (deltaScore <= policy.rollback_threshold) return 'rollback';
  if (deltaScore >= policy.promote_threshold && evaluation.recommendation === 'promote') {
    return policy.require_manual_approval ? 'manual_review' : 'promote';
  }

  return 'hold';
};
