import test from 'node:test';
import assert from 'node:assert/strict';
import { EvaluationEngine } from '../packages/evaluation-engine/dist/index.js';

test('evaluation result without baseline_version cannot be used for promotion', () => {
  const engine = new EvaluationEngine();
  assert.throws(
    () =>
      engine.evaluateForPromotion({
        candidateId: 'cand-a',
        candidateVersion: 'v2',
        baselineId: 'base-a',
        metricDeltas: { quality: 0.2 },
        riskNotes: [],
        sampleFailures: []
      }),
    /baseline_version is required/
  );
});
