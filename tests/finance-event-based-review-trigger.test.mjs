import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceRepository } from '../apps/finance/dist/domain/repository.js';
import { FinanceTaskAutomationService } from '../apps/finance/dist/application/services/FinanceTaskAutomationService.js';

const repo = new FinanceRepository();
const svc = FinanceTaskAutomationService.inMemory(repo);

test('event-based review trigger handles event prediction with outcome', async () => {
  const prediction = repo.savePrediction({
    id: `pred-event-${Date.now()}`,
    artifactId: 'a-event',
    type: 'event',
    ticker: 'MSFT',
    direction: 'bullish',
    horizonDays: 10,
    confidence: 0.8,
    thesis: 'Product launch event will improve conversion in enterprise channel.',
    triggerType: 'event_based',
    triggerEvent: 'product_launch',
    evidence: ['e2'],
    admittedAt: new Date(Date.now() - 2 * 86_400_000).toISOString()
  });
  repo.saveOutcome({
    id: `out-event-${Date.now()}`,
    predictionId: prediction.id,
    observedAt: new Date().toISOString(),
    outcomeLabel: 'partial',
    evidence: 'Event completed and early metrics show partial target achievement.'
  });

  await svc.enqueue('prediction_review', { triggerType: 'event_based', reviewWindowDays: 30 }, 'manual');
  const ran = await svc.runNext();
  assert.equal(ran.status, 'succeeded');
  assert.ok((ran.refs.reviewed ?? []).length >= 1);
});
