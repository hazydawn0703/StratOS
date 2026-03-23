import type { Prediction } from '@stratos/shared-types';

export interface PredictionCardProps {
  prediction: Prediction;
}

export const PredictionCard = ({ prediction }: PredictionCardProps): string =>
  `PredictionCard:${prediction.id}`;
