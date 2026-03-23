import type { Prediction } from '@stratos/shared-types';
import { PredictionCard } from './components/PredictionCard.js';

const mockPrediction: Prediction = {
  id: 'demo-ui-1',
  scope: 'demo',
  thesisType: 'scenario',
  statement: 'demo',
  bullishCase: 'demo',
  cautiousCase: 'demo',
  measurableTarget: 'demo',
  evaluationMethod: 'demo',
  confidenceScore: 0.5,
  triggerType: 'time',
  triggerAt: new Date(0).toISOString(),
  uncertaintyNote: 'demo'
};

export const renderPredictionDemo = (): string => PredictionCard({ prediction: mockPrediction });
