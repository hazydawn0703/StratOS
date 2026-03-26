import test from 'node:test';
import assert from 'node:assert/strict';
import { ReplayAuditEngine } from '../packages/replay-debug/dist/index.js';

test('replay-debug diff explains stage and payload differences', () => {
  const engine = new ReplayAuditEngine();
  const diff = engine.diff(
    {
      runId: 'base',
      events: [{ at: 't1', stage: 'strategy_compilation', payload: { taskType: 'report' } }]
    },
    {
      runId: 'cand',
      events: [{ at: 't2', stage: 'model_generation', payload: { provider: 'mock' } }]
    }
  );

  assert.deepEqual(diff.stageDiff.sort(), ['model_generation', 'strategy_compilation']);
  assert.deepEqual(diff.payloadKeyDiff.sort(), ['provider', 'taskType']);
});
