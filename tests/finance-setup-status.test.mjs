import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceRouteHandlers } from '../apps/finance/dist/application/http/FinanceRouteHandlers.js';

const handlers = new FinanceRouteHandlers();

test('setup status endpoint returns readiness shape', async () => {
  const response = await handlers.handle({ method: 'GET', path: '/api/finance/setup/status' });
  assert.equal(response.status, 200);
  assert.equal(typeof response.body.setupCompleted, 'boolean');
  assert.ok('modelConfigStatus' in response.body);
});
