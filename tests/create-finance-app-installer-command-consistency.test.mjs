import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../packages/create-finance-app/package.json', import.meta.url), 'utf-8'));
const readme = readFileSync(new URL('../apps/finance/README.md', import.meta.url), 'utf-8');

test('installer package name/bin align with README installer commands', () => {
  assert.equal(pkg.name, '@hazydawn0703/create-finance-app');
  assert.ok(pkg.bin['create-finance-app']);
  assert.ok(readme.includes('npx @hazydawn0703/create-finance-app'));
  assert.ok(readme.includes('pnpm dlx @hazydawn0703/create-finance-app'));
});
