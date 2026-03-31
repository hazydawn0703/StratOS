import { FinanceSQLite } from '../infrastructure/sqlite/FinanceSQLite.js';
import type {
  FinanceArtifact,
  FinancePrediction,
  FinanceErrorPattern,
  FinanceSTUCandidateProposal,
  Holding,
  Portfolio,
  PredictionOutcome,
  PredictionReview,
  WatchlistItem
} from './models.js';

export interface FinanceBenchmarkSample {
  id: string;
  sampleSet: string;
  taskType: string;
  input: Record<string, unknown>;
  expected: Record<string, unknown>;
  createdAt: string;
}

export interface FinanceBiasSnapshot {
  id: string;
  scopeKey: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface FinanceMetricEvent {
  id: string;
  metricKey: string;
  metricValue: number;
  meta: Record<string, unknown>;
  createdAt: string;
}

export interface FinanceSTUEffectReplay {
  id: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface FinanceTaskRecord {
  id: string;
  taskType: string;
  status: 'pending' | 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled' | 'skipped';
  scheduledAt?: string;
  startedAt?: string;
  finishedAt?: string;
  retryCount: number;
  errorSummary?: string;
  lastErrorAt?: string;
  nextRetryAt?: string;
  source: "manual" | "schedule" | "replay";
  idempotencyKey: string;
  refs: Record<string, unknown>;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface FinanceSourceDocument {
  id: string;
  ticker?: string;
  portfolioId?: string;
  sourceType: string;
  sourceTimestamp: string;
  content: string;
  normalizedPayload: Record<string, unknown>;
  createdAt: string;
}

export interface FinanceIngestedOutcome {
  id: string;
  predictionId?: string;
  outcomeType: "price_window_outcome" | "earnings_outcome" | "risk_event_outcome" | "manual_outcome";
  outcomeTimestamp: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface FinanceReviewCorrection {
  id: string;
  reviewId: string;
  correctedPayload: Record<string, unknown>;
  reason?: string;
  counterevidence?: string;
  createdAt: string;
}

export interface FinanceQueueRecord {
  id: string;
  taskId: string;
  taskType: string;
  payload: Record<string, unknown>;
  source: FinanceTaskRecord['source'];
  status: 'queued' | 'claimed' | 'succeeded' | 'failed' | 'cancelled';
  claimToken?: string;
  leaseUntil?: string;
  attemptCount: number;
  enqueuedAt: string;
}

export interface FinanceScheduleRecord {
  id: string;
  taskType: string;
  runAt: string;
  payload: Record<string, unknown>;
  source: 'schedule';
  status: 'pending' | 'enqueued' | 'cancelled';
  createdAt: string;
}

export interface FinancePredictionReviewRun {
  id: string;
  predictionId: string;
  triggerType: string;
  outcomeId?: string;
  runKey: string;
  createdAt: string;
}

export interface FinanceTimelineLink {
  id: string;
  ticker?: string;
  portfolioId?: string;
  reportId?: string;
  predictionId?: string;
  reviewId?: string;
  errorPatternId?: string;
  candidateId?: string;
  experimentId?: string;
  activeSTUEffect?: string;
  createdAt: string;
}

export interface FinanceSetupConfigRecord {
  id: string;
  setupVersion: string;
  mode: 'local' | 'staging' | 'production';
  nonSecret: Record<string, unknown>;
  secret: Record<string, unknown>;
  setupCompleted: boolean;
  updatedAt: string;
}

export interface FinanceSetupHealthcheckRecord {
  id: string;
  status: 'ok' | 'degraded' | 'failed';
  result: Record<string, unknown>;
  createdAt: string;
}

export interface FinanceRuntimeSettingsRecord {
  id: string;
  mode: 'mock' | 'real-runtime-configured';
  runtimeConfig: Record<string, unknown>;
  appPreferences: Record<string, unknown>;
  secretRefs: Record<string, unknown>;
  updatedBy: string;
  updatedAt: string;
  active: boolean;
}

export interface FinanceRuntimeSettingsHistoryRecord {
  id: string;
  settingsId: string;
  changedBy: string;
  changedAt: string;
  changedFields: string[];
  previousSummary: Record<string, unknown>;
  newSummary: Record<string, unknown>;
}

export class FinanceRepository {
  private readonly db = new FinanceSQLite();

  listPortfolios(): Portfolio[] {
    return this.db.query<{ id: string; name: string; base_currency: string; created_at: string }>(
      'SELECT * FROM finance_portfolios ORDER BY created_at DESC;'
    ).map((x) => ({ id: x.id, name: x.name, baseCurrency: x.base_currency, createdAt: x.created_at }));
  }

  upsertPortfolio(portfolio: Portfolio): Portfolio {
    this.db.upsert('finance_portfolios', portfolio.id, {
      name: portfolio.name,
      base_currency: portfolio.baseCurrency,
      created_at: portfolio.createdAt
    });
    return portfolio;
  }

  listHoldings(portfolioId: string): Holding[] {
    return this.db
      .query<{ id: string; portfolio_id: string; ticker: string; quantity: number; average_cost: number; updated_at: string }>(
        `SELECT * FROM finance_portfolio_holdings WHERE portfolio_id='${portfolioId}' ORDER BY updated_at DESC;`
      )
      .map((x) => ({
        id: x.id,
        portfolioId: x.portfolio_id,
        ticker: x.ticker,
        quantity: x.quantity,
        averageCost: x.average_cost,
        updatedAt: x.updated_at
      }));
  }

  upsertHolding(holding: Holding): Holding {
    this.db.upsert('finance_portfolio_holdings', holding.id, {
      portfolio_id: holding.portfolioId,
      ticker: holding.ticker,
      quantity: holding.quantity,
      average_cost: holding.averageCost,
      updated_at: holding.updatedAt
    });
    return holding;
  }

  listWatchlist(): WatchlistItem[] {
    return this.db
      .query<{ id: string; ticker: string; thesis: string; priority: 'low' | 'medium' | 'high'; added_at: string }>(
        'SELECT * FROM finance_watchlist_items ORDER BY added_at DESC;'
      )
      .map((x) => ({ id: x.id, ticker: x.ticker, thesis: x.thesis, priority: x.priority, addedAt: x.added_at }));
  }

  upsertWatchlistItem(item: WatchlistItem): WatchlistItem {
    this.db.upsert('finance_watchlist_items', item.id, {
      ticker: item.ticker,
      thesis: item.thesis,
      priority: item.priority,
      added_at: item.addedAt
    });
    return item;
  }

  saveArtifact(artifact: FinanceArtifact): FinanceArtifact {
    this.db.upsert('finance_artifacts', artifact.id, {
      task_type: artifact.taskType,
      artifact_type: artifact.artifactType,
      title: artifact.title,
      ticker: artifact.ticker ?? null,
      generated_at: artifact.generatedAt,
      body: artifact.body,
      evidence_json: JSON.stringify(artifact.evidence)
    });
    return artifact;
  }

  listArtifacts(): FinanceArtifact[] {
    return this.db
      .query<{
        id: string;
        task_type: FinanceArtifact['taskType'];
        artifact_type: FinanceArtifact['artifactType'];
        title: string;
        ticker: string | null;
        generated_at: string;
        body: string;
        evidence_json: string;
      }>('SELECT * FROM finance_artifacts ORDER BY generated_at DESC;')
      .map((x) => ({
        id: x.id,
        taskType: x.task_type,
        artifactType: x.artifact_type,
        title: x.title,
        ticker: x.ticker ?? undefined,
        generatedAt: x.generated_at,
        body: x.body,
        evidence: JSON.parse(x.evidence_json)
      }));
  }

  savePrediction(prediction: FinancePrediction): FinancePrediction {
    this.db.upsert('finance_prediction_payloads', prediction.id, {
      artifact_id: prediction.artifactId,
      payload_json: JSON.stringify(prediction),
      admitted_at: prediction.admittedAt
    });
    return prediction;
  }

  listPredictions(): FinancePrediction[] {
    return this.db
      .query<{ payload_json: string }>('SELECT payload_json FROM finance_prediction_payloads ORDER BY admitted_at DESC;')
      .map((x) => JSON.parse(x.payload_json));
  }

  saveOutcome(outcome: PredictionOutcome): PredictionOutcome {
    this.db.upsert('finance_outcome_payloads', outcome.id, {
      prediction_id: outcome.predictionId,
      payload_json: JSON.stringify(outcome),
      observed_at: outcome.observedAt
    });
    return outcome;
  }

  saveReview(review: PredictionReview): PredictionReview {
    this.db.upsert('finance_review_payloads', review.id, {
      prediction_id: review.predictionId,
      outcome_id: review.outcomeId,
      payload_json: JSON.stringify(review),
      reviewed_at: review.reviewedAt
    });
    return review;
  }

  listReviews(): PredictionReview[] {
    return this.db
      .query<{ payload_json: string }>('SELECT payload_json FROM finance_review_payloads ORDER BY reviewed_at DESC;')
      .map((x) => JSON.parse(x.payload_json));
  }

  savePattern(pattern: FinanceErrorPattern): FinanceErrorPattern {
    this.db.upsert('finance_error_patterns', pattern.id, {
      payload_json: JSON.stringify(pattern),
      updated_at: new Date().toISOString()
    });
    return pattern;
  }

  listPatterns(): FinanceErrorPattern[] {
    return this.db
      .query<{ payload_json: string }>('SELECT payload_json FROM finance_error_patterns ORDER BY updated_at DESC;')
      .map((x) => JSON.parse(x.payload_json));
  }

  saveSTUProposal(proposal: FinanceSTUCandidateProposal): FinanceSTUCandidateProposal {
    this.db.upsert('finance_stu_proposals', proposal.id, {
      payload_json: JSON.stringify(proposal),
      created_at: new Date().toISOString()
    });
    return proposal;
  }

  listSTUProposals(): FinanceSTUCandidateProposal[] {
    return this.db
      .query<{ payload_json: string }>('SELECT payload_json FROM finance_stu_proposals ORDER BY created_at DESC;')
      .map((x) => JSON.parse(x.payload_json));
  }

  saveBiasSnapshot(snapshot: FinanceBiasSnapshot): FinanceBiasSnapshot {
    this.db.upsert('finance_bias_snapshots', snapshot.id, {
      scope_key: snapshot.scopeKey,
      payload_json: JSON.stringify(snapshot.payload),
      created_at: snapshot.createdAt
    });
    return snapshot;
  }

  listBiasSnapshots(scopeKey?: string): FinanceBiasSnapshot[] {
    const where = scopeKey ? `WHERE scope_key='${scopeKey}'` : '';
    return this.db
      .query<{ id: string; scope_key: string; payload_json: string; created_at: string }>(
        `SELECT * FROM finance_bias_snapshots ${where} ORDER BY created_at DESC;`
      )
      .map((x) => ({ id: x.id, scopeKey: x.scope_key, payload: JSON.parse(x.payload_json), createdAt: x.created_at }));
  }

  saveBenchmarkSample(sample: FinanceBenchmarkSample): FinanceBenchmarkSample {
    this.db.upsert('finance_benchmark_samples', sample.id, {
      sample_set: sample.sampleSet,
      task_type: sample.taskType,
      input_json: JSON.stringify(sample.input),
      expected_json: JSON.stringify(sample.expected),
      created_at: sample.createdAt
    });
    return sample;
  }

  listBenchmarkSamples(sampleSet = 'default'): FinanceBenchmarkSample[] {
    return this.db
      .query<{
        id: string;
        sample_set: string;
        task_type: string;
        input_json: string;
        expected_json: string;
        created_at: string;
      }>(`SELECT * FROM finance_benchmark_samples WHERE sample_set='${sampleSet}' ORDER BY created_at DESC;`)
      .map((x) => ({
        id: x.id,
        sampleSet: x.sample_set,
        taskType: x.task_type,
        input: JSON.parse(x.input_json),
        expected: JSON.parse(x.expected_json),
        createdAt: x.created_at
      }));
  }

  saveTimelineLink(link: FinanceTimelineLink): FinanceTimelineLink {
    this.db.upsert('finance_timeline_links', link.id, {
      ticker: link.ticker ?? null,
      portfolio_id: link.portfolioId ?? null,
      report_id: link.reportId ?? null,
      prediction_id: link.predictionId ?? null,
      review_id: link.reviewId ?? null,
      error_pattern_id: link.errorPatternId ?? null,
      candidate_id: link.candidateId ?? null,
      experiment_id: link.experimentId ?? null,
      active_stu_effect: link.activeSTUEffect ?? null,
      created_at: link.createdAt
    });
    return link;
  }

  listTimelineByTicker(ticker: string): FinanceTimelineLink[] {
    return this.listTimeline({ ticker });
  }

  listTimelineByPortfolio(portfolioId: string): FinanceTimelineLink[] {
    return this.listTimeline({ portfolioId });
  }


  saveSTUEffectReplay(replay: FinanceSTUEffectReplay): FinanceSTUEffectReplay {
    this.db.upsert('finance_stu_effect_replays', replay.id, {
      payload_json: JSON.stringify(replay.payload),
      created_at: replay.createdAt
    });
    return replay;
  }

  listSTUEffectReplays(): FinanceSTUEffectReplay[] {
    return this.db
      .query<{ id: string; payload_json: string; created_at: string }>('SELECT * FROM finance_stu_effect_replays ORDER BY created_at DESC;')
      .map((x) => ({ id: x.id, payload: JSON.parse(x.payload_json), createdAt: x.created_at }));
  }

  getSTUEffectReplay(id: string): FinanceSTUEffectReplay | undefined {
    return this.db
      .query<{ id: string; payload_json: string; created_at: string }>(`SELECT * FROM finance_stu_effect_replays WHERE id='${id}' LIMIT 1;`)
      .map((x) => ({ id: x.id, payload: JSON.parse(x.payload_json), createdAt: x.created_at }))[0];
  }

  recordMetric(event: FinanceMetricEvent): FinanceMetricEvent {
    this.db.upsert('finance_metrics_events', event.id, {
      metric_key: event.metricKey,
      metric_value: event.metricValue,
      meta_json: JSON.stringify(event.meta),
      created_at: event.createdAt
    });
    return event;
  }

  getMetricsSummary(): Record<string, number> {
    const rows = this.db.query<{ metric_key: string; total: number }>(
      'SELECT metric_key, SUM(metric_value) AS total FROM finance_metrics_events GROUP BY metric_key;'
    );
    return rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.metric_key] = Number(row.total);
      return acc;
    }, {});
  }

