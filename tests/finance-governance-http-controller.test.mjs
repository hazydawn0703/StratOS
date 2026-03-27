import test from 'node:test';
import assert from 'node:assert/strict';
import { FinancePromotionService } from '../apps/finance/dist/application/services/FinancePromotionService.js';
import { FinanceGovernanceTransportFacade } from '../apps/finance/dist/application/transport/FinanceGovernanceTransportFacade.js';
import { FinanceGovernanceHttpController } from '../apps/finance/dist/application/transport/FinanceGovernanceHttpController.js';
import { FinanceSTUCandidateService } from '../apps/finance/dist/application/services/FinanceSTUCandidateService.js';

test('governance http controller handles run summary endpoints', async () => {
  const promotionService = new FinancePromotionService();
  const candidateService = new FinanceSTUCandidateService();
  const facade = new FinanceGovernanceTransportFacade(promotionService);
  const controller = new FinanceGovernanceHttpController(facade);

  const candidateFlow = await candidateService.run({
    artifactId: 'artifact-phase-s',
    artifactContent:
      'Operating cash flow improved in consecutive quarters.\nOperating cash flow improved in consecutive quarters.',
    taskType: 'report_generation',
    outcome: {
      outcome_id: 'outcome-phase-s',
      claim_id: 'artifact-phase-s-claim-1',
      outcome_label: 'partial',
      evidence: 'signal present but noisy',
      outcome_timestamp: '2026-03-27T00:00:00.000Z'
    }
  });

  await promotionService.run({
    runId: 'run-finance-phase-s-1',
    candidate: candidateFlow.candidate,
    taskType: 'report_generation',
    baselineVersion: 'finance-baseline-v1',
    candidateVersion: 'finance-candidate-v4',
    evaluationMetrics: { quality_delta: 0.31, risk_delta: 0.01 },
    experimentMode: 'canary',
    governance: { autoApproveManualReview: true, approver: 'finance-lead' }
  });

  const one = await controller.handle({
    method: 'GET',
    path: '/governance/run-summary',
    query: { runId: 'run-finance-phase-s-1' }
  });
  assert.equal(one.statusCode, 200);

  const list = await controller.handle({
    method: 'GET',
    path: '/governance/run-summaries',
    query: { sort: 'indexed_at_desc', limit: '5', offset: '0' }
  });
  assert.equal(list.statusCode, 200);
});

test('governance http controller validates required params', async () => {
  const controller = new FinanceGovernanceHttpController(new FinanceGovernanceTransportFacade(new FinancePromotionService()));
  const missingRunId = await controller.handle({ method: 'GET', path: '/governance/run-summary' });
  assert.equal(missingRunId.statusCode, 400);

  const missingMessageId = await controller.handle({ method: 'POST', path: '/governance/dead-letters/requeue', body: {} });
  assert.equal(missingMessageId.statusCode, 400);
});
