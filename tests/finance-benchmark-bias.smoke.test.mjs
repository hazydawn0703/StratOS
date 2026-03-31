import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceBenchmarkService } from '../apps/finance/dist/application/benchmark/FinanceBenchmarkService.js';
import { FinanceEvaluationService } from '../apps/finance/dist/application/evaluation/FinanceEvaluationService.js';

const benchmark = new FinanceBenchmarkService();
const evaluation = new FinanceEvaluationService();

test('finance benchmark seed and evaluation comparison is locally runnable', async () => {
  const seeded = benchmark.seedDefaultSamples();
  assert.ok(seeded.length >= 2);

  const cmp = evaluation.runBenchmarkComparison('candidate-finance-001');
  assert.ok(cmp.delta > 0);
});
