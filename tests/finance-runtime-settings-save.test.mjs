import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceRouteHandlers } from '../apps/finance/dist/application/http/FinanceRouteHandlers.js';

const handlers = new FinanceRouteHandlers();

test('runtime settings save api persists runtime summary', async () => {
  const save = await handlers.handle({
    method: 'POST',
    path: '/api/finance/settings/runtime/save',
    body: {
      mode: 'mock',
      runtimeConfig: { providerProfileId: 'local-mock', providerKey: 'mock', defaultModelAlias: 'mock-main', routingDefaults: { uncertaintyThreshold: 0.4 } },
      appPreferences: { taskRoutingDefaults: { daily_brief_generation: { taskIntent: 'brief', impactLevel: 'medium' } } },
      secretRefs: { apiKeyRef: 'ref://runtime/mock' },
      changedBy: 'tester'
    }
  });
  assert.equal(save.status, 200);
  assert.equal(save.body.mode, 'mock');

  const read = await handlers.handle({ method: 'GET', path: '/api/finance/settings/runtime' });
  assert.equal(read.status, 200);
  assert.equal(read.body.runtimeOverview.providerProfile, 'local-mock');
});
