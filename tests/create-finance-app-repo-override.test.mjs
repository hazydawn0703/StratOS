import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';

test('create-finance-app allows STRATOS_REPO_URL override', () => {
  const repoUrl = 'https://github.com/example/forked-stratos.git';
  const out = execSync('pnpm --filter @stratos/create-finance-app run cli -- --mode from-source --dry-run --dir ./tmp-fin-env-override', {
    cwd: process.cwd(),
    encoding: 'utf-8',
    env: { ...process.env, STRATOS_REPO_URL: repoUrl }
  });
  assert.ok(out.includes(`git clone --depth 1 ${repoUrl}`));
});

test('create-finance-app allows --repo override with higher priority than env', () => {
  const envRepo = 'https://github.com/example/env.git';
  const argRepo = 'https://github.com/example/arg.git';
  const out = execSync(
    `pnpm --filter @stratos/create-finance-app run cli -- --mode from-source --repo ${argRepo} --dry-run --dir ./tmp-fin-arg-override`,
    {
      cwd: process.cwd(),
      encoding: 'utf-8',
      env: { ...process.env, STRATOS_REPO_URL: envRepo }
    }
  );
  assert.ok(out.includes(`git clone --depth 1 ${argRepo}`));
  assert.ok(!out.includes(`git clone --depth 1 ${envRepo}`));
});
