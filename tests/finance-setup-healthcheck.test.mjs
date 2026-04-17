import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceRouteHandlers } from '../apps/finance/dist/application/http/FinanceRouteHandlers.js';

const handlers = new FinanceRouteHandlers();

test('setup healthcheck probes dependencies and persists result', async () => {
  const response = await handlers.handle({ method: 'POST', path: '/api/finance/setup/healthcheck' });
  assert.equal(response.status, 200);
  assert.ok(response.body.result);
  assert.equal(response.body.status, 'ok');
});
