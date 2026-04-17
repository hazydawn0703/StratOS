import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceRuntimeSettingsService } from '../apps/finance/dist/application/services/FinanceRuntimeSettingsService.js';
import { FinanceRepository } from '../apps/finance/dist/domain/repository.js';

const repo = new FinanceRepository();
const svc = new FinanceRuntimeSettingsService(repo);

test('app-to-runtime config mapping returns task routing defaults', () => {
  svc.save({
    mode: 'mock',
    runtimeConfig: { providerProfileId: 'map', providerKey: 'mock', defaultModelAlias: 'map-main' },
    appPreferences: { taskRoutingDefaults: { prediction_review: { taskIntent: 'review', impactLevel: 'high' } } },
    secretRefs: {},
    changedBy: 'mapper'
  });

  const mapped = svc.mapTaskDefaults('prediction_review');
  assert.equal(mapped.taskIntent, 'review');
  assert.equal(mapped.impactLevel, 'high');
});
