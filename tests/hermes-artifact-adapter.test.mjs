import test from 'node:test';
import assert from 'node:assert/strict';

import { createHermesArtifactAdapter } from '../integrations/hermes/adapters/artifact/service.mjs';

const adapter = createHermesArtifactAdapter();

test('adapts analysis output to strategy_analysis_artifact', () => {
  const result = adapter.adapt({
    taskType: 'analysis',
    sourceTaskId: 'task_analysis_001',
    rawOutput: {
      title: 'APAC Risk Scan',
      summary: 'Segment B has highest downside risk.',
      sections: [{ heading: 'Risk', content: '...' }]
    }
  });

  assert.equal(result.ok, true);
  assert.equal(result.artifact.artifact_type, 'strategy_analysis_artifact');
  assert.equal(result.artifact.schema_version, 'hermes.artifact.v0.1');
});

test('adapts planning markdown output to strategy_plan_artifact', () => {
  const result = adapter.adapt({
    taskType: 'planning',
    sourceTaskId: 'task_plan_001',
    rawOutput: '# Plan\n\n## Next Steps\n\n1. Validate assumptions'
  });

  assert.equal(result.ok, true);
  assert.equal(result.artifact.artifact_type, 'strategy_plan_artifact');
  assert.ok(result.artifact.sections.length >= 1);
});

test('returns adaptation failure and preserves raw output for unsupported task type', () => {
  const rawOutput = 'some output';
  const result = adapter.adapt({
    taskType: 'chat',
    sourceTaskId: 'task_chat_001',
    rawOutput
  });

  assert.equal(result.ok, false);
  assert.equal(result.adaptation_failure.task_type, 'chat');
  assert.equal(result.adaptation_failure.raw_output, rawOutput);
});

test('returns adaptation failure for empty output', () => {
  const result = adapter.adapt({
    taskType: 'scheduled_report',
    sourceTaskId: 'task_report_001',
    rawOutput: '   '
  });

  assert.equal(result.ok, false);
  assert.equal(result.adaptation_failure.reason_code, 'empty_output');
});
