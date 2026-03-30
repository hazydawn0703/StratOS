import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceTaskAutomationService } from '../apps/finance/dist/application/services/FinanceTaskAutomationService.js';

test('durable queue survives service restart and recovers queued task', async () => {
  const svc1 = new FinanceTaskAutomationService();
  const queued = await svc1.enqueue('daily_brief_generation', { title: 'restart', body: 'Revenue may grow.' }, 'manual');
  assert.equal(queued.status, 'queued');

  const svc2 = new FinanceTaskAutomationService();
  let recovered;
  for (let i = 0; i < 20; i += 1) {
    const run = await svc2.runNext();
    if (!run) break;
    if (run.id === queued.id) {
      recovered = run;
      break;
    }
  }
  assert.ok(recovered);
  assert.equal(recovered.status, 'succeeded');
});
