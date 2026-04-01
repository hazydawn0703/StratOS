import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceTaskAutomationService } from '../apps/finance/dist/application/services/FinanceTaskAutomationService.js';
import { FinanceRepository } from '../apps/finance/dist/domain/repository.js';

const repo = new FinanceRepository();
const svc = new FinanceTaskAutomationService(repo);

test('continuous run chain executes through timeline rebuild with durable queue', async () => {
  await svc.schedule('daily_brief_generation', new Date(Date.now() - 500).toISOString(), {
    title: 'continuous-daily',
    body: 'Revenue will accelerate and margins improve.'
  });
  const polled = await svc.pollScheduled();
  assert.equal(polled, 1);

  for (let i = 0; i < 16; i += 1) {
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
  assert.ok(taskTypes.has('bias_snapshot_generation'));
  assert.ok(taskTypes.has('timeline_rebuild'));

  const timeline = repo.listTimeline({ limit: 100 });
  assert.ok(timeline.length >= 1);
});
