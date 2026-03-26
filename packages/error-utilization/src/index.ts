import type { ErrorPatternProtocol, STUCandidate } from '@stratos/shared-types';
export type { STUCandidate } from '@stratos/shared-types';
import type { StructuredReview } from '@stratos/review-engine';

export type ErrorPatternState = ErrorPatternProtocol['lifecycle_state'];
export type ErrorPattern = ErrorPatternProtocol;

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
        evidence_refs: grouped.map((item) => item.attribution),
        count: grouped.length
      };
    });
  }

  validate(pattern: ErrorPattern): ErrorPattern {
    if (pattern.lifecycle_state === 'named' || pattern.lifecycle_state === 'clustered') {
      return { ...pattern, lifecycle_state: 'validated' };
    }
    return pattern;
  }

  promoteToSTUCandidate(pattern: ErrorPattern): { pattern: ErrorPattern; candidate?: STUCandidate } {
    if (pattern.lifecycle_state !== 'validated') {
      return { pattern };
    }

    const candidate: STUCandidate = {
      candidate_id: `stu-candidate-${pattern.pattern_id}`,
      source_error_pattern_id: pattern.pattern_id,
      review_refs: pattern.review_ids,
      evidence_refs: pattern.evidence_refs,
      scope_note: 'applies to tasks sharing similar error signature',
      strategy_summary: `Mitigate error pattern: ${pattern.name}`,
      schema_version: '1.0',
      created_at: new Date().toISOString()
    };

    return {
      pattern: { ...pattern, lifecycle_state: 'promoted_to_stu_candidate' },
      candidate
    };
  }
}
