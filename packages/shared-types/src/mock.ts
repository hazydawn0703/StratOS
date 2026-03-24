import type { Prediction } from './prediction.js';

export const mockPrediction = (): Prediction => ({
  id: 'pred-001',
  scope: 'demo',
  thesisType: 'scenario',
  statement: 'A minimal prediction sample.',
  bullishCase: 'Upside case placeholder.',
  cautiousCase: 'Downside case placeholder.',
  measurableTarget: 'Define measurable KPI.',
  evaluationMethod: 'Manual review.',
  confidenceScore: 0.5,
  triggerType: 'time',
  triggerAt: new Date(0).toISOString(),
  uncertaintyNote: 'Mock uncertainty note.'
});
