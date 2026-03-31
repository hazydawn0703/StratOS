import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceTaskAutomationService } from '../apps/finance/dist/application/services/FinanceTaskAutomationService.js';

test('error scan periodic aggregation task can run', async () => {
  const svc = new FinanceTaskAutomationService();
  await svc.enqueue('error_pattern_scan', {}, 'schedule');
  const task = await svc.runNext();
  assert.ok(task);
  assert.equal(task.taskType, 'error_pattern_scan');
  assert.equal(task.status, 'succeeded');
});
