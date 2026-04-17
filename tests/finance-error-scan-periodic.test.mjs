import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceTaskAutomationService } from '../apps/finance/dist/application/services/FinanceTaskAutomationService.js';
import { createTestFinanceDbPath, setupFinanceTestDb, withIsolatedFinanceEnv } from './helpers/financeTestDb.mjs';

test('error scan periodic aggregation task can run', async () => {
  const dbPath = createTestFinanceDbPath('finance-error-scan');
  const isolatedEnv = withIsolatedFinanceEnv(dbPath);
  process.env.FINANCE_DB_PATH = isolatedEnv.FINANCE_DB_PATH;
  process.env.STRATOS_FINANCE_DB_PATH = isolatedEnv.STRATOS_FINANCE_DB_PATH;
  setupFinanceTestDb({ dbPath, init: true, migrate: true, seed: false });

  const svc = new FinanceTaskAutomationService();
  await svc.enqueue('error_pattern_scan', {}, 'schedule');
  let task;
  for (let i = 0; i < 20; i += 1) {
    const ran = await svc.runNext();
    if (!ran) break;
    if (ran.taskType === 'error_pattern_scan') {
      task = ran;
      break;
    }
  }
  assert.ok(task);
  assert.equal(task.taskType, 'error_pattern_scan');
  assert.equal(task.status, 'succeeded');
});
