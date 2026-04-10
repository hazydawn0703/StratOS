#!/usr/bin/env node
import { resolve } from 'node:path';

const dryRun = process.argv.includes('--dry-run');
if (dryRun) {
  console.log('[dry-run] POST /api/finance/setup/bootstrap');
  process.exit(0);
}

process.env.FINANCE_DB_PATH ??= resolve(import.meta.dirname, '../.data/finance-app.db');
const { FinanceRouteHandlers } = await import('../dist/application/http/FinanceRouteHandlers.js');
const handlers = new FinanceRouteHandlers();
const status = await handlers.handle({ method: 'GET', path: '/api/finance/setup/status' });
if (!status.body.setupCompleted && status.body.setupState === 'not_initialized') {
  await handlers.handle({
    method: 'POST',
    path: '/api/finance/setup/save-config',
    body: {
      mode: 'local',
      infrastructure: { database: 'sqlite', queue: 'sqlite', scheduler: 'sqlite' },
      model: { providerType: 'mock', modelAlias: 'finance-default', useMockProvider: true },
      app: { defaultPortfolioName: 'Setup Bootstrap Portfolio' },
      automation: { daily_brief_generation: true, prediction_review: true },
      secrets: {}
    }
  });
}
const response = await handlers.handle({ method: 'POST', path: '/api/finance/setup/bootstrap' });
if (response.status >= 400) {
  console.error(JSON.stringify(response.body));
  process.exit(1);
}
console.log(JSON.stringify(response.body, null, 2));
