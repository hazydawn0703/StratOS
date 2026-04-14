import test from 'node:test';
import assert from 'node:assert/strict';
import { ActiveSTUEffectProofService } from '../apps/finance/dist/application/services/ActiveSTUEffectProofService.js';

test('active STU effect replay is observable and compiler-injected', async () => {
  const svc = new ActiveSTUEffectProofService();
  const result = await svc.runReplay({ ticker: 'NVDA', thesisType: 'growth', inputBody: 'Revenue will accelerate with AI cycle.' });

  assert.ok(result.replayId.startsWith('stu-replay-'));
  assert.equal(result.compilerTrace.baselineActiveVersions.length, 0);
  assert.ok(result.compilerTrace.activeActiveVersions.length >= 1);
  assert.notEqual(result.active.artifactBody, result.baseline.artifactBody);
  assert.ok(result.effectSummary.artifactDelta !== 0 || result.effectSummary.predictionDelta !== 0);
});
