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

}
