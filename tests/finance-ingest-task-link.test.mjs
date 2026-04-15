import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceRouteHandlers } from '../apps/finance/dist/application/http/FinanceRouteHandlers.js';

const handlers = new FinanceRouteHandlers();

test('ingest source -> enqueue daily brief -> run now -> artifact linked', async () => {
  await handlers.handle({
    method: 'POST',
    path: '/api/finance/ingest/source-documents',
    body: {
      ticker: 'AAPL',
      sourceType: 'manual_note',
      sourceTimestamp: new Date().toISOString(),
      content: 'Demand improving'
    }
  });

  const enq = await handlers.handle({
    method: 'POST',
    path: '/api/finance/tasks/enqueue',
    body: { taskType: 'daily_brief_generation', payload: { title: 'auto', body: 'body', ticker: 'AAPL' } }
  });
  assert.equal(enq.status, 200);

  const run = await handlers.handle({ method: 'POST', path: '/api/finance/tasks/run-now' });
  assert.equal(run.status, 200);
  assert.ok(run.body.task.refs);
});
