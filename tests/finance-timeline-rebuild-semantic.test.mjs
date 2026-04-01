import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceTaskAutomationService } from '../apps/finance/dist/application/services/FinanceTaskAutomationService.js';
import { FinanceRepository } from '../apps/finance/dist/domain/repository.js';

const repo = new FinanceRepository();
const svc = new FinanceTaskAutomationService(repo);

test('timeline rebuild task writes linked timeline record', async () => {
  await svc.enqueue('daily_brief_generation', { title: 'timeline-seed', body: 'Revenue will grow.' }, 'manual');
  await svc.runNext();
  await svc.runNext();
  await svc.enqueue('timeline_rebuild', {}, 'manual');
  const ran = await svc.runNext();
  assert.equal(ran.status, 'succeeded');
  const timeline = repo.listTimeline({ limit: 50 });
  assert.ok(timeline.some((x) => x.id.startsWith('tl-rebuild-')));
});