  listTimeline(filters?: { ticker?: string; portfolioId?: string; taskType?: string; from?: string; to?: string; limit?: number; offset?: number }): FinanceTimelineLink[] {
    const conds: string[] = [];
    if (filters?.ticker) conds.push(`ticker='${filters.ticker}'`);
    if (filters?.portfolioId) conds.push(`portfolio_id='${filters.portfolioId}'`);
    if (filters?.from) conds.push(`created_at>='${filters.from}'`);
    if (filters?.to) conds.push(`created_at<='${filters.to}'`);
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? 0;
    return this.db
      .query<{
        id: string;
        ticker: string | null;
        portfolio_id: string | null;
        report_id: string | null;
        prediction_id: string | null;
        review_id: string | null;
        error_pattern_id: string | null;
        candidate_id: string | null;
        experiment_id: string | null;
        active_stu_effect: string | null;
        created_at: string;
      }>(`SELECT * FROM finance_timeline_links ${where} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset};`)
      .map((x) => ({
        id: x.id,
        ticker: x.ticker ?? undefined,
        portfolioId: x.portfolio_id ?? undefined,
        reportId: x.report_id ?? undefined,
        predictionId: x.prediction_id ?? undefined,
        reviewId: x.review_id ?? undefined,
        errorPatternId: x.error_pattern_id ?? undefined,
        candidateId: x.candidate_id ?? undefined,
        experimentId: x.experiment_id ?? undefined,
        activeSTUEffect: x.active_stu_effect ?? undefined,
        createdAt: x.created_at
      }));
  }


