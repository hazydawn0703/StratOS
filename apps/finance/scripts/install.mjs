#!/usr/bin/env node
import { existsSync, copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');

const appDir = resolve(import.meta.dirname, '..');
const envExample = resolve(appDir, '.env.example');
const envFile = resolve(appDir, '.env');

const run = (cmd) => {
  if (dryRun) {
    console.log(`[dry-run] ${cmd}`);
    return;
  }
  execSync(cmd, { cwd: appDir, stdio: 'inherit' });
};

const assertEnv = () => {
  const [major] = process.versions.node.split('.').map(Number);
  if (!Number.isFinite(major) || major < 20) {
    throw new Error(`Node.js >=20 is required. Current: ${process.versions.node}`);
  }
};

const ensureEnvTemplate = () => {
  if (existsSync(envFile)) return;
  if (!existsSync(envExample)) throw new Error('apps/finance/.env.example is missing');
  if (dryRun) {
    console.log(`[dry-run] copy ${envExample} -> ${envFile}`);
    return;
  }
  copyFileSync(envExample, envFile);
};

try {
  assertEnv();
  ensureEnvTemplate();

  run('pnpm run db:init');
  run('pnpm run db:migrate');
  run('pnpm run db:seed');

  console.log('\n✅ Finance installer completed.');
  console.log('Next steps:');
  console.log('1) Start app: pnpm --filter @stratos/finance run dev');
  console.log('2) Open setup wizard: http://127.0.0.1:4310/finance/setup');
  console.log('3) Run bootstrap: pnpm --filter @stratos/finance run setup:bootstrap');
  console.log('4) Run healthcheck: pnpm --filter @stratos/finance run healthcheck');
  console.log('5) Run demo flow: pnpm --filter @stratos/finance run demo-run');
} catch (error) {
  console.error('❌ finance setup installer failed');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
