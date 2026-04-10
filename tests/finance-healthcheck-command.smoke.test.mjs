import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';

test('setup healthcheck command smoke', () => {
  const out = execSync('pnpm --filter @stratos/finance run healthcheck', {
    cwd: process.cwd(),
    encoding: 'utf-8'
  });
  assert.ok(out.includes('"status"'));
});
