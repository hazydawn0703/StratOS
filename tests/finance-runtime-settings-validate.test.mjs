import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceRouteHandlers } from '../apps/finance/dist/application/http/FinanceRouteHandlers.js';

const handlers = new FinanceRouteHandlers();

test('runtime settings validate api enforces server-side checks', async () => {
  const response = await handlers.handle({ method: 'POST', path: '/api/finance/settings/runtime/validate', body: { mode: 'mock', runtimeConfig: {}, appPreferences: {} } });
  assert.equal(response.status, 200);
  assert.equal(response.body.valid, false);
  assert.ok(response.body.errors.includes('provider_profile_missing'));
});
