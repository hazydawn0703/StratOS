import test from 'node:test';
import assert from 'node:assert/strict';
import { FinanceRouteHandlers } from '../apps/finance/dist/application/http/FinanceRouteHandlers.js';

const handlers = new FinanceRouteHandlers();

test('setup save-config never echoes secret values and runtime/settings only show configured refs', async () => {
  const secretValue = 'super-secret-value';
  const save = await handlers.handle({
    method: 'POST',
    path: '/api/finance/setup/save-config',
    body: {
      mode: 'local',
      infrastructure: { database: 'sqlite', queue: 'sqlite', scheduler: 'sqlite' },
      model: { providerType: 'mock', modelAlias: 'finance-main', useMockProvider: true },
      app: { defaultPortfolioName: 'Secret Mask Test' },
      automation: { daily_brief_generation: true },
      secrets: { OPENAI_API_KEY_REF: secretValue }
    }
  });

  const settings = await handlers.handle({ method: 'GET', path: '/api/finance/settings/runtime' });

  assert.equal(save.status, 200);
  assert.equal(JSON.stringify(save.body).includes(secretValue), false);
  assert.equal(settings.status, 200);
  assert.equal(settings.body.secrets.OPENAI_API_KEY_REF, 'configured');
  assert.equal(JSON.stringify(settings.body).includes(secretValue), false);
});