  saveTask(task: FinanceTaskRecord): FinanceTaskRecord {
    this.db.upsert('finance_tasks', task.id, {
      task_type: task.taskType,
      status: task.status,
      scheduled_at: task.scheduledAt ?? null,
      started_at: task.startedAt ?? null,
      finished_at: task.finishedAt ?? null,
      retry_count: task.retryCount,
      error_summary: task.errorSummary ?? null,
      last_error_at: task.lastErrorAt ?? null,
      next_retry_at: task.nextRetryAt ?? null,
      source: task.source,
      idempotency_key: task.idempotencyKey,
      refs_json: JSON.stringify(task.refs),
      payload_json: JSON.stringify(task.payload),
      created_at: task.createdAt
    });
    return task;
  }

  listTasks(filters?: { status?: string; taskType?: string; limit?: number }): FinanceTaskRecord[] {
    const conds: string[] = [];
    if (filters?.status) conds.push(`status='${filters.status}'`);
    if (filters?.taskType) conds.push(`task_type='${filters.taskType}'`);
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const limit = filters?.limit ?? 100;
    return this.db.query<{ id: string; task_type: string; status: FinanceTaskRecord['status']; scheduled_at: string | null; started_at: string | null; finished_at: string | null; retry_count: number; error_summary: string | null; last_error_at: string | null; next_retry_at: string | null; source: FinanceTaskRecord['source']; idempotency_key: string; refs_json: string; payload_json: string; created_at: string; }>(`SELECT * FROM finance_tasks ${where} ORDER BY created_at DESC LIMIT ${limit};`)
      .map((x) => ({ id: x.id, taskType: x.task_type, status: x.status, scheduledAt: x.scheduled_at ?? undefined, startedAt: x.started_at ?? undefined, finishedAt: x.finished_at ?? undefined, retryCount: x.retry_count, errorSummary: x.error_summary ?? undefined, lastErrorAt: x.last_error_at ?? undefined, nextRetryAt: x.next_retry_at ?? undefined, source: x.source, idempotencyKey: x.idempotency_key, refs: JSON.parse(x.refs_json), payload: JSON.parse(x.payload_json), createdAt: x.created_at }));
  }

