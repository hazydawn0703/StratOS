import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { createTestFinanceDbPath, withIsolatedFinanceEnv } from './helpers/financeTestDb.mjs';

const dbPath = createTestFinanceDbPath('finance-cli-smoke');

test('setup/bootstrap command smoke', () => {
  const out = execSync('pnpm --filter @stratos/finance run setup:bootstrap', {
    cwd: process.cwd(),
    encoding: 'utf-8',
    env: withIsolatedFinanceEnv(dbPath)
  });
  assert.ok(out.includes('setupCompleted'));
});
