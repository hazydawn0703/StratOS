import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ReplayAuditEngine } from '../packages/replay-debug/dist/index.js';

const fixturePath = new URL('../packages/replay-debug/fixtures/minimal-replay.json', import.meta.url);

test('replay/audit fixture is replayable (not only compilable)', async () => {
  const content = await readFile(fixturePath, 'utf-8');
  const fixture = JSON.parse(content);

  const engine = new ReplayAuditEngine();
  const result = engine.replay(fixture);

  assert.equal(result.replayable, true);
  assert.equal(result.eventCount, 2);
  assert.deepEqual(result.stages, ['strategy_compilation', 'model_generation']);
});
