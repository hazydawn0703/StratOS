import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceRouteHandlers } from '../apps/finance/dist/application/http/FinanceRouteHandlers.js';

const handlers = new FinanceRouteHandlers();

test('setup bootstrap initializes defaults after save-config', async () => {
  await handlers.handle({
    method: 'POST',
    path: '/api/finance/setup/save-config',
    body: {
      mode: 'local',
      infrastructure: { database: 'sqlite', queue: 'sqlite', scheduler: 'sqlite' },
      model: { providerType: 'mock', modelAlias: 'finance-default', useMockProvider: true },
      app: { defaultPortfolioName: 'Bootstrap Portfolio', defaultWatchlist: ['NVDA', 'AAPL'] },
      automation: { dailyBrief: true, errorScan: true },
      secrets: { apiKey: 'abc123' }
    }
  });
  const bootstrap = await handlers.handle({ method: 'POST', path: '/api/finance/setup/bootstrap' });
  assert.equal(bootstrap.status, 200);
  assert.equal(bootstrap.body.setupCompleted, true);
  assert.equal(bootstrap.body.watchlistCount, 2);
});
