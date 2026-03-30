import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceTaskAutomationService } from '../apps/finance/dist/application/services/FinanceTaskAutomationService.js';
import { FinanceRepository } from '../apps/finance/dist/domain/repository.js';

const repo = new FinanceRepository();
const svc = FinanceTaskAutomationService.inMemory(repo);

test('bias snapshot generation task writes snapshot with behavior and outcome signals', async () => {
  await svc.enqueue('daily_brief_generation', { title: 'bias-seed', body: 'Revenue will grow.' }, 'manual');
  await svc.runNext();
  await svc.runNext();
  await svc.enqueue('bias_snapshot_generation', {}, 'manual');
  const ran = await svc.runNext();
  assert.equal(ran.status, 'succeeded');
  const snapshots = repo.listBiasSnapshots('finance-system');
  assert.ok(snapshots.length >= 1);
  const latest = snapshots[0].payload;
  assert.ok(latest.behaviorSignals);
  assert.ok(latest.outcomeSignals);
});
