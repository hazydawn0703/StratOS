import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';

test('create-finance-app prints next-step commands', () => {
  const out = execSync('pnpm --filter @hazydawn0703/create-finance-app run cli -- --mode from-source --dry-run --dir ./tmp-fin-next', {
    cwd: process.cwd(),
    encoding: 'utf-8'
  });
  assert.ok(out.includes('pnpm --filter @stratos/finance run setup:bootstrap'));
  assert.ok(out.includes('pnpm --filter @stratos/finance run healthcheck'));
  assert.ok(out.includes('pnpm --filter @stratos/finance run demo-run'));
});
