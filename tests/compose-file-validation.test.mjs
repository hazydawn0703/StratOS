import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const compose = readFileSync(new URL('../compose.yaml', import.meta.url), 'utf-8');

test('compose file contains finance-app service, volumes, ports and healthcheck', () => {
  assert.ok(compose.includes('services:'));
  assert.ok(compose.includes('finance-app:'));
  assert.ok(compose.includes('healthcheck:'));
  assert.ok(compose.includes('volumes:'));
  assert.ok(compose.includes('FINANCE_PORT'));
});
