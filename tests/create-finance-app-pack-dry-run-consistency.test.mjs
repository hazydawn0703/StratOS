import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';

test('create-finance-app pack dry-run includes self-consistent files for clone-based installer', () => {
  const out = execSync('bash -lc "npm pack --dry-run 2>&1"', {
    cwd: new URL('../packages/create-finance-app', import.meta.url),
    encoding: 'utf-8'
  });

  assert.ok(out.includes('README.md'));
  assert.ok(out.includes('bin/create-finance-app.mjs'));
  assert.ok(out.includes('package.json'));
  assert.ok(out.includes('total files: 3'));
});