  getTask(id: string): FinanceTaskRecord | undefined {
    return this.listTasks().find((x) => x.id === id);
  }

  saveSourceDocument(doc: FinanceSourceDocument): FinanceSourceDocument {
    this.db.upsert('finance_source_documents', doc.id, {
      ticker: doc.ticker ?? null,
      portfolio_id: doc.portfolioId ?? null,
      source_type: doc.sourceType,
      source_timestamp: doc.sourceTimestamp,
      content: doc.content,
      normalized_payload_json: JSON.stringify(doc.normalizedPayload),
      created_at: doc.createdAt
    });
    return doc;
  }

  listSourceDocuments(): FinanceSourceDocument[] {
    return this.db.query<{ id: string; ticker: string | null; portfolio_id: string | null; source_type: string; source_timestamp: string; content: string; normalized_payload_json: string; created_at: string; }>('SELECT * FROM finance_source_documents ORDER BY created_at DESC;')
      .map((x) => ({ id: x.id, ticker: x.ticker ?? undefined, portfolioId: x.portfolio_id ?? undefined, sourceType: x.source_type, sourceTimestamp: x.source_timestamp, content: x.content, normalizedPayload: JSON.parse(x.normalized_payload_json), createdAt: x.created_at }));
  }

  saveIngestedOutcome(outcome: FinanceIngestedOutcome): FinanceIngestedOutcome {
    this.db.upsert('finance_ingested_outcomes', outcome.id, {
      prediction_id: outcome.predictionId ?? null,
      outcome_type: outcome.outcomeType,
      outcome_timestamp: outcome.outcomeTimestamp,
      payload_json: JSON.stringify(outcome.payload),
      created_at: outcome.createdAt
    });
    return outcome;
  }

