import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const readme = readFileSync(new URL('../packages/create-finance-app/README.md', import.meta.url), 'utf-8');

test('create-finance-app package README is npm-focused and aligned with CLI help', () => {
  const help = execSync('pnpm --filter @hazydawn0703/create-finance-app run cli -- --help', {
    cwd: process.cwd(),
    encoding: 'utf-8'
  });

  assert.ok(readme.includes('npm package users'));
  assert.ok(readme.includes('--repo <git-url>'));
  assert.ok(readme.includes('STRATOS_REPO_URL'));
  assert.ok(readme.includes('https://github.com/hazydawn0703/StratOS.git'));

  assert.ok(help.includes('--mode <from-source|docker-compose>'));
  assert.ok(help.includes('--repo <git-url>'));
  assert.ok(help.includes('STRATOS_REPO_URL'));
});
