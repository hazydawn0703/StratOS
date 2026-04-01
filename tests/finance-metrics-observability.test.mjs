import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceRouteHandlers } from '../apps/finance/dist/application/http/FinanceRouteHandlers.js';

const handlers = new FinanceRouteHandlers();

test('finance metrics endpoint includes cost/latency/routing observability summary', async () => {
  await handlers.handle({
    method: 'POST',
    path: '/api/finance/tasks/enqueue',
    body: { taskType: 'daily_brief_generation', payload: { title: 'obs', body: 'Revenue will grow.' } }
  });
  await handlers.handle({ method: 'POST', path: '/api/finance/tasks/run-now' });

  const response = await handlers.handle({ method: 'GET', path: '/api/finance/metrics' });
  assert.equal(response.status, 200);
  assert.ok(response.body.observability);
  assert.ok(response.body.observability.costSummary);
  assert.ok(response.body.observability.latencySummary);
  assert.ok(response.body.observability.routingSummary);
});
