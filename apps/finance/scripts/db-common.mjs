import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';

export const dbPath = resolve(process.cwd(), 'apps/finance/.data/finance-app.db');
export const migrationsDir = resolve(process.cwd(), 'apps/finance/db/migrations');

export const runSql = (sql) => execFileSync('sqlite3', [dbPath, sql], { encoding: 'utf8' });
export const runSqlJson = (sql) => execFileSync('sqlite3', [dbPath, '-json', sql], { encoding: 'utf8' });

export const ensureDbDir = () => mkdirSync(dirname(dbPath), { recursive: true });

export const migrationFiles = () => {
  const entries = execFileSync('bash', ['-lc', `ls -1 ${migrationsDir}`], { encoding: 'utf8' }).trim();
  return entries ? entries.split('\n').filter(Boolean) : [];
};

export const migrationSql = (name) => readFileSync(join(migrationsDir, name), 'utf8');
