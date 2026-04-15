import test from 'node:test';
import assert from 'node:assert/strict';

process.env.FINANCE_DB_PATH ??= `/tmp/stratos-${process.pid}-${Math.random().toString(16).slice(2)}.db`;

test('finance benchmark seed and evaluation comparison is locally runnable', async () => {
  const { FinanceBenchmarkService } = await import('../apps/finance/dist/application/benchmark/FinanceBenchmarkService.js');
  const { FinanceEvaluationService } = await import('../apps/finance/dist/application/evaluation/FinanceEvaluationService.js');

  const benchmark = new FinanceBenchmarkService();
  const evaluation = new FinanceEvaluationService();

  const seeded = benchmark.seedDefaultSamples();
  assert.ok(seeded.length >= 2);

  const cmp = evaluation.runBenchmarkComparison('candidate-finance-001');
  assert.ok(cmp.delta > 0);
});
