export const HERMES_CLAIM_PRESET_VERSION = 'hermes.claim-preset.v0.1';

export const SUPPORTED_TASK_TYPES = Object.freeze([
  'analysis',
  'planning',
  'scheduled_report'
]);

export const SUPPORTED_CLAIM_TYPES = Object.freeze([
  'judgment_claim',
  'recommendation_claim',
  'risk_claim',
  'prioritization_claim'
]);

export const REVIEWABILITY = Object.freeze([
  'reviewable',
  'weakly_reviewable',
  'not_reviewable'
]);
