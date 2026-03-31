import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceRouteHandlers } from '../apps/finance/dist/application/http/FinanceRouteHandlers.js';

const handlers = new FinanceRouteHandlers();

test('runtime settings healthcheck runs router/gateway checks', async () => {
  const response = await handlers.handle({ method: 'POST', path: '/api/finance/settings/runtime/healthcheck', body: {} });
  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'pass');
  assert.ok(response.body.checks.routerConfiguration);
  assert.ok(response.body.checks.gatewayConnectivity);
});
