import { resolve } from 'node:path';

export const resolveFinanceDbPath = (cwd = process.cwd()) => {
  const explicit = process.env.FINANCE_DB_PATH ?? process.env.STRATOS_FINANCE_DB_PATH;
  if (explicit) return resolve(explicit);
  if (process.env.STRATOS_FINANCE_TEST_ISOLATED_DB === '1') {
    return resolve(`/tmp/finance-test-${process.pid}.db`);
  }
  return resolve(cwd, 'apps/finance/.data/finance-app.db');
};
