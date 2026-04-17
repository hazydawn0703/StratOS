import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { resolveFinanceDbPath } from './db-path.mjs';

export const dbPath = resolveFinanceDbPath();
export const migrationsDir = resolve(process.cwd(), 'apps/finance/db/migrations');

const runWithRetry = (args, retries = 4) => {
  for (let i = 0; i <= retries; i += 1) {
    try {
      return execFileSync('sqlite3', [dbPath, '-cmd', '.timeout 5000', ...args], { encoding: 'utf8' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (!msg.includes('database is locked') || i === retries) throw error;
    }
  }
  return '';
};

export const runSql = (sql) => runWithRetry([sql]);
export const runSqlJson = (sql) => runWithRetry(['-json', sql]);

export const ensureDbDir = () => mkdirSync(dirname(dbPath), { recursive: true });

export const migrationFiles = () => {
  const entries = execFileSync('bash', ['-lc', `ls -1 ${migrationsDir}`], { encoding: 'utf8' }).trim();
  return entries ? entries.split('\n').filter(Boolean) : [];
};

export const migrationSql = (name) => readFileSync(join(migrationsDir, name), 'utf8');
