import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceCoreLoopService } from '../apps/finance/dist/application/services/FinanceCoreLoopService.js';

test('finance core loop smoke: Artifact->Claim->Outcome->Review->ErrorPattern->Evaluation->Experiment', async () => {
  const service = new FinanceCoreLoopService();
  const result = await service.run({
    artifactId: 'artifact-smoke',
    artifactContent: 'Revenue growth will accelerate after product launch.',
    taskType: 'report_generation',
    outcome: {
      outcome_id: 'outcome-smoke',
      claim_id: 'artifact-smoke-claim-1',
      outcome_label: 'partial',
      evidence: 'growth observed but slower than expected',
      outcome_timestamp: '2026-03-26T00:00:00.000Z'
    }
  });

  assert.ok(result.claimId.length > 0);
  assert.ok(result.reviewId.length > 0);
  assert.ok(result.experimentId.startsWith('exp-'));
});
