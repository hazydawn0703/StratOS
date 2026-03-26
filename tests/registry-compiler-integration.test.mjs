import test from 'node:test';
import assert from 'node:assert/strict';
import { STURegistry } from '../packages/stu-registry/dist/index.js';
import { StrategyCompiler } from '../packages/strategy-compiler/dist/index.js';

test('registry + compiler loads active STU and keeps priority active > experiment > candidate', () => {
  const registry = new STURegistry();
  const compiler = new StrategyCompiler();
  const candidate = {
    candidate_id: 'stu-candidate-1',
    source_error_pattern_id: 'pattern-1',
    review_refs: ['r1'],
    evidence_refs: ['e1'],
    scope_note: 'finance reports',
    strategy_summary: 'Candidate summary',
    schema_version: '1.0',
    created_at: '2026-03-26T00:00:00.000Z'
  };

  registry.registerCandidate({
    candidate,
    app: 'finance',
    task_type: 'report_generation',
    artifact_type: 'analysis_report',
    candidate_version: 'v2-candidate',
    promptLayer: ['candidate prompt']
  });
  registry.assignExperimentBucket({
    experiment_id: 'exp-1',
    bucket: 'a',
    candidate_id: 'stu-candidate-1',
    candidate_version: 'v2-candidate'
  });
  registry.activate('stu-candidate-1', 'v2-candidate');

  const context = {
    taskType: 'report_generation',
    thesisType: 'finance',
    riskLevel: 'medium',
    metadata: {}
  };
  const compiled = compiler.compile(registry.getCompilationInput(context, { includeCandidates: true }), context);

  assert.ok(compiled.audit.activeStuVersions.includes('stu-candidate-1@v2-candidate'));
  assert.equal(compiled.audit.appliedPriority[3], 'active_stu');
  assert.equal(compiled.audit.appliedPriority[4], 'experiment_stu');
  assert.equal(compiled.audit.appliedPriority[5], 'candidate_stu');
});
