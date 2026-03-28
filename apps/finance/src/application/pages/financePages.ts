export type FinancePageName =
  | 'Dashboard'
  | 'Portfolio'
  | 'Watchlist'
  | 'Reports'
  | 'Predictions'
  | 'Reviews'
  | 'Error Intelligence'
  | 'Strategy Lab'
  | 'Experiment Center'
  | 'Thesis Timeline'
  | 'Task Ops';

export interface FinancePageDefinition {
  name: FinancePageName;
  keyWidgets: string[];
}

export const financePages: FinancePageDefinition[] = [
  { name: 'Dashboard', keyWidgets: ['portfolio-summary', 'risk-alerts', 'bias-card'] },
  { name: 'Portfolio', keyWidgets: ['portfolio-crud', 'holdings-crud'] },
  { name: 'Watchlist', keyWidgets: ['watchlist-crud', 'priority-tracker'] },
  { name: 'Reports', keyWidgets: ['daily-brief', 'weekly-review', 'deep-dive', 'risk-alert'] },
  { name: 'Predictions', keyWidgets: ['claim-admission-status', 'time-event-triggers'] },
  { name: 'Reviews', keyWidgets: ['prediction-review-list', 'issue-breakdown'] },
  { name: 'Error Intelligence', keyWidgets: ['pattern-aggregation', 'candidate-proposals'] },
  { name: 'Strategy Lab', keyWidgets: ['candidate-evaluation', 'routing-simulation'] },
  { name: 'Experiment Center', keyWidgets: ['experiment-status', 'promotion-gate'] },
  { name: 'Thesis Timeline', keyWidgets: ['artifact-claim-outcome-review-timeline'] },
  { name: 'Task Ops', keyWidgets: ['task-list', 'status-distribution', 'retry-rerun-controls'] }
];
