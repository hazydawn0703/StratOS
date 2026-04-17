import { execFileSync } from 'node:child_process';

export interface FinanceSqlExecutor {
  exec(dbPath: string, sql: string, asJson?: boolean): string;
}

export class CliFinanceSqlExecutor implements FinanceSqlExecutor {
  exec(dbPath: string, sql: string, asJson = false): string {
    const args = asJson ? [dbPath, '-cmd', '.timeout 5000', '-json', sql] : [dbPath, '-cmd', '.timeout 5000', sql];
    const retries = 4;
    for (let i = 0; i <= retries; i += 1) {
      try {
        return execFileSync('sqlite3', args, { encoding: 'utf8' }).trim();
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        if (!msg.includes('database is locked') || i === retries) throw error;
      }
    }
    return '';
  }
}
