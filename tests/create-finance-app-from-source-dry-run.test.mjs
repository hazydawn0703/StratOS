import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';

test('create-finance-app from-source dry-run uses default repo and prints next steps', () => {
  const out = execSync('pnpm --filter @hazydawn0703/create-finance-app run cli -- --mode from-source --dry-run --dir ./tmp-fin-src', {
    cwd: process.cwd(),
    encoding: 'utf-8'
  });
  assert.ok(out.includes('git clone --depth 1 https://github.com/hazydawn0703/StratOS.git'));
  assert.ok(out.includes('pnpm install --frozen-lockfile'));
  assert.ok(out.includes('pnpm --filter @stratos/finance run setup:bootstrap'));
  assert.ok(out.includes('cd '));
});
