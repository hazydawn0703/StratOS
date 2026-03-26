import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ExperimentEngine,
  StrategyLifecycleGuard,
  decidePromotionAction
} from '../packages/experiment-engine/dist/index.js';
import { InMemoryGovernanceEventStore } from '../packages/infrastructure/dist/index.js';

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

test('manual approval path can promote candidate and leaves governance event trail', async () => {
  const engine = new ExperimentEngine(new InMemoryGovernanceEventStore());
  await engine.registerCandidate('cand-manual');
  await engine.markCandidateEvaluated('cand-manual');
  await engine.startExperimentGuarded('cand-manual');

  const { audit } = await engine.evaluatePromotion({
    policy: {
      policy_id: 'p-manual',
      app: 'finance',
      min_sample_size: 10,
      min_observation_window_hours: 24,
      require_manual_approval: true,
      promote_threshold: 0.5,
      rollback_threshold: -0.5
    },
    evaluation: {
      candidate_id: 'cand-manual',
      candidate_version: 'v2',
      baseline_id: 'baseline',
      baseline_version: 'v1',
      recommendation: 'promote',
      metric_deltas: { quality_delta: 0.6 },
      risk_notes: [],
      sample_failures: []
    },
    experiment: {
      experiment_id: 'exp-cand-manual',
      candidate_id: 'cand-manual',
      candidate_version: 'v2',
      baseline_version: 'v1',
      mode: 'canary',
      bucket: 'b1',
      sample_size: 20,
      observation_window_hours: 48,
      metrics: { quality_delta: 0.6 },
      rollback_ready: true,
      notes: []
    },
    sourceErrorPatternId: 'pattern-1',
    impactedTaskType: 'report_generation'
  });

  assert.equal(audit.decision.action, 'manual_review');
  assert.equal(audit.decision.approval_status, 'pending');

  const approved = await engine.approvePromotion({
    candidateId: 'cand-manual',
    approver: 'qa-owner',
    approve: true,
    audit
  });
  assert.equal(approved.decision.action, 'promote');
  assert.equal(approved.decision.approval_status, 'approved');
  assert.equal(approved.decision.approved_by, 'qa-owner');

  const events = await engine.listGovernanceEvents('cand-manual');
  assert.ok(events.length >= 3);
});

test('manual review from risk notes creates approval ticket even if policy does not require manual approval', async () => {
  const engine = new ExperimentEngine(new InMemoryGovernanceEventStore());
  await engine.registerCandidate('cand-risk');
  await engine.markCandidateEvaluated('cand-risk');
  await engine.startExperimentGuarded('cand-risk');

  const { audit } = await engine.evaluatePromotion({
    policy: {
      policy_id: 'p-risk',
      app: 'finance',
      min_sample_size: 10,
      min_observation_window_hours: 24,
      require_manual_approval: false,
      promote_threshold: 0.5,
      rollback_threshold: -0.5
    },
    evaluation: {
      candidate_id: 'cand-risk',
      candidate_version: 'v2',
      baseline_id: 'baseline',
      baseline_version: 'v1',
      recommendation: 'promote',
      metric_deltas: { quality_delta: 0.6 },
      risk_notes: ['bias drift'],
      sample_failures: []
    },
    experiment: {
      experiment_id: 'exp-cand-risk',
      candidate_id: 'cand-risk',
      candidate_version: 'v2',
      baseline_version: 'v1',
      mode: 'canary',
      bucket: 'b1',
      sample_size: 20,
      observation_window_hours: 48,
      metrics: { quality_delta: 0.6 },
      rollback_ready: true,
      notes: []
    },
    sourceErrorPatternId: 'pattern-risk',
    impactedTaskType: 'report_generation'
  });

  assert.equal(audit.decision.action, 'manual_review');
  assert.equal(audit.decision.requires_manual_approval, true);
  assert.equal(audit.decision.approval_status, 'pending');
  assert.ok(engine.getManualApprovalTicket('cand-risk'));
});

test('approvePromotion rejects invalid inputs', async () => {
  const engine = new ExperimentEngine(new InMemoryGovernanceEventStore());

  await assert.rejects(
    () =>
      engine.approvePromotion({
        candidateId: 'cand-missing',
        approver: 'qa-owner',
        approve: true,
        audit: {
          audit_id: 'a1',
          candidate_id: 'cand-missing',
          source_error_pattern_id: 'pattern',
          evaluation: {
            candidate_id: 'cand-missing',
            candidate_version: 'v1',
            baseline_id: 'baseline',
            baseline_version: 'v0',
            metric_deltas: {},
            risk_notes: [],
            sample_failures: [],
            recommendation: 'hold'
          },
          experiment: {
            experiment_id: 'exp',
            candidate_id: 'cand-missing',
            candidate_version: 'v1',
            baseline_version: 'v0',
            mode: 'shadow',
            bucket: 'default',
            sample_size: 1,
            observation_window_hours: 1,
            metrics: {},
            rollback_ready: true,
            notes: []
          },
          decision: {
            candidate_id: 'cand-missing',
            candidate_version: 'v1',
            baseline_version: 'v0',
            action: 'manual_review',
            reasons: [],
            requires_manual_approval: true
          },
          impacted_task_type: 'report_generation',
          created_at: new Date().toISOString()
        }
      }),
    /manual approval ticket not found/
  );
});
