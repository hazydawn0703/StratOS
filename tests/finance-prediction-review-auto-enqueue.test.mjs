import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceRouteHandlers } from '../apps/finance/dist/application/http/FinanceRouteHandlers.js';

const handlers = new FinanceRouteHandlers();

test('outcome ingest auto-enqueues prediction_review task', async () => {
  const res = await handlers.handle({
    method: 'POST',
    path: '/api/finance/ingest/outcomes',
    body: {
      predictionId: 'pred-auto-1',
      outcomeType: 'manual_outcome',
      payload: { label: 'partial' }
    }
  });
  assert.equal(res.status, 200);

  const tasks = await handlers.handle({ method: 'GET', path: '/api/finance/tasks' });
  assert.equal(tasks.status, 200);
  const list = tasks.body.tasks;
  assert.ok(list.some((t) => t.taskType === 'prediction_review'));
});
