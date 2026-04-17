import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';

test('finance installer command is executable', () => {
  const out = execSync('pnpm --filter @stratos/finance run setup -- --dry-run', {
    cwd: process.cwd(),
    encoding: 'utf-8'
  });
  assert.ok(out.includes('Finance installer completed'));
});
