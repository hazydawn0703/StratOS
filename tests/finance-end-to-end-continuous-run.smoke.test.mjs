import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceTaskAutomationService } from '../apps/finance/dist/application/services/FinanceTaskAutomationService.js';
import { FinanceRepository } from '../apps/finance/dist/domain/repository.js';
import { createTestFinanceDbPath, setupFinanceTestDb, withIsolatedFinanceEnv } from './helpers/financeTestDb.mjs';

test('continuous run chain executes through timeline rebuild with durable queue', async () => {
  const dbPath = createTestFinanceDbPath('finance-continuous-run');
  const isolatedEnv = withIsolatedFinanceEnv(dbPath);
  process.env.FINANCE_DB_PATH = isolatedEnv.FINANCE_DB_PATH;
  process.env.STRATOS_FINANCE_DB_PATH = isolatedEnv.STRATOS_FINANCE_DB_PATH;
  setupFinanceTestDb({ dbPath, init: true, migrate: true, seed: false });
  const repo = new FinanceRepository();
  const svc = new FinanceTaskAutomationService(repo);
  await svc.schedule('daily_brief_generation', new Date(Date.now() - 500).toISOString(), {
    title: 'continuous-daily',
    body: 'Revenue will accelerate and margins improve.'
  });
  const polled = await svc.pollScheduled();
  assert.ok(polled >= 1);

  for (let i = 0; i < 40; i += 1) {
    await svc.pollScheduled();
    const ran = await svc.runNext();
    if (!ran) break;
  }

  const tasks = svc.list({ limit: 200 });
  const taskTypes = new Set(tasks.map((x) => x.taskType));
  assert.ok(taskTypes.has('daily_brief_generation'));
  assert.ok(taskTypes.has('prediction_extraction'));
  assert.ok(taskTypes.has('prediction_review'));
  assert.ok(taskTypes.has('error_pattern_scan'));
  assert.ok(taskTypes.has('finance_candidate_generation'));
  assert.ok(taskTypes.has('finance_experiment_check'));

  const timeline = repo.listTimeline({ limit: 100 });
  assert.ok(timeline.length >= 1);
});
