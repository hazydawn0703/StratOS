import test from 'node:test';
import assert from 'node:assert/strict';
import { ReviewEngine } from '../packages/review-engine/dist/index.js';

test('review generation happy path', () => {
  const engine = new ReviewEngine();
  const review = engine.review(
    {
      claim_id: 'claim-1',
      artifact_id: 'artifact-1',
      task_type: 'report_generation',
      claim_text: 'AAPL revenue will improve',
      schema_version: '1.0',
      extracted_timestamp: '2026-03-26T00:00:00.000Z'
    },
    {
      outcome_id: 'outcome-1',
      claim_id: 'claim-1',
      outcome_label: 'hit',
      evidence: 'earnings beat expectation',
      outcome_timestamp: '2026-03-26T01:00:00.000Z'
    }
  );

  assert.equal(review.review_target, 'claim-1');
  assert.equal(review.result_label, 'confirmed');
});
