import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceRouteHandlers } from '../apps/finance/dist/application/http/FinanceRouteHandlers.js';

const handlers = new FinanceRouteHandlers();

test('runtime settings read api returns summary', async () => {
  const response = await handlers.handle({ method: 'GET', path: '/api/finance/settings/runtime' });
  assert.equal(response.status, 200);
  assert.ok(response.body.mode);
  assert.ok(response.body.runtimeOverview);
});
