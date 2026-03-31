import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceRepository } from '../apps/finance/dist/domain/repository.js';
import { FinanceTaskAutomationService } from '../apps/finance/dist/application/services/FinanceTaskAutomationService.js';

const repo = new FinanceRepository();
const svc = FinanceTaskAutomationService.inMemory(repo);

test('time-based review trigger creates review when due with outcome', async () => {
  const prediction = repo.savePrediction({
    id: `pred-time-${Date.now()}`,
    artifactId: 'a-time',
    type: 'thesis',
    ticker: 'NVDA',
    direction: 'bullish',
    horizonDays: 5,
    confidence: 0.75,
    thesis: 'Revenue will accelerate next week with stronger guidance.',
    triggerType: 'time_based',
    triggerAt: new Date(Date.now() - 60_000).toISOString(),
    evidence: ['e1'],
    admittedAt: new Date(Date.now() - 2 * 86_400_000).toISOString()
  });
  repo.saveOutcome({
    id: `out-time-${Date.now()}`,
    predictionId: prediction.id,
    observedAt: new Date().toISOString(),
    outcomeLabel: 'confirmed',
    evidence: 'Confirmed with earnings release and guidance beat evidence.'
  });

  await svc.enqueue('prediction_review', { triggerType: 'time_based', reviewWindowDays: 30 }, 'manual');
  const ran = await svc.runNext();
  assert.equal(ran.status, 'succeeded');
  assert.ok((ran.refs.reviewed ?? []).length >= 1);
});
