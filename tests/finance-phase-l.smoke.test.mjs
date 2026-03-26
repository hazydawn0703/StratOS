import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceSTUCandidateService } from '../apps/finance/dist/application/services/FinanceSTUCandidateService.js';
import { FinancePromotionService } from '../apps/finance/dist/application/services/FinancePromotionService.js';

test('finance Phase L smoke: Claim->Review->ErrorPattern->STUCandidate->Evaluation->Experiment->PromotionDecision->active STU->Next Task compile', async () => {
  const candidateService = new FinanceSTUCandidateService();
  const promotionService = new FinancePromotionService();

  const candidateFlow = await candidateService.run({
    artifactId: 'artifact-phase-l',
    artifactContent:
      'Earnings surprise likely to persist due to operating leverage.\nEarnings surprise likely to persist due to operating leverage.',
    taskType: 'report_generation',
    outcome: {
      outcome_id: 'outcome-phase-l',
      claim_id: 'artifact-phase-l-claim-1',
      outcome_label: 'partial',
      evidence: 'signal present but noisy',
      outcome_timestamp: '2026-03-26T00:00:00.000Z'
    }
  });

  const promotionFlow = await promotionService.run({
    candidate: candidateFlow.candidate,
    taskType: 'report_generation',
    baselineVersion: 'finance-baseline-v1',
    candidateVersion: 'finance-candidate-v2',
    evaluationMetrics: { quality_delta: 0.3, risk_delta: 0.05 },
    experimentMode: 'canary'
  });

  assert.ok(['promote', 'hold', 'rollback', 'manual_review', 'deprecate'].includes(promotionFlow.audit.decision.action));
  assert.match(promotionFlow.compileAuditSummary, /candidate:/);
  assert.match(promotionFlow.compileAuditSummary, /decision:/);
});
