import type { Review } from '@stratos/shared-types';

export interface ReviewCardProps {
  review: Review;
}

export const ReviewCard = ({ review }: ReviewCardProps): string => `ReviewCard:${review.predictionId}`;
