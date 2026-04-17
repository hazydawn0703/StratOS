import { execFileSync } from 'node:child_process';

export const createTestFinanceDbPath = (scope = 'finance-test') =>
  `/tmp/${scope}-${process.pid}-${Math.random().toString(16).slice(2)}.db`;

export const withIsolatedFinanceEnv = (dbPath) => ({
  ...process.env,
  FINANCE_DB_PATH: dbPath,
  STRATOS_FINANCE_DB_PATH: dbPath
});

export const setupFinanceTestDb = ({ dbPath, init = true, migrate = true, seed = false }) => {
  const env = withIsolatedFinanceEnv(dbPath);
  const run = (cmd) => execFileSync('bash', ['-lc', cmd], { cwd: process.cwd(), env, encoding: 'utf8' });
  if (init) run('pnpm finance:db:init');
  if (migrate) run('pnpm finance:db:migrate');
  if (seed) run('pnpm finance:db:seed');
  return dbPath;
};
