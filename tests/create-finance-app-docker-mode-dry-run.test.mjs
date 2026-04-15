import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';

test('create-finance-app docker-compose mode dry-run', () => {
  const out = execSync('pnpm --filter @stratos/create-finance-app run cli -- --mode docker-compose --dry-run --dir ./tmp-fin-docker', {
    cwd: process.cwd(),
    encoding: 'utf-8'
  });
  assert.ok(out.includes('docker compose up -d'));
  assert.ok(out.includes('Setup URL'));
});
