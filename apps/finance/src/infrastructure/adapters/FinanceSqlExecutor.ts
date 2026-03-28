import { execFileSync } from 'node:child_process';

export interface FinanceSqlExecutor {
  exec(dbPath: string, sql: string, asJson?: boolean): string;
}

export class CliFinanceSqlExecutor implements FinanceSqlExecutor {
  exec(dbPath: string, sql: string, asJson = false): string {
    const args = asJson ? [dbPath, '-json', sql] : [dbPath, sql];
    return execFileSync('sqlite3', args, { encoding: 'utf8' }).trim();
  }
}
