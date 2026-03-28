import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceRouteHandlers } from '../apps/finance/dist/application/http/FinanceRouteHandlers.js';

const handlers = new FinanceRouteHandlers();

test('finance routes persist portfolio and expose dashboard/timeline json', async () => {
  const upsert = await handlers.handle({
    method: 'POST',
    path: '/api/finance/portfolio',
    body: { id: 'p1', name: 'Core', baseCurrency: 'USD' }
  });
  assert.equal(upsert.status, 200);

  const dashboard = await handlers.handle({ method: 'GET', path: '/api/finance/dashboard' });
  assert.equal(dashboard.status, 200);
  assert.ok(Array.isArray(dashboard.body.portfolios));

  const run = await handlers.handle({
    method: 'POST',
    path: '/api/finance/mock/run',
    body: { artifactType: 'daily_brief', title: 'daily', body: 'Revenue will grow with demand acceleration.' }
  });
  assert.equal(run.status, 200);

  const timeline = await handlers.handle({ method: 'GET', path: '/api/finance/timeline', query: { ticker: 'NVDA' } });
  assert.equal(timeline.status, 200);
  assert.ok(Array.isArray(timeline.body.links));
});
