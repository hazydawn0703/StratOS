import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const compose = readFileSync(new URL('../compose.yaml', import.meta.url), 'utf-8');
const envTemplate = readFileSync(new URL('../.env.example', import.meta.url), 'utf-8');

test('compose env placeholders are declared in root .env.example', () => {
  const required = ['FINANCE_PORT'];
  required.forEach((key) => {
    assert.ok(compose.includes(`\${${key}`));
    assert.ok(envTemplate.includes(`${key}=`));
  });
});
