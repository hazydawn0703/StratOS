import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceSTUCandidateService } from '../apps/finance/dist/application/services/FinanceSTUCandidateService.js';
import { FinancePromotionService } from '../apps/finance/dist/application/services/FinancePromotionService.js';
import { FinanceGovernanceTransportFacade } from '../apps/finance/dist/application/transport/FinanceGovernanceTransportFacade.js';

test('finance governance transport can query run summaries after promotion flow', async () => {
  const candidateService = new FinanceSTUCandidateService();
  const promotionService = new FinancePromotionService();
  const governanceFacade = new FinanceGovernanceTransportFacade(promotionService);

  const candidateFlow = await candidateService.run({
    artifactId: 'artifact-phase-r',
    artifactContent:
      'Revenue guidance is improving quarter over quarter.\nRevenue guidance is improving quarter over quarter.',
    taskType: 'report_generation',
    outcome: {
      outcome_id: 'outcome-phase-r',
      claim_id: 'artifact-phase-r-claim-1',
      outcome_label: 'partial',
      evidence: 'signal present but noisy',
      outcome_timestamp: '2026-03-27T00:00:00.000Z'
    }
  });

  await promotionService.run({
    runId: 'run-finance-phase-r-1',
    candidate: candidateFlow.candidate,
    taskType: 'report_generation',
    baselineVersion: 'finance-baseline-v1',
    candidateVersion: 'finance-candidate-v3',
    evaluationMetrics: { quality_delta: 0.35, risk_delta: 0.02 },
    experimentMode: 'canary',
    governance: { autoApproveManualReview: true, approver: 'finance-lead' }
  });

  const summary = await governanceFacade.getRunSummary({ runId: 'run-finance-phase-r-1' });
  assert.equal(summary.statusCode, 200);
  assert.match(summary.summary ?? '', /run:run-finance-phase-r-1/);

  const list = await governanceFacade.listRunSummaries({
    from: '2000-01-01T00:00:00.000Z',
    to: '2099-01-01T00:00:00.000Z'
  });
  assert.equal(list.statusCode, 200);
  assert.ok(list.items.length >= 1);
});

test('finance governance transport dead-letter endpoints return stable contract', async () => {
  const governanceFacade = new FinanceGovernanceTransportFacade(new FinancePromotionService());
  const deadLetters = await governanceFacade.listDeadLetterAlerts();
  assert.equal(deadLetters.statusCode, 200);
  assert.ok(Array.isArray(deadLetters.items));

  const requeue = await governanceFacade.requeueDeadLetterAlert({ messageId: 'msg-not-exist' });
  assert.equal(requeue.statusCode, 404);
  assert.equal(requeue.requeued, false);
});
