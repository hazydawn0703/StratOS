import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceRouteHandlers } from '../apps/finance/dist/application/http/FinanceRouteHandlers.js';

const handlers = new FinanceRouteHandlers();

test('setup demo-run triggers minimal closed loop with visible artifacts/predictions', async () => {
  const response = await handlers.handle({ method: 'POST', path: '/api/finance/setup/demo-run' });

  assert.equal(response.status, 200);
  assert.ok(response.body.queuedTaskId);
  assert.ok(Array.isArray(response.body.runs));
  assert.ok(Array.isArray(response.body.artifacts));
  assert.ok(Array.isArray(response.body.predictions));
  assert.ok(Array.isArray(response.body.timeline));
  assert.ok(response.body.artifacts.length >= 1);
});
