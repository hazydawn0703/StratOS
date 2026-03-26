import type { StructuredReview } from '@stratos/review-engine';

export type ErrorPatternState = 'observed' | 'clustered' | 'named';

export interface ErrorPattern {
  pattern_id: string;
  lifecycle_state: ErrorPatternState;
  name: string;
  review_ids: string[];
  count: number;
}

export class ErrorUtilizationEngine {
  aggregate(reviews: StructuredReview[]): ErrorPattern[] {
    const rejected = reviews.filter((review) => review.result_label !== 'confirmed');
    const groups = new Map<string, StructuredReview[]>();

    for (const review of rejected) {
      const key = review.error_summary;
      const existing = groups.get(key) ?? [];
      existing.push(review);
      groups.set(key, existing);
    }

    return Array.from(groups.entries()).map(([summary, grouped], index) => {
      const lifecycle_state: ErrorPatternState =
        grouped.length >= 3 ? 'named' : grouped.length >= 2 ? 'clustered' : 'observed';
      return {
        pattern_id: `pattern-${index + 1}`,
        lifecycle_state,
        name: lifecycle_state === 'named' ? `named:${summary}` : summary,
        review_ids: grouped.map((item) => item.review_id),
        count: grouped.length
      };
    });
  }
}
