import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const run = (cmd) => execFileSync('bash', ['-lc', cmd], { encoding: 'utf8' });

test('finance db workflow: init -> migrate -> seed', () => {
  run('pnpm finance:db:reset');
  run('pnpm finance:db:init');
  run('pnpm finance:db:migrate');
  run('pnpm finance:db:seed');

  const output = run("sqlite3 -json apps/finance/.data/finance-app.db \"SELECT COUNT(*) AS c FROM finance_benchmark_samples;\"");
  const count = JSON.parse(output)[0].c;
  assert.ok(count >= 1);
});
