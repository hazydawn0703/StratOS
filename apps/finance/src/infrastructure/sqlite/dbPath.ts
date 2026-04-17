import { resolve } from 'node:path';

export const resolveFinanceDbPath = (cwd = process.cwd()): string => {
  const explicit = process.env.FINANCE_DB_PATH ?? process.env.STRATOS_FINANCE_DB_PATH;
  if (explicit) return resolve(explicit);

  if (process.env.STRATOS_FINANCE_TEST_ISOLATED_DB === '1') {
    const pid = (process as { pid?: number }).pid ?? 0;
    return resolve(`/tmp/finance-test-${pid}.db`);
  }

  return resolve(cwd, 'apps/finance/.data/finance-app.db');
};
