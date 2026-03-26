import test from 'node:test';
import assert from 'node:assert/strict';
import { ModelRouter } from '../packages/model-router/dist/index.js';

test('model-router governance honors deny policy and records fallback metadata', () => {
  const router = new ModelRouter();
  const decision = router.route(
    { providers: ['provider-a'], hints: [] },
    { denyProviders: ['provider-a'] }
  );

  assert.equal(decision.provider, 'mock');
  assert.match(decision.reason, /fallback:mock/);
  assert.equal(decision.metadata.fallbackUsed, true);
  assert.deepEqual(decision.metadata.deniedProviders, ['provider-a']);
});
