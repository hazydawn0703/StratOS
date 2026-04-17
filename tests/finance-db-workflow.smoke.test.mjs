import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createTestFinanceDbPath, withIsolatedFinanceEnv } from './helpers/financeTestDb.mjs';

const dbPath = createTestFinanceDbPath('finance-db-workflow');
const run = (cmd) =>
  execFileSync('bash', ['-lc', cmd], {
    encoding: 'utf8',
    env: withIsolatedFinanceEnv(dbPath)
  });

test('finance db workflow: init -> migrate -> seed', () => {
  run('pnpm finance:db:reset');
  run('pnpm finance:db:init');
  run('pnpm finance:db:migrate');
  run('pnpm finance:db:seed');

  const output = run(`sqlite3 -json ${dbPath} \"SELECT COUNT(*) AS c FROM finance_benchmark_samples;\"`);
  const count = JSON.parse(output)[0].c;
  assert.ok(count >= 1);
});
