import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ReplayAuditEngine } from '../packages/replay-debug/dist/index.js';

const fixturePath = new URL('../packages/replay-debug/fixtures/stu-candidate-replay.json', import.meta.url);

test('STUCandidate replay/audit fixture keeps pattern/bias/gate traceability', async () => {
  const fixture = JSON.parse(await readFile(fixturePath, 'utf-8'));
  const engine = new ReplayAuditEngine();
  const replay = engine.replay(fixture);

  assert.equal(replay.replayable, true);
  assert.deepEqual(replay.stages, ['candidate_generated', 'bias_snapshot_attached', 'experiment_gate']);
});
