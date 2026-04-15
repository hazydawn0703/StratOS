import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceRepository } from '../apps/finance/dist/domain/repository.js';
import { FinanceRuntimeSettingsService } from '../apps/finance/dist/application/services/FinanceRuntimeSettingsService.js';
import { FinanceTaskAutomationService } from '../apps/finance/dist/application/services/FinanceTaskAutomationService.js';

const repo = new FinanceRepository();
const runtimeSvc = new FinanceRuntimeSettingsService(repo);
const taskSvc = FinanceTaskAutomationService.inMemory(repo);

test('saved runtime settings affect task runtime defaults refs', async () => {
  runtimeSvc.save({
    mode: 'mock',
    runtimeConfig: { providerProfileId: 'routing-defaults', providerKey: 'mock', defaultModelAlias: 'runtime-main' },
    appPreferences: { taskRoutingDefaults: { daily_brief_generation: { taskIntent: 'daily_brief', impactLevel: 'medium' } } },
    secretRefs: {},
    changedBy: 'routing-defaults-test'
  });

  const task = await taskSvc.enqueue('daily_brief_generation', { title: 'routing defaults', body: 'body' }, 'manual');
  assert.equal(task.refs.runtimeDefaults.taskIntent, 'daily_brief');
  assert.equal(task.refs.runtimeDefaults.impactLevel, 'medium');
});
