import test from 'node:test';
import assert from 'node:assert/strict';
import { BiasMonitor } from '../packages/bias-monitor/dist/index.js';

test('bias-monitor gates candidate when bias risk is significant', () => {
  const monitor = new BiasMonitor();
  const snapshot = monitor.computeSnapshot({
    confidenceScores: [0.9, 0.8],
    rejectionFlags: [true, true],
    riskHints: [true, true],
    claimTiltValues: [0.6, 0.7],
    reviewPassFlags: [false, false],
    errorDirectionValues: [1, 1],
    severeErrorFlags: [true, true],
    rollbackFlags: [true, false]
  });

  const gate = monitor.gateCandidate('cand-bias', snapshot);
  assert.equal(gate.gate_status, 'needs_bias_review');
  assert.ok(gate.bias_reasons.length > 0);
});
