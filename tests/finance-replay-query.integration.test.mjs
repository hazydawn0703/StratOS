import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceRouteHandlers } from '../apps/finance/dist/application/http/FinanceRouteHandlers.js';

const handlers = new FinanceRouteHandlers();

test('replay query api returns linked replay-friendly entities', async () => {
  await handlers.handle({ method: 'POST', path: '/api/finance/tasks/enqueue', body: { taskType: 'daily_brief_generation', payload: { title: 'rq', body: 'Revenue will grow.' } } });
  await handlers.handle({ method: 'POST', path: '/api/finance/tasks/run-now' });
  await handlers.handle({ method: 'POST', path: '/api/finance/tasks/run-now' });

  const response = await handlers.handle({ method: 'GET', path: '/api/finance/replay/query', query: { taskType: 'prediction_extraction' } });
  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body.tasks));
  assert.ok(Array.isArray(response.body.timeline));
});
