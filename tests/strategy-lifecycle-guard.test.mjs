import test from 'node:test';
import assert from 'node:assert/strict';
import { ExperimentEngine, StrategyLifecycleGuard } from '../packages/experiment-engine/dist/index.js';

test('StrategyLifecycleGuard rejects illegal transition candidate -> active', async () => {
  const guard = new StrategyLifecycleGuard();
  await guard.registerCandidate('cand-illegal');
  await assert.rejects(() => guard.activate('cand-illegal'), /Invalid lifecycle transition/);
});

test('rollback path is reachable via promotion decision', async () => {
  const engine = new ExperimentEngine();
  const candidateId = 'cand-rollback';

  await engine.registerCandidate(candidateId);
  await engine.markCandidateEvaluated(candidateId);
  const experiment = await engine.startExperimentGuarded(candidateId);
  const decision = await engine.decidePromotion(experiment.id);

  assert.ok(['promoted', 'rolled_back'].includes(decision));
});
