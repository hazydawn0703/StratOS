import type { FinanceTaskType } from '../../domain/models.js';

export interface FinanceAppConfig {
  appId: 'finance';
  defaultTaskRoute: Record<FinanceTaskType, string>;
  claimAdmission: {
    minConfidence: number;
    maxHorizonDays: number;
    requireEvidenceCount: number;
  };
}

export const financeAppConfig: FinanceAppConfig = {
  appId: 'finance',
  defaultTaskRoute: {
    daily_brief_generation: 'finance-daily',
    weekly_portfolio_review: 'finance-weekly',
    stock_deep_dive: 'finance-deep-dive',
    risk_alert_generation: 'finance-risk',
    prediction_extraction: 'finance-claims',
    prediction_review: 'finance-review',
    error_pattern_scan: 'finance-error',
    finance_candidate_generation: 'finance-candidate',
    finance_evaluation_run: 'finance-evaluation',
    finance_experiment_check: 'finance-experiment',
    bias_snapshot_generation: 'finance-bias',
    timeline_rebuild: 'finance-timeline',
    manual_review_requested: 'finance-manual-review'
  },
  claimAdmission: {
    minConfidence: 0.55,
    maxHorizonDays: 365,
    requireEvidenceCount: 1
  }
};