  listIngestedOutcomes(): FinanceIngestedOutcome[] {
    return this.db.query<{ id: string; prediction_id: string | null; outcome_type: FinanceIngestedOutcome['outcomeType']; outcome_timestamp: string; payload_json: string; created_at: string; }>('SELECT * FROM finance_ingested_outcomes ORDER BY created_at DESC;')
      .map((x) => ({ id: x.id, predictionId: x.prediction_id ?? undefined, outcomeType: x.outcome_type, outcomeTimestamp: x.outcome_timestamp, payload: JSON.parse(x.payload_json), createdAt: x.created_at }));
  }

  listOutcomes(): PredictionOutcome[] {
    return this.db
      .query<{ payload_json: string }>('SELECT payload_json FROM finance_outcome_payloads ORDER BY observed_at DESC;')
      .map((x) => JSON.parse(x.payload_json));
  }

  saveReviewCorrection(correction: FinanceReviewCorrection): FinanceReviewCorrection {
    this.db.upsert('finance_review_corrections', correction.id, {
      review_id: correction.reviewId,
      corrected_payload_json: JSON.stringify(correction.correctedPayload),
      reason: correction.reason ?? null,
      counterevidence: correction.counterevidence ?? null,
      created_at: correction.createdAt
    });
    return correction;
  }

