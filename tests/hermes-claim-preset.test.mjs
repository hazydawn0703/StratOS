import test from 'node:test';
import assert from 'node:assert/strict';

import { createHermesClaimPresetAdapter } from '../integrations/hermes/adapters/claim-preset/service.mjs';

const adapter = createHermesClaimPresetAdapter();

function makeArtifact(taskType, summary, sections = []) {
  return {
    artifact_id: `artifact_${taskType}_001`,
    summary,
    body: {
      summary,
      sections
    },
    sections,
    integration_metadata: {
      task_type: taskType
    }
  };
}

test('extracts claims from analysis artifact', () => {
  const artifact = makeArtifact('analysis', 'Downside risk increased in segment B.', [
    { heading: 'Recommendation', content: 'Recommend adding hedge controls.' }
  ]);

  const result = adapter.extractClaims(artifact);

  assert.equal(result.ok, true);
  assert.ok(result.claims.length >= 1);
  assert.ok(result.claims.some((c) => c.claim_type === 'risk_claim'));
});

test('extracts claims from planning artifact', () => {
  const artifact = makeArtifact('planning', 'Prioritize retention before expansion.', [
    { heading: 'Next Step', content: 'Should sequence rollout after baseline cleanup.' }
  ]);

  const result = adapter.extractClaims(artifact);

  assert.equal(result.ok, true);
  assert.ok(result.claims.some((c) => c.claim_type === 'prioritization_claim' || c.claim_type === 'recommendation_claim'));
});

test('extracts claims from scheduled report artifact', () => {
  const artifact = makeArtifact('scheduled_report', 'Weekly report shows one elevated risk area.', [
    { heading: 'Risk', content: 'Vendor lead time volatility remains high.' }
  ]);

  const result = adapter.extractClaims(artifact);

  assert.equal(result.ok, true);
  assert.ok(result.claims.length >= 1);
  assert.equal(result.claims[0].artifact_id, artifact.artifact_id);
});

test('returns extraction failure for unsupported task type', () => {
  const artifact = makeArtifact('chat', 'Hello world');
  const result = adapter.extractClaims(artifact);

  assert.equal(result.ok, false);
  assert.equal(result.extraction_failure.reason_code, 'unsupported_task_type');
});
