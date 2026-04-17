import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceTaskAutomationService } from '../apps/finance/dist/application/services/FinanceTaskAutomationService.js';
import { FinanceRepository } from '../apps/finance/dist/domain/repository.js';
import { createTestFinanceDbPath, setupFinanceTestDb, withIsolatedFinanceEnv } from './helpers/financeTestDb.mjs';

test('timeline rebuild task writes linked timeline record', async () => {
  const dbPath = createTestFinanceDbPath('finance-timeline-rebuild');
  const isolatedEnv = withIsolatedFinanceEnv(dbPath);
  process.env.FINANCE_DB_PATH = isolatedEnv.FINANCE_DB_PATH;
  process.env.STRATOS_FINANCE_DB_PATH = isolatedEnv.STRATOS_FINANCE_DB_PATH;
  setupFinanceTestDb({ dbPath, init: true, migrate: true, seed: false });
  const repo = new FinanceRepository();
  const svc = new FinanceTaskAutomationService(repo);
  await svc.enqueue('daily_brief_generation', { title: 'timeline-seed', body: 'Revenue will grow.' }, 'manual');
  await svc.runNext();
  await svc.runNext();
  await svc.enqueue('timeline_rebuild', {}, 'manual');
  let ranTimeline = false;
  for (let i = 0; i < 20; i += 1) {
    const ran = await svc.runNext();
    if (!ran) break;
    if (ran.taskType === 'timeline_rebuild' && ran.status === 'succeeded') {
      ranTimeline = true;
      break;
    }
  }
  assert.equal(ranTimeline, true);
  const timeline = repo.listTimeline({ limit: 50 });
  assert.ok(timeline.length >= 1);
});
