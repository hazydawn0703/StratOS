import test from 'node:test';
import assert from 'node:assert/strict';

import { createHermesHintsService } from '../integrations/hermes/adapters/hints/service.mjs';

const hintStore = {
  hints: [
    {
      hint_id: 'hint_analysis_001',
      task_type: 'analysis',
      actor_id: 'agent_001',
      priority: 9,
      content: 'Include downside scenario ranges.',
      expires_at: '2026-05-01T00:00:00Z',
      active_stu_refs: ['stu_analysis_1'],
      route_flags: ['prefer_risk_checklist']
    },
    {
      hint_id: 'hint_planning_001',
      task_type: 'planning',
      actor_id: 'agent_002',
      priority: 8,
      content: 'Prioritize retention before expansion.',
      expires_at: '2026-05-01T00:00:00Z'
    }
  ]
};

const service = createHermesHintsService({ hintStore });

test('returns analysis hints for matching request', () => {
  const result = service.getStrategyHints({
    framework: 'hermes',
    actor_id: 'agent_001',
    task_type: 'analysis'
  });

  assert.equal(result.ok, true);
  assert.equal(result.response.version, 'hermes.hints.v0.1');
  assert.equal(result.response.hints.length, 1);
  assert.equal(result.response.active_stu_refs[0], 'stu_analysis_1');
});

test('returns planning hints for planning request', () => {
  const result = service.getStrategyHints({
    framework: 'hermes',
    actor_id: 'agent_002',
    task_type: 'planning'
  });

  assert.equal(result.ok, true);
  assert.equal(result.response.hints[0].hint_id, 'hint_planning_001');
});

test('returns empty structure when no hints match', () => {
  const result = service.getStrategyHints({
    framework: 'hermes',
    actor_id: 'agent_999',
    task_type: 'analysis',
    domain_tag: 'unknown'
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.response.hints, []);
  assert.deepEqual(result.response.active_stu_refs, []);
  assert.deepEqual(result.response.route_flags, []);
});

test('returns fail-open error response on invalid request', () => {
  const result = service.getStrategyHints({
    framework: 'hermes',
    actor_id: '',
    task_type: 'analysis'
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'invalid_request');
  assert.deepEqual(result.response.hints, []);
});
