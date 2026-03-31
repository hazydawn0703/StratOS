import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceRouteHandlers } from '../apps/finance/dist/application/http/FinanceRouteHandlers.js';

const handlers = new FinanceRouteHandlers();

test('setup save-config stores config and masks secret fields in response', async () => {
  const response = await handlers.handle({
    method: 'POST',
    path: '/api/finance/setup/save-config',
    body: {
      mode: 'staging',
      infrastructure: { database: 'sqlite', queue: 'sqlite', scheduler: 'sqlite' },
      model: { providerType: 'mock', modelAlias: 'finance-default', useMockProvider: true },
      app: { defaultPortfolioName: 'Setup Portfolio' },
      automation: { dailyBrief: true },
      secrets: { apiKey: 'top-secret' }
    }
  });
  assert.equal(response.status, 200);
  assert.ok(response.body.configId);
  assert.deepEqual(response.body.secretFields, ['apiKey']);
});
