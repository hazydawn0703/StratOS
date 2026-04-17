#!/usr/bin/env node
import { existsSync, copyFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

const HELP = `@stratos/create-finance-app

Usage:
  npx @stratos/create-finance-app [options]
  pnpm dlx @stratos/create-finance-app [options]

Options:
  --mode <from-source|docker-compose>   Install mode (default: from-source)
  --dir <path>                          Target directory (default: ./stratos-finance)
  --port <number>                       Finance web port (default: 4310)
  --demo-data <true|false>              Whether to include demo data hints (default: true)
  --mock-runtime <true|false>           Whether to keep mock runtime/provider (default: true)
  --dry-run                             Print actions without executing
  --help                                Show this help
`;

const arg = (key, fallback) => {
  const i = process.argv.indexOf(key);
  return i >= 0 ? process.argv[i + 1] : fallback;
};
const has = (key) => process.argv.includes(key);
const boolArg = (key, fallback) => {
  const raw = arg(key, String(fallback));
  return String(raw).toLowerCase() !== 'false';
};

if (has('--help')) {
  console.log(HELP);
  process.exit(0);
}

const mode = arg('--mode', 'from-source');
const targetDir = resolve(arg('--dir', './stratos-finance'));
const port = Number(arg('--port', '4310'));
const dryRun = has('--dry-run');
const demoData = boolArg('--demo-data', true);
const mockRuntime = boolArg('--mock-runtime', true);

const run = (cmd, cwd = process.cwd()) => {
  if (dryRun) {
    console.log(`[dry-run] (${cwd}) ${cmd}`);
    return;
  }
  execSync(cmd, { cwd, stdio: 'inherit' });
};

const checkTool = (tool) => {
  try {
    execSync(`${tool} --version`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

const ensureEnv = () => {
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  if (!Number.isFinite(nodeMajor) || nodeMajor < 20) {
    throw new Error(`Node.js >=20 required. Current: ${process.versions.node}`);
  }
  if (!checkTool('git')) throw new Error('git is required');
  if (!checkTool('pnpm') && !checkTool('npm')) throw new Error('pnpm or npm is required');
  if (mode === 'docker-compose') {
    if (!dryRun && !checkTool('docker')) throw new Error('docker is required for docker-compose mode');
  }
};

const printNext = () => {
  console.log('\n✅ create-finance-app completed');
  console.log(`Mode: ${mode}`);
  console.log(`Target: ${targetDir}`);
  console.log(`Setup URL: http://127.0.0.1:${port}/finance/setup`);
  console.log(`Suggested runtime mode: ${mockRuntime ? 'mock' : 'real-runtime-configured'}`);
  console.log(`Demo data hint: ${demoData ? 'enabled' : 'disabled'}`);
  console.log('Next steps:');
  if (mode === 'docker-compose') {
    console.log('  docker compose up -d');
    console.log('  docker compose logs -f finance-app');
    console.log('  docker compose down');
  } else {
    console.log('  pnpm --filter @stratos/finance run setup:bootstrap');
    console.log('  pnpm --filter @stratos/finance run healthcheck');
    console.log('  pnpm --filter @stratos/finance run demo-run');
    console.log('  pnpm --filter @stratos/finance run dev');
  }
};

const fromSource = () => {
  const repoUrl = process.env.STRATOS_REPO_URL ?? 'https://github.com/stratos-labs/stratos.git';
  if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true });
  run(`git clone --depth 1 ${repoUrl} ${targetDir}`);
  run('pnpm install --frozen-lockfile', targetDir);
  run('pnpm --filter @stratos/finance run setup', targetDir);
};

const dockerComposeMode = () => {
  const template = resolve(process.cwd(), '.env.example');
  const envFile = resolve(targetDir, '.env');
  if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true });
  if (existsSync(template) && !existsSync(envFile)) {
    if (dryRun) {
      console.log(`[dry-run] copy ${template} -> ${envFile}`);
    } else {
      copyFileSync(template, envFile);
    }
  }
  run('docker compose up -d', targetDir);
};

try {
  if (!['from-source', 'docker-compose'].includes(mode)) {
    throw new Error(`Unsupported mode: ${mode}`);
  }
  ensureEnv();
  if (mode === 'from-source') fromSource();
  if (mode === 'docker-compose') dockerComposeMode();
  printNext();
} catch (error) {
  console.error('❌ create-finance-app failed');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
