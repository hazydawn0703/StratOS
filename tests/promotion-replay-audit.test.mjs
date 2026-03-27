import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ReplayAuditEngine } from '../packages/replay-debug/dist/index.js';

test('promotion decision replay fixture is explainable', () => {
  const fixture = JSON.parse(
    readFileSync(new URL('../packages/replay-debug/fixtures/promotion-decision-replay.json', import.meta.url), 'utf-8')
  );
  const engine = new ReplayAuditEngine();
  const summary = engine.explainPromotionChange(fixture);
  assert.match(summary, /decision:promote/);
  assert.match(summary, /candidate_version:candidate-v2/);
});

test('promotion run summary includes runId and governance events', () => {
  const fixture = JSON.parse(
    readFileSync(new URL('../packages/replay-debug/fixtures/promotion-decision-replay.json', import.meta.url), 'utf-8')
  );
  const engine = new ReplayAuditEngine();
  const summary = engine.explainPromotionRunSummary({
    run_id: 'run-phase-o-1',
    promotion: fixture,
    governance_events: ['manual_approval_requested', 'approval_sla_breached']
  });
  assert.match(summary, /run:run-phase-o-1/);
  assert.match(summary, /governance_events:manual_approval_requested\|approval_sla_breached/);
});
