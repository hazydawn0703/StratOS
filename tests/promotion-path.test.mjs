import test from 'node:test';
import assert from 'node:assert/strict';
import {
  StrategyLifecycleGuard,
  decidePromotionAction
} from '../packages/experiment-engine/dist/index.js';

test('promotion path candidate -> evaluated -> experimenting -> active', async () => {
  const guard = new StrategyLifecycleGuard();
  await guard.registerCandidate('cand-phase-l');
  await guard.markEvaluated('cand-phase-l');
  await guard.markExperimenting('cand-phase-l');
  const snapshot = await guard.activate('cand-phase-l');
  assert.equal(snapshot.state, 'active');
});

test('promotion path rejects illegal candidate -> active transition', async () => {
  const guard = new StrategyLifecycleGuard();
  await guard.registerCandidate('cand-illegal-l');
  await assert.rejects(() => guard.activate('cand-illegal-l'), /Invalid lifecycle transition/);
});

test('promotion decision branches hold/rollback/manual_review are reachable', () => {
  const baseInput = {
    policy: {
      policy_id: 'p1',
      app: 'finance',
      min_sample_size: 10,
      min_observation_window_hours: 24,
      require_manual_approval: false,
      promote_threshold: 0.5,
      rollback_threshold: -0.5
    },
    evaluation: {
      candidate_id: 'cand',
      candidate_version: 'v2',
      baseline_version: 'v1',
      recommendation: 'promote',
      risk_notes: [],
      sample_failures: []
    }
  };

  assert.equal(
    decidePromotionAction({
      ...baseInput,
      experiment: {
        rollback_ready: true,
        sample_size: 1,
        observation_window_hours: 1,
        metrics: { delta: 0.7 }
      }
    }),
    'hold'
  );

  assert.equal(
    decidePromotionAction({
      ...baseInput,
      evaluation: { ...baseInput.evaluation, sample_failures: ['high loss bucket'] },
      experiment: {
        rollback_ready: true,
        sample_size: 20,
        observation_window_hours: 48,
        metrics: { delta: 0.7 }
      }
    }),
    'rollback'
  );

  assert.equal(
    decidePromotionAction({
      ...baseInput,
      evaluation: { ...baseInput.evaluation, risk_notes: ['bias drift'] },
      experiment: {
        rollback_ready: true,
        sample_size: 20,
        observation_window_hours: 48,
        metrics: { delta: 0.7 }
      }
    }),
    'manual_review'
  );
});
