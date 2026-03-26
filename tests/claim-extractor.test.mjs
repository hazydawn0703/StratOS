import test from 'node:test';
import assert from 'node:assert/strict';
import { ClaimExtractor } from '../packages/claim-extractor/dist/index.js';

test('claim extraction happy path', () => {
  const extractor = new ClaimExtractor();
  const result = extractor.extract({
    artifactId: 'artifact-1',
    taskType: 'report_generation',
    content: 'Claim line A\nClaim line B'
  });

  assert.equal(result.ok, true);
  assert.equal(result.claims.length, 2);
  assert.ok(result.claims[0].claim_id.startsWith('artifact-1-claim-'));
});

test('claim extraction failure path', () => {
  const extractor = new ClaimExtractor();
  const result = extractor.extract({ artifactId: 'artifact-2', taskType: 'review', content: '   ' });

  assert.equal(result.ok, false);
  assert.equal(result.claims.length, 0);
});
