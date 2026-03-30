import { ensureDbDir, runSql } from './db-common.mjs';

ensureDbDir();
runSql("CREATE TABLE IF NOT EXISTS finance_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, applied_at TEXT NOT NULL);");
console.log('finance db initialized');
