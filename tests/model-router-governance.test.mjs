import test from 'node:test';
import assert from 'node:assert/strict';
import { ModelRouter } from '../packages/model-router/dist/index.js';

test('model-router governance honors deny policy and falls back to mock', () => {
  const router = new ModelRouter();
  const decision = router.route(
    { providers: ['provider-a'], hints: [] },
    { denyProviders: ['provider-a'] }
  );

  assert.equal(decision.provider, 'mock');
  assert.match(decision.reason, /fallback:mock/);
});
