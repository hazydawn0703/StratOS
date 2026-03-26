import test from 'node:test';
import assert from 'node:assert/strict';
import { ErrorUtilizationEngine } from '../packages/error-utilization/dist/index.js';

test('error pattern minimal aggregation lifecycle', () => {
  const engine = new ErrorUtilizationEngine();
  const patterns = engine.aggregate([
    {
      review_id: 'r1',
      review_target: 'c1',
      result_label: 'rejected',
      error_summary: 'timing mismatch',
      attribution: 'e1',
      severity: 'high',
      review_timestamp: '2026-03-26T00:00:00.000Z'
    },
    {
      review_id: 'r2',
      review_target: 'c2',
      result_label: 'partial',
      error_summary: 'timing mismatch',
      attribution: 'e2',
      severity: 'medium',
      review_timestamp: '2026-03-26T00:01:00.000Z'
    }
  ]);

  assert.equal(patterns.length, 1);
  assert.equal(patterns[0].lifecycle_state, 'clustered');
});