  listReviewCorrections(): FinanceReviewCorrection[] {
    return this.db.query<{ id: string; review_id: string; corrected_payload_json: string; reason: string | null; counterevidence: string | null; created_at: string; }>('SELECT * FROM finance_review_corrections ORDER BY created_at DESC;')
      .map((x) => ({ id: x.id, reviewId: x.review_id, correctedPayload: JSON.parse(x.corrected_payload_json), reason: x.reason ?? undefined, counterevidence: x.counterevidence ?? undefined, createdAt: x.created_at }));
  }

  getRunCenterSummary(): Record<string, unknown> {
    const recent = this.listTasks({ limit: 20 });
    const statusDist = recent.reduce<Record<string, number>>((acc, task) => {
      acc[task.status] = (acc[task.status] ?? 0) + 1;
      return acc;
    }, {});
    const failures = recent.filter((x) => x.status === 'failed').slice(0, 10);
    return {
      recentTasks: recent,
      statusDistribution: statusDist,
      recentFailures: failures,
      nextScheduledAt: recent.filter((x) => x.status === 'pending' && x.scheduledAt).map((x) => x.scheduledAt).sort()[0] ?? null
    };
  }

  saveSetupConfig(record: FinanceSetupConfigRecord): FinanceSetupConfigRecord {
    this.db.upsert('finance_setup_configs', record.id, {
      setup_version: record.setupVersion,
      mode: record.mode,
      non_secret_json: JSON.stringify(record.nonSecret),
      secret_json: JSON.stringify(record.secret),
      setup_completed: record.setupCompleted ? 1 : 0,
      updated_at: record.updatedAt
    });
    return record;
  }

  getLatestSetupConfig(): FinanceSetupConfigRecord | undefined {
    return this.db
      .query<{
        id: string;
        setup_version: string;
        mode: FinanceSetupConfigRecord['mode'];
        non_secret_json: string;
        secret_json: string;
        setup_completed: number;
        updated_at: string;
      }>('SELECT * FROM finance_setup_configs ORDER BY updated_at DESC LIMIT 1;')
      .map((x) => ({
        id: x.id,
        setupVersion: x.setup_version,
        mode: x.mode,
        nonSecret: JSON.parse(x.non_secret_json),
        secret: JSON.parse(x.secret_json),
        setupCompleted: x.setup_completed === 1,
        updatedAt: x.updated_at
      }))[0];
  }

