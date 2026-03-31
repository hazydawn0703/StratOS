import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceRepository } from '../apps/finance/dist/domain/repository.js';
import { FinanceTaskAutomationService } from '../apps/finance/dist/application/services/FinanceTaskAutomationService.js';

const repo = new FinanceRepository();
const svc = new FinanceTaskAutomationService(repo);

test('stale running task detection marks stale running tasks as failed', async () => {
  const staleTask = repo.saveTask({
    id: `task-stale-${Date.now()}`,
    taskType: 'daily_brief_generation',
    status: 'running',
    startedAt: new Date(Date.now() - 120_000).toISOString(),
    retryCount: 0,
    source: 'manual',
    idempotencyKey: `stale-${Date.now()}`,
    refs: {},
    payload: {},
    createdAt: new Date(Date.now() - 120_000).toISOString()
  });
  assert.equal(staleTask.status, 'running');
  const count = await svc.recoverStaleRunningTasks();
  assert.ok(count >= 1);
  const updated = repo.getTask(staleTask.id);
  assert.equal(updated.status, 'failed');
  assert.equal(updated.errorSummary, 'stale_running_task_detected');
});
