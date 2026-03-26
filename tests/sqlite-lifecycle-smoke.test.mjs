import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { DatabaseStrategyLifecycleStore } from '../packages/infrastructure/dist/index.js';

class SQLiteCliDriver {
  constructor(dbPath) {
    this.dbPath = dbPath;
    execFileSync('sqlite3', [this.dbPath, 'CREATE TABLE IF NOT EXISTS lifecycle(candidate_id TEXT PRIMARY KEY, payload TEXT NOT NULL);']);
  }

  async save(snapshot) {
    const payload = JSON.stringify(snapshot).replaceAll("'", "''");
    execFileSync('sqlite3', [
      this.dbPath,
      `INSERT INTO lifecycle(candidate_id,payload) VALUES('${snapshot.candidateId}','${payload}') ON CONFLICT(candidate_id) DO UPDATE SET payload=excluded.payload;`
    ]);
  }

  async get(candidateId) {
    const rows = execFileSync('sqlite3', [this.dbPath, `SELECT payload FROM lifecycle WHERE candidate_id='${candidateId}';`], {
      encoding: 'utf-8'
    }).trim();
    if (!rows) return undefined;
    return JSON.parse(rows);
  }
}

test('SQLite lifecycle persistence smoke (real sqlite3 CLI path)', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'stratos-sqlite-'));
  const dbPath = join(dir, 'lifecycle.db');

  const store = new DatabaseStrategyLifecycleStore(undefined, new SQLiteCliDriver(dbPath));
  const snapshot = {
    candidateId: 'cand-sqlite',
    state: 'candidate',
    history: [{ at: new Date().toISOString(), state: 'candidate' }]
  };

  await store.save(snapshot);
  const loaded = await store.get('cand-sqlite');

  assert.equal(loaded?.candidateId, 'cand-sqlite');
  await rm(dir, { recursive: true, force: true });
});
