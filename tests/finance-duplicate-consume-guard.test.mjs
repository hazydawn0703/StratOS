import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceTaskAutomationService } from '../apps/finance/dist/application/services/FinanceTaskAutomationService.js';

test('duplicate consume guard prevents double enqueue on same idempotency key', async () => {
  const svc = new FinanceTaskAutomationService();
  const first = await svc.enqueue('daily_brief_generation', { title: 'dup', body: 'Revenue may grow.' }, 'manual');
  const second = await svc.enqueue('daily_brief_generation', { title: 'dup', body: 'Revenue may grow.' }, 'manual');
  assert.equal(first.id, second.id);

  let seen = 0;
  for (let i = 0; i < 20; i += 1) {
    const run = await svc.runNext();
    if (!run) break;
    if (run.id === first.id) seen += 1;
  }
  assert.equal(seen, 1);
});
