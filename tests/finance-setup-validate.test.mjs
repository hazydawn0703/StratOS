import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceRouteHandlers } from '../apps/finance/dist/application/http/FinanceRouteHandlers.js';

const handlers = new FinanceRouteHandlers();

test('setup validate reports errors for incomplete payload', async () => {
  const response = await handlers.handle({
    method: 'POST',
    path: '/api/finance/setup/validate',
    body: { mode: 'production', infrastructure: {}, model: {}, app: {} }
  });
  assert.equal(response.status, 200);
  assert.equal(response.body.valid, false);
  assert.ok(response.body.errors.includes('database_missing'));
});
