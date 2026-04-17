import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceRepository } from '../apps/finance/dist/domain/repository.js';
import { FinanceTaskAutomationService } from '../apps/finance/dist/application/services/FinanceTaskAutomationService.js';

const repo = new FinanceRepository();
const svc = FinanceTaskAutomationService.inMemory(repo);

test('candidate generation task produces finance STU proposals from patterns', async () => {
  repo.savePattern({
    id: `pattern-sem-${Date.now()}`,
    patternCode: 'confidence_overstatement',
    supportCount: 4,
    severity: 'medium',
    reviewIds: ['r1', 'r2', 'r3', 'r4']
  });

  await svc.enqueue('finance_candidate_generation', {}, 'manual');
  const ran = await svc.runNext();
  assert.equal(ran.status, 'succeeded');
  assert.ok((ran.refs.candidateIds ?? []).length >= 1);
});