  saveSetupHealthcheck(record: FinanceSetupHealthcheckRecord): FinanceSetupHealthcheckRecord {
    this.db.upsert('finance_setup_healthchecks', record.id, {
      status: record.status,
      result_json: JSON.stringify(record.result),
      created_at: record.createdAt
    });
    return record;
  }

  listSetupHealthchecks(limit = 20): FinanceSetupHealthcheckRecord[] {
    return this.db
      .query<{ id: string; status: FinanceSetupHealthcheckRecord['status']; result_json: string; created_at: string }>(
        `SELECT * FROM finance_setup_healthchecks ORDER BY created_at DESC LIMIT ${limit};`
      )
      .map((x) => ({
        id: x.id,
        status: x.status,
        result: JSON.parse(x.result_json),
        createdAt: x.created_at
      }));
  }

  saveRuntimeSettings(record: FinanceRuntimeSettingsRecord): FinanceRuntimeSettingsRecord {
    if (record.active) {
      this.listRuntimeSettings().forEach((existing) => {
        if (existing.active && existing.id !== record.id) {
          this.db.upsert('finance_runtime_settings', existing.id, {
            mode: existing.mode,
            runtime_config_json: JSON.stringify(existing.runtimeConfig),
            app_preferences_json: JSON.stringify(existing.appPreferences),
            secret_refs_json: JSON.stringify(existing.secretRefs),
            updated_by: existing.updatedBy,
            updated_at: existing.updatedAt,
            active: 0
          });
        }
      });
    }
    this.db.upsert('finance_runtime_settings', record.id, {
      mode: record.mode,
      runtime_config_json: JSON.stringify(record.runtimeConfig),
      app_preferences_json: JSON.stringify(record.appPreferences),
      secret_refs_json: JSON.stringify(record.secretRefs),
      updated_by: record.updatedBy,
      updated_at: record.updatedAt,
      active: record.active ? 1 : 0
    });
    return record;
  }

  listRuntimeSettings(): FinanceRuntimeSettingsRecord[] {
    return this.db
      .query<{ id: string; mode: FinanceRuntimeSettingsRecord['mode']; runtime_config_json: string; app_preferences_json: string; secret_refs_json: string; updated_by: string; updated_at: string; active: number }>('SELECT * FROM finance_runtime_settings ORDER BY updated_at DESC;')
      .map((x) => ({
        id: x.id,
        mode: x.mode,
        runtimeConfig: JSON.parse(x.runtime_config_json),
        appPreferences: JSON.parse(x.app_preferences_json),
        secretRefs: JSON.parse(x.secret_refs_json),
        updatedBy: x.updated_by,
        updatedAt: x.updated_at,
        active: x.active === 1
      }));
  }

  getActiveRuntimeSettings(): FinanceRuntimeSettingsRecord | undefined {
    return this.listRuntimeSettings().find((x) => x.active) ?? this.listRuntimeSettings()[0];
  }

  saveRuntimeSettingsHistory(record: FinanceRuntimeSettingsHistoryRecord): FinanceRuntimeSettingsHistoryRecord {
    this.db.upsert('finance_runtime_settings_history', record.id, {
      settings_id: record.settingsId,
      changed_by: record.changedBy,
      changed_at: record.changedAt,
      changed_fields_json: JSON.stringify(record.changedFields),
      previous_summary_json: JSON.stringify(record.previousSummary),
      new_summary_json: JSON.stringify(record.newSummary)
    });
    return record;
  }

