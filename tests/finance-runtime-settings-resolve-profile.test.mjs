import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceRouteHandlers } from '../apps/finance/dist/application/http/FinanceRouteHandlers.js';

const handlers = new FinanceRouteHandlers();

test('runtime settings resolve-profile resolves configured alias', async () => {
  await handlers.handle({
    method: 'POST',
    path: '/api/finance/settings/runtime/save',
    body: {
      mode: 'mock',
      runtimeConfig: {
        providerProfileId: 'resolve-profile',
        providerKey: 'mock',
        defaultModelAlias: 'finance-main',
        providerProfiles: [{ providerKey: 'mock', defaultModelAlias: 'finance-main' }]
      },
      appPreferences: { taskRoutingDefaults: {} },
      secretRefs: {}
    }
  });

  const response = await handlers.handle({ method: 'POST', path: '/api/finance/settings/runtime/resolve-profile', body: { alias: 'finance-main' } });
  assert.equal(response.status, 200);
  assert.equal(response.body.resolved, true);
});
