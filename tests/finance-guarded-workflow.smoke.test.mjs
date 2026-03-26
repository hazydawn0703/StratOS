import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceStrategyLifecycleService } from '../apps/finance/dist/application/services/FinanceStrategyLifecycleService.js';

test('finance guarded workflow smoke loop', async () => {
  const service = new FinanceStrategyLifecycleService();
  const experimentId = await service.startCandidateExperiment('cand-finance-smoke');
  assert.ok(experimentId.startsWith('exp-'));

  const decision = await service.finalizeCandidate(experimentId);
  assert.ok(['promoted', 'rolled_back'].includes(decision));
});