  listRuntimeSettingsHistory(limit = 20): FinanceRuntimeSettingsHistoryRecord[] {
    return this.db
      .query<{ id: string; settings_id: string; changed_by: string; changed_at: string; changed_fields_json: string; previous_summary_json: string; new_summary_json: string }>(`SELECT * FROM finance_runtime_settings_history ORDER BY changed_at DESC LIMIT ${limit};`)
      .map((x) => ({
        id: x.id,
        settingsId: x.settings_id,
        changedBy: x.changed_by,
        changedAt: x.changed_at,
        changedFields: JSON.parse(x.changed_fields_json),
        previousSummary: JSON.parse(x.previous_summary_json),
        newSummary: JSON.parse(x.new_summary_json)
      }));
  }

  saveQueueRecord(record: FinanceQueueRecord): FinanceQueueRecord {
    this.db.upsert('finance_task_queue', record.id, {
      task_id: record.taskId,
      task_type: record.taskType,
      payload_json: JSON.stringify(record.payload),
      source: record.source,
      status: record.status,
      claim_token: record.claimToken ?? null,
      lease_until: record.leaseUntil ?? null,
      attempt_count: record.attemptCount,
      enqueued_at: record.enqueuedAt
    });
    return record;
  }

  listQueueRecords(status?: FinanceQueueRecord['status']): FinanceQueueRecord[] {
    const where = status ? `WHERE status='${status}'` : '';
    return this.db
      .query<{
        id: string;
        task_id: string;
        task_type: string;
        payload_json: string;
        source: FinanceQueueRecord['source'];
        status: FinanceQueueRecord['status'];
        claim_token: string | null;
        lease_until: string | null;
        attempt_count: number;
        enqueued_at: string;
      }>(`SELECT * FROM finance_task_queue ${where} ORDER BY enqueued_at ASC;`)
      .map((x) => ({
        id: x.id,
        taskId: x.task_id,
        taskType: x.task_type,
        payload: JSON.parse(x.payload_json),
        source: x.source,
        status: x.status,
        claimToken: x.claim_token ?? undefined,
        leaseUntil: x.lease_until ?? undefined,
        attemptCount: x.attempt_count,
        enqueuedAt: x.enqueued_at
      }));
  }

  saveScheduleRecord(record: FinanceScheduleRecord): FinanceScheduleRecord {
    this.db.upsert('finance_task_schedule', record.id, {
      task_type: record.taskType,
      run_at: record.runAt,
      payload_json: JSON.stringify(record.payload),
      source: record.source,
      status: record.status,
      created_at: record.createdAt
    });
    return record;
  }

  listScheduleRecords(status?: FinanceScheduleRecord['status']): FinanceScheduleRecord[] {
    const where = status ? `WHERE status='${status}'` : '';
    return this.db
      .query<{ id: string; task_type: string; run_at: string; payload_json: string; source: 'schedule'; status: FinanceScheduleRecord['status']; created_at: string }>(`SELECT * FROM finance_task_schedule ${where} ORDER BY run_at ASC;`)
      .map((x) => ({
        id: x.id,
        taskType: x.task_type,
        runAt: x.run_at,
        payload: JSON.parse(x.payload_json),
        source: x.source,
        status: x.status,
        createdAt: x.created_at
      }));
  }

  savePredictionReviewRun(record: FinancePredictionReviewRun): FinancePredictionReviewRun {
    this.db.upsert('finance_prediction_review_runs', record.id, {
      prediction_id: record.predictionId,
      trigger_type: record.triggerType,
      outcome_id: record.outcomeId ?? null,
      run_key: record.runKey,
      created_at: record.createdAt
    });
    return record;
  }

  listPredictionReviewRuns(): FinancePredictionReviewRun[] {
    return this.db
      .query<{ id: string; prediction_id: string; trigger_type: string; outcome_id: string | null; run_key: string; created_at: string }>('SELECT * FROM finance_prediction_review_runs ORDER BY created_at DESC;')
      .map((x) => ({
        id: x.id,
        predictionId: x.prediction_id,
        triggerType: x.trigger_type,
        outcomeId: x.outcome_id ?? undefined,
        runKey: x.run_key,
        createdAt: x.created_at
      }));
  }
}
