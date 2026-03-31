import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { CliFinanceSqlExecutor, type FinanceSqlExecutor } from '../adapters/FinanceSqlExecutor.js';

const DEFAULT_DB_PATH = resolve(process.env.FINANCE_DB_PATH ?? resolve(process.cwd(), 'apps/finance/.data/finance-app.db'));

export class FinanceSQLite {
  constructor(
    private readonly dbPath: string = DEFAULT_DB_PATH,
    private readonly sqlExecutor: FinanceSqlExecutor = new CliFinanceSqlExecutor()
  ) {
    mkdirSync(dirname(this.dbPath), { recursive: true });
    this.bootstrap();
  }

  private bootstrap(): void {
    this.exec(
      `
PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS finance_portfolios (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  base_currency TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS finance_portfolio_holdings (
  id TEXT PRIMARY KEY,
  portfolio_id TEXT NOT NULL,
  ticker TEXT NOT NULL,
  quantity REAL NOT NULL,
  average_cost REAL NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS finance_watchlist_items (
  id TEXT PRIMARY KEY,
  ticker TEXT NOT NULL,
  thesis TEXT NOT NULL,
  priority TEXT NOT NULL,
  added_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS finance_assets (
  id TEXT PRIMARY KEY,
  ticker TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  name TEXT NOT NULL,
  metadata_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS finance_report_inputs (
  id TEXT PRIMARY KEY,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS finance_artifacts (
  id TEXT PRIMARY KEY,
  task_type TEXT NOT NULL,
  artifact_type TEXT NOT NULL,
  title TEXT NOT NULL,
  ticker TEXT,
  generated_at TEXT NOT NULL,
  body TEXT NOT NULL,
  evidence_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS finance_prediction_payloads (
  id TEXT PRIMARY KEY,
  artifact_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  admitted_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS finance_outcome_payloads (
  id TEXT PRIMARY KEY,
  prediction_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  observed_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS finance_review_payloads (
  id TEXT PRIMARY KEY,
  prediction_id TEXT NOT NULL,
  outcome_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  reviewed_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS finance_error_patterns (
  id TEXT PRIMARY KEY,
  payload_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS finance_stu_proposals (
  id TEXT PRIMARY KEY,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS finance_bias_snapshots (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS finance_benchmark_samples (
  id TEXT PRIMARY KEY,
  sample_set TEXT NOT NULL,
  task_type TEXT NOT NULL,
  input_json TEXT NOT NULL,
  expected_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS finance_stu_effect_replays (
  id TEXT PRIMARY KEY,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS finance_metrics_events (
  id TEXT PRIMARY KEY,
  metric_key TEXT NOT NULL,
  metric_value REAL NOT NULL,
  meta_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS finance_tasks (
  id TEXT PRIMARY KEY,
  task_type TEXT NOT NULL,
  status TEXT NOT NULL,
  scheduled_at TEXT,
  started_at TEXT,
  finished_at TEXT,
  retry_count INTEGER NOT NULL,
  error_summary TEXT,
  last_error_at TEXT,
  next_retry_at TEXT,
  source TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  refs_json TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS finance_source_documents (
  id TEXT PRIMARY KEY,
  ticker TEXT,
  portfolio_id TEXT,
  source_type TEXT NOT NULL,
  source_timestamp TEXT NOT NULL,
  content TEXT NOT NULL,
  normalized_payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS finance_ingested_outcomes (
  id TEXT PRIMARY KEY,
  prediction_id TEXT,
  outcome_type TEXT NOT NULL,
  outcome_timestamp TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS finance_review_corrections (
  id TEXT PRIMARY KEY,
  review_id TEXT NOT NULL,
  corrected_payload_json TEXT NOT NULL,
  reason TEXT,
  counterevidence TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS finance_task_queue (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  task_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL,
  claim_token TEXT,
  lease_until TEXT,
  attempt_count INTEGER NOT NULL,
  enqueued_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS finance_task_schedule (
  id TEXT PRIMARY KEY,
  task_type TEXT NOT NULL,
  run_at TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS finance_prediction_review_runs (
  id TEXT PRIMARY KEY,
  prediction_id TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  outcome_id TEXT,
  run_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS finance_setup_configs (
  id TEXT PRIMARY KEY,
  setup_version TEXT NOT NULL,
  mode TEXT NOT NULL,
  non_secret_json TEXT NOT NULL,
  secret_json TEXT NOT NULL,
  setup_completed INTEGER NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS finance_setup_healthchecks (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  result_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS finance_runtime_settings (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL,
  runtime_config_json TEXT NOT NULL,
  app_preferences_json TEXT NOT NULL,
  secret_refs_json TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  active INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS finance_runtime_settings_history (
  id TEXT PRIMARY KEY,
  settings_id TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  changed_at TEXT NOT NULL,
  changed_fields_json TEXT NOT NULL,
  previous_summary_json TEXT NOT NULL,
  new_summary_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS finance_timeline_links (
  id TEXT PRIMARY KEY,
  ticker TEXT,
  portfolio_id TEXT,
  report_id TEXT,
  prediction_id TEXT,
  review_id TEXT,
  error_pattern_id TEXT,
  candidate_id TEXT,
  experiment_id TEXT,
  active_stu_effect TEXT,
  created_at TEXT NOT NULL
);
`
    );
  }

  upsert(table: string, id: string, columns: Record<string, string | number | null>): void {
    const keys = ['id', ...Object.keys(columns)];
    const vals = [id, ...Object.values(columns)].map((value) => this.quote(value));
    const updates = Object.keys(columns)
      .map((k) => `${k}=excluded.${k}`)
      .join(',');
    this.exec(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${vals.join(',')}) ON CONFLICT(id) DO UPDATE SET ${updates};`);
  }

  query<T>(sql: string): T[] {
    const out = this.exec(sql, true);
    if (!out) return [];
    return JSON.parse(out) as T[];
  }

  private exec(sql: string, asJson = false): string {
    return this.sqlExecutor.exec(this.dbPath, sql, asJson);
  }

  private quote(value: string | number | null): string {
    if (value === null) return 'NULL';
    if (typeof value === 'number') return String(value);
    return `'${value.replaceAll("'", "''")}'`;
  }
}
