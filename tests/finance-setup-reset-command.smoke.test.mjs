import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';

test('setup/reset command smoke', () => {
  const out = execSync('pnpm --filter @stratos/finance run setup:reset', {
    cwd: process.cwd(),
    encoding: 'utf-8'
  });
  assert.ok(out.includes('"reset": true'));
});
