import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceRouteHandlers } from '../apps/finance/dist/application/http/FinanceRouteHandlers.js';

const handlers = new FinanceRouteHandlers();

test('runtime settings read masks secret refs and does not echo secret values', async () => {
  await handlers.handle({
    method: 'POST',
    path: '/api/finance/settings/runtime/save',
    body: {
      mode: 'mock',
      runtimeConfig: { providerProfileId: 'mask-test', providerKey: 'mock', defaultModelAlias: 'mock-main' },
      appPreferences: { taskRoutingDefaults: {} },
      secretRefs: { apiKeyRef: 'super-secret-value' },
      changedBy: 'mask-tester'
    }
  });

  const read = await handlers.handle({ method: 'GET', path: '/api/finance/settings/runtime' });
  assert.equal(read.status, 200);
  assert.equal(read.body.secrets.apiKeyRef, 'configured');
  assert.equal(JSON.stringify(read.body).includes('super-secret-value'), false);
});
