import test from 'node:test';
import assert from 'node:assert/strict';
import { EvaluationEngine } from '../packages/evaluation-engine/dist/index.js';

test('baseline/candidate minimal evaluation fixture', () => {
  const engine = new EvaluationEngine();
  const summary = engine.evaluateCandidateAgainstBaseline({
    candidateId: 'cand-1',
    baselineId: 'base-1',
    candidateScore: 0.8,
    baselineScore: 0.6,
    supportCount: 1
  });

  assert.equal(summary.recommendation, 'promote');
  assert.ok(summary.delta > 0);
});
