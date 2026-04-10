import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const readme = readFileSync(new URL('../apps/finance/README.md', import.meta.url), 'utf-8');
const pkg = JSON.parse(readFileSync(new URL('../apps/finance/package.json', import.meta.url), 'utf-8'));

test('finance README main commands align with apps/finance package scripts', () => {
  const required = ['setup', 'dev', 'build', 'typecheck', 'test', 'db:init', 'db:migrate', 'db:seed', 'setup:bootstrap', 'healthcheck', 'demo-run'];
  required.forEach((name) => {
    assert.ok(pkg.scripts[name], `missing script: ${name}`);
    assert.ok(readme.includes(`pnpm --filter @stratos/finance run ${name}`), `README missing command: ${name}`);
  });
});
