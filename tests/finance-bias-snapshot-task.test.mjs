import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

test('bias snapshot generation task writes snapshot with behavior and outcome signals', async () => {
  const tmpRoot = mkdtempSync(join(tmpdir(), 'finance-bias-test-'));
  const dbPath = join(tmpRoot, 'finance-bias.db');
  const originalDbPath = process.env.FINANCE_DB_PATH;
  process.env.FINANCE_DB_PATH = dbPath;

  try {
    const { FinanceRepository } = await import('../apps/finance/dist/domain/repository.js');
    const { FinanceTaskAutomationService } = await import('../apps/finance/dist/application/services/FinanceTaskAutomationService.js');
    const repo = new FinanceRepository();
    const svc = FinanceTaskAutomationService.inMemory(repo);

    // seed minimal deterministic signals for behavior/outcome dimensions
    repo.savePrediction({
      id: `pred-bias-${Date.now()}`,
      artifactId: 'artifact-bias',
      type: 'thesis',
      ticker: 'NVDA',
      direction: 'bullish',
      horizonDays: 7,
      confidence: 0.82,
      thesis: 'Revenue will accelerate with demand expansion over next week.',
      triggerType: 'time_based',
      triggerAt: new Date(Date.now() - 60_000).toISOString(),
      evidence: ['seed'],
      admittedAt: new Date(Date.now() - 2 * 86_400_000).toISOString()
    });
    repo.saveOutcome({
      id: `out-bias-${Date.now()}`,
      predictionId: repo.listPredictions()[0].id,
      observedAt: new Date().toISOString(),
      outcomeLabel: 'confirmed',
      evidence: 'Confirmed with public earnings evidence and subsequent guidance.'
    });

    await svc.enqueue('bias_snapshot_generation', {}, 'manual');

    let ran;
    for (let i = 0; i < 10; i += 1) {
      const next = await svc.runNext();
      if (!next) break;
      if (next.taskType === 'bias_snapshot_generation') {
        ran = next;
        break;
      }
    }

    assert.ok(ran);
    assert.equal(ran.status, 'succeeded');
    const snapshots = repo.listBiasSnapshots('finance-system');
    assert.ok(snapshots.length >= 1);
    const latest = snapshots[0].payload;
    assert.ok(latest.behaviorSignals);
    assert.ok(latest.outcomeSignals);
  } finally {
    if (originalDbPath === undefined) delete process.env.FINANCE_DB_PATH;
    else process.env.FINANCE_DB_PATH = originalDbPath;
    rmSync(tmpRoot, { recursive: true, force: true });
  }
});
