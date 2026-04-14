import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceTaskAutomationService } from '../apps/finance/dist/application/services/FinanceTaskAutomationService.js';

test('scheduled task integration: schedule -> poll -> enqueue -> run', async () => {
  const svc = new FinanceTaskAutomationService();
  await svc.schedule('daily_brief_generation', new Date(Date.now() - 1000).toISOString(), {
    title: 'Scheduled Daily',
    body: 'scheduled body'
  });
  const queued = await svc.pollScheduled();
  assert.equal(queued, 1);
  const ran = await svc.runNext();
  assert.ok(ran);
  assert.equal(ran.status, 'succeeded');
});
