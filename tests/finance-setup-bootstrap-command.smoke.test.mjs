import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';

const dbPath = `/tmp/stratos-${process.pid}-${Math.random().toString(16).slice(2)}.db`;

test('setup/bootstrap command smoke', () => {
  const out = execSync('pnpm --filter @stratos/finance run setup:bootstrap', {
    cwd: process.cwd(),
    encoding: 'utf-8',
    env: { ...process.env, FINANCE_DB_PATH: dbPath }
  });
  assert.ok(out.includes('setupCompleted'));
});
