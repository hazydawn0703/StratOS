import test from 'node:test';
import assert from 'node:assert/strict';
import { ExperimentEngine } from '../packages/experiment-engine/dist/index.js';

for (const mode of ['shadow', 'canary', 'partial', 'cohort', 'full']) {
  test(`experiment mode ${mode} yields version-bound result`, () => {
    const engine = new ExperimentEngine();
    const result = engine.runExperiment({
      experimentId: `exp-${mode}`,
      candidateId: 'cand-exp',
      candidateVersion: 'cand-v2',
      baselineVersion: 'base-v1',
      mode,
      bucket: 'bucket-a',
      sampleSize: 12,
      observationWindowHours: 24,
      metrics: { quality_delta: 0.1 },
      rollbackReady: true
    });
    assert.equal(result.mode, mode);
    assert.equal(result.candidate_version, 'cand-v2');
    assert.equal(result.baseline_version, 'base-v1');
  });
}
