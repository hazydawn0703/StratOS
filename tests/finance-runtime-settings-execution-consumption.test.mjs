import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceRepository } from '../apps/finance/dist/domain/repository.js';
import { FinanceRuntimeSettingsService } from '../apps/finance/dist/application/services/FinanceRuntimeSettingsService.js';
import { FinanceTaskService } from '../apps/finance/dist/application/services/FinanceTaskService.js';

const repo = new FinanceRepository();
const runtimeSettings = new FinanceRuntimeSettingsService(repo);
const taskService = new FinanceTaskService(undefined, runtimeSettings);

test('runtime settings are consumed by task execution through router + gateway', async () => {
  runtimeSettings.save({
    mode: 'real-runtime-configured',
    runtimeConfig: {
      providerProfileId: 'exec-profile',
      providerKey: 'mock',
      defaultModelAlias: 'finance-main-v2',
      reviewerModelAlias: 'finance-review-v2',
      reviewerEnabled: true,
      structuredOutputMode: 'preferred',
      costGuardrail: 0.3,
      latencyGuardrailMs: 1200
    },
    appPreferences: { taskRoutingDefaults: {} },
    secretRefs: { OPENAI_API_KEY_REF: 'vault://finance/openai' },
    changedBy: 'runtime-consumption-test'
  });

  const result = await taskService.runReportGeneration({
    thesisType: 'growth',
    riskLevel: 'medium'
  });

  assert.equal(result.modelResponse.provider, 'mock');
  assert.equal(result.modelResponse.model, 'finance-main-v2');
  assert.equal(result.context.metadata.runtimeTrace.reviewerEnabled, true);
  assert.equal(result.context.metadata.runtimeTrace.reviewerModelAlias, 'finance-review-v2');
  assert.deepEqual(result.context.metadata.runtimeTrace.secretRefs, ['OPENAI_API_KEY_REF']);
  assert.equal(result.context.metadata.runtimeTrace.guardrails.cost, 0.3);
  assert.equal(result.context.metadata.runtimeTrace.guardrails.latencyMs, 1200);
});

test('runtime model alias switch + reviewer toggle are reflected in execution trace', async () => {
  runtimeSettings.save({
    mode: 'real-runtime-configured',
    runtimeConfig: {
      providerProfileId: 'exec-profile-switched',
      providerKey: 'mock',
      defaultModelAlias: 'finance-main-v3',
      reviewerModelAlias: 'finance-review-v3',
      reviewerEnabled: false,
      structuredOutputMode: 'required'
    },
    appPreferences: { taskRoutingDefaults: {} },
    secretRefs: { REVIEWER_KEY_REF: 'vault://finance/reviewer' },
    changedBy: 'runtime-switch-test'
  });

  const result = await taskService.runReviewGeneration({
    thesisType: 'value',
    riskLevel: 'low'
  });

  assert.equal(result.modelResponse.model, 'finance-main-v3');
  assert.equal(result.context.metadata.runtimeTrace.reviewerEnabled, false);
  assert.equal(result.context.metadata.runtimeTrace.reviewerModelAlias, 'finance-review-v3');
  assert.deepEqual(result.context.metadata.runtimeTrace.secretRefs, ['REVIEWER_KEY_REF']);
});
