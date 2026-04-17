#!/usr/bin/env node
import { existsSync, copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

const DEFAULT_REPO_URL = 'https://github.com/hazydawn0703/StratOS.git';

const HELP = `@hazydawn0703/create-finance-app

Usage:
  npx @hazydawn0703/create-finance-app [options]
  pnpm dlx @hazydawn0703/create-finance-app [options]

Options:
  --mode <from-source|docker-compose>   Install mode (default: from-source)
  --repo <git-url>                      Repo URL (default: ${DEFAULT_REPO_URL})
  --dir <path>                          Target directory (default: ./stratos-finance)
  --port <number>                       Finance web port (default: 4310)
  --dry-run                             Print actions without executing
  --help                                Show this help

Repo override:
  Set STRATOS_REPO_URL to override default repo when --repo is not passed.
`;

const arg = (key, fallback) => {
  const i = process.argv.indexOf(key);
  return i >= 0 ? process.argv[i + 1] : fallback;
};
const has = (key) => process.argv.includes(key);

if (has('--help')) {
  console.log(HELP);
  process.exit(0);
}

const mode = arg('--mode', 'from-source');
const targetDir = resolve(arg('--dir', './stratos-finance'));
const port = Number(arg('--port', '4310'));
const dryRun = has('--dry-run');
const repoUrl = arg('--repo', process.env.STRATOS_REPO_URL ?? DEFAULT_REPO_URL);

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
  if (mode === 'docker-compose' && !dryRun && !checkTool('docker')) {
    throw new Error('docker is required for docker-compose mode');
  }
};

const isNonEmptyDir = (dir) => {
  if (!existsSync(dir)) return false;
  try {
    return readdirSync(dir).length > 0;
  } catch {
    return false;
  }
};

const ensureRepoCheckout = () => {
  if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true });
  if (isNonEmptyDir(targetDir)) {
    throw new Error(`Target directory is not empty: ${targetDir}. Please use an empty --dir or remove existing files.`);
  }
  run(`git clone --depth 1 ${repoUrl} ${targetDir}`);
};

const ensureDotEnv = () => {
  const template = resolve(targetDir, '.env.example');
  const envFile = resolve(targetDir, '.env');
  if (dryRun) {
    console.log(`[dry-run] copy ${template} -> ${envFile} (if missing)`);
    return;
  }
  if (!existsSync(template)) {
    throw new Error(`Missing .env.example in cloned repo: ${template}`);
  }
  if (!existsSync(envFile)) copyFileSync(template, envFile);
};

const printNext = () => {
  console.log('\n✅ create-finance-app completed');
  console.log(`Mode: ${mode}`);
  console.log(`Repo: ${repoUrl}`);
  console.log(`Target: ${targetDir}`);
  console.log(`Setup URL: http://127.0.0.1:${port}/finance/setup`);
  console.log('Next steps:');
  if (mode === 'docker-compose') {
    console.log(`  cd ${targetDir}`);
    console.log('  docker compose up -d');
    console.log('  docker compose logs -f finance-app');
    console.log('  docker compose down');
  } else {
    console.log(`  cd ${targetDir}`);
    console.log('  pnpm --filter @stratos/finance run setup:bootstrap');
    console.log('  pnpm --filter @stratos/finance run healthcheck');
    console.log('  pnpm --filter @stratos/finance run demo-run');
    console.log('  pnpm --filter @stratos/finance run dev');
  }
};

const fromSource = () => {
  ensureRepoCheckout();
  run('pnpm install --frozen-lockfile', targetDir);
  run('pnpm --filter @stratos/finance run setup', targetDir);
};

const dockerComposeMode = () => {
  ensureRepoCheckout();
  ensureDotEnv();
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
