import test from 'node:test';
import assert from 'node:assert/strict';
import { ReplayAuditEngine } from '../packages/replay-debug/dist/index.js';

test('replay consumes runtime trace payload and keeps refs trace-only', () => {
  const engine = new ReplayAuditEngine();
  const fixture = {
    runId: 'runtime-replay-1',
    events: [
      {
        at: new Date().toISOString(),
        stage: 'runtime_settings_consumed',
        payload: {
          provider: 'mock',
          modelAlias: 'finance-main-v3',
          reviewerEnabled: false,
          secretRefKeys: ['REVIEWER_KEY_REF']
        }
      },
      {
        at: new Date().toISOString(),
        stage: 'router_decision',
        payload: { provider: 'mock' }
      },
      {
        at: new Date().toISOString(),
        stage: 'gateway_response',
        payload: { provider: 'mock', model: 'finance-main-v3' }
      }
    ]
  };

  const replay = engine.replay(fixture);

  assert.equal(replay.replayable, true);
  assert.deepEqual(replay.stages, [
    'runtime_settings_consumed',
    'router_decision',
    'gateway_response'
  ]);
  assert.equal('secretRefs' in fixture.events[0].payload, false);
});
