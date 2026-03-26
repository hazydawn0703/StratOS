import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceSTUCandidateService } from '../apps/finance/dist/application/services/FinanceSTUCandidateService.js';

test('finance STU candidate minimal loop: Claim->Review->ErrorPattern->STUCandidate->EvaluationInput->ExperimentCandidate', async () => {
  const service = new FinanceSTUCandidateService();
  const result = await service.run({
    artifactId: 'artifact-k',
    artifactContent: 'Claim for candidate generation.\nClaim for candidate generation.',
    taskType: 'report_generation',
    outcome: {
      outcome_id: 'outcome-k',
      claim_id: 'artifact-k-claim-1',
      outcome_label: 'partial',
      evidence: 'evidence-k',
      outcome_timestamp: '2026-03-26T00:00:00.000Z'
    }
  });

  assert.ok(result.candidate.candidate_id.startsWith('stu-candidate-'));
  assert.ok(['needs_bias_review', 'ready_for_evaluation'].includes(result.gateStatus));
});
