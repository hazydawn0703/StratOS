import { ensureDbDir, migrationFiles, migrationSql, runSql, runSqlJson } from './db-common.mjs';

ensureDbDir();
runSql("CREATE TABLE IF NOT EXISTS finance_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, applied_at TEXT NOT NULL);");
const applied = JSON.parse(runSqlJson("SELECT name FROM finance_migrations;") || '[]').map((x) => x.name);

for (const file of migrationFiles()) {
  if (applied.includes(file)) continue;
  const sql = migrationSql(file);
  runSql(sql);
  runSql(`INSERT INTO finance_migrations(name, applied_at) VALUES ('${file}', datetime('now'));`);
  console.log(`applied migration: ${file}`);
}
