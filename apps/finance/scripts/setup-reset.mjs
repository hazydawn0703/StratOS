#!/usr/bin/env node
import { resolveFinanceDbPath } from './db-path.mjs';

const dryRun = process.argv.includes('--dry-run');
if (dryRun) {
  console.log('[dry-run] POST /api/finance/setup/reset');
  process.exit(0);
}

process.env.FINANCE_DB_PATH ??= resolveFinanceDbPath(import.meta.dirname);
const { FinanceRouteHandlers } = await import('../dist/application/http/FinanceRouteHandlers.js');

const handlers = new FinanceRouteHandlers();
const response = await handlers.handle({
  method: 'POST',
  path: '/api/finance/setup/reset',
  body: { reason: process.argv[2] ?? 'manual_reset' }
});
if (response.status >= 400) {
  console.error(JSON.stringify(response.body));
  process.exit(1);
}
console.log(JSON.stringify(response.body, null, 2));
