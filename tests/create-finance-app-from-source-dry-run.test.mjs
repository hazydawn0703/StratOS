import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';

test('create-finance-app from-source dry-run', () => {
  const out = execSync('pnpm --filter @stratos/create-finance-app run cli -- --mode from-source --dry-run --dir ./tmp-fin-src', {
    cwd: process.cwd(),
    encoding: 'utf-8'
  });
  assert.ok(out.includes('git clone --depth 1'));
  assert.ok(out.includes('pnpm install --frozen-lockfile'));
});
