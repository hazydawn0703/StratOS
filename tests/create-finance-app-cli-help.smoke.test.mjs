import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';

test('create-finance-app CLI help smoke', () => {
  const out = execSync('pnpm --filter @stratos/create-finance-app run cli -- --help', {
    cwd: process.cwd(),
    encoding: 'utf-8'
  });
  assert.ok(out.includes('Usage:'));
  assert.ok(out.includes('@stratos/create-finance-app'));
  assert.ok(out.includes('--repo <git-url>'));
  assert.ok(out.includes('STRATOS_REPO_URL'));
  assert.ok(!out.includes('--demo-data'));
  assert.ok(!out.includes('--mock-runtime'));
});
