import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const readme = readFileSync(new URL('../apps/finance/README.md', import.meta.url), 'utf-8');

test('finance README quick start lists docker compose + npx/dlx + from-source paths', () => {
  assert.ok(readme.includes('Docker Compose'));
  assert.ok(readme.includes('npx @stratos/create-finance-app'));
  assert.ok(readme.includes('pnpm dlx @stratos/create-finance-app'));
  assert.ok(readme.includes('pnpm --filter @stratos/finance run setup'));
});
