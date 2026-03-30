import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceRouteHandlers } from '../apps/finance/dist/application/http/FinanceRouteHandlers.js';

const handlers = new FinanceRouteHandlers();

test('run center summary api returns task operational view', async () => {
  await handlers.handle({
    method: 'POST',
    path: '/api/finance/tasks/enqueue',
    body: { taskType: 'weekly_portfolio_review', payload: { title: 'weekly', body: 'summary' } }
  });

  const summary = await handlers.handle({ method: 'GET', path: '/api/finance/run-center/summary' });
  assert.equal(summary.status, 200);
  assert.ok(summary.body.recentTasks);
  assert.ok(summary.body.statusDistribution);
});
