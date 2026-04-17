import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';

test('create-finance-app docker-compose mode dry-run clones repo before compose', () => {
  const out = execSync('pnpm --filter @hazydawn0703/create-finance-app run cli -- --mode docker-compose --dry-run --dir ./tmp-fin-docker', {
    cwd: process.cwd(),
    encoding: 'utf-8'
  });
  assert.ok(out.includes('git clone --depth 1 https://github.com/hazydawn0703/StratOS.git'));
  assert.ok(out.includes('[dry-run] copy'));
  assert.ok(out.includes('.env.example'));
  assert.ok(out.includes('docker compose up -d'));
  assert.ok(out.includes('Setup URL'));
});
