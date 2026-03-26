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
