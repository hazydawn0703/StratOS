import { FinanceArtifactService } from '../artifacts/FinanceArtifactService.js';
import { FinanceBenchmarkService } from '../benchmark/FinanceBenchmarkService.js';
import { FinanceAppOrchestratorService } from '../services/FinanceAppOrchestratorService.js';
import { FinancePredictionService } from '../predictions/FinancePredictionService.js';
import { FinanceQueryService } from '../query/FinanceQueryService.js';
import { FinanceRepository } from '../../domain/repository.js';
import { FinanceReviewService } from '../reviews/FinanceReviewService.js';
import { ActiveSTUEffectProofService } from '../services/ActiveSTUEffectProofService.js';
import { FinanceTaskAutomationService } from '../services/FinanceTaskAutomationService.js';
import { FinanceIngestService } from '../services/FinanceIngestService.js';
import { getProviderCallStats } from '../providers/providerStats.js';
import { createFinanceProviderRegistry } from '../providers/registry.js';
import { FinanceSetupService } from '../services/FinanceSetupService.js';

export interface RouteRequest {
  method: 'GET' | 'POST';
  path: string;
  query?: Record<string, string>;
  body?: Record<string, unknown>;
}

export interface RouteResponse {
  status: number;
  body: unknown;
}

export class FinanceRouteHandlers {
  private readonly repo = new FinanceRepository();
  private readonly query = new FinanceQueryService(this.repo);
  private readonly artifacts = new FinanceArtifactService(this.repo);
  private readonly predictions = new FinancePredictionService(this.repo);
  private readonly reviews = new FinanceReviewService(this.repo);
  private readonly benchmark = new FinanceBenchmarkService(this.repo);
  private readonly orchestrator = new FinanceAppOrchestratorService(this.repo);
  private readonly stuEffectProof = new ActiveSTUEffectProofService(this.repo);
  private readonly taskAutomation = new FinanceTaskAutomationService(this.repo);
  private readonly ingest = new FinanceIngestService(this.repo);
  private readonly setup = new FinanceSetupService(this.repo, this.benchmark, this.taskAutomation);

  async handle(req: RouteRequest): Promise<RouteResponse> {
    const start = Date.now();

    const aliasMap: Record<string, string> = {
      '/api/finance/portfolio': '/api/finance/portfolios',
      '/api/finance/predictions/extract': '/api/finance/predictions',
      '/api/finance/errors': '/api/finance/errors/list',
      '/api/finance/candidates': '/api/finance/candidates/list'
    };
    const path = aliasMap[req.path] ?? req.path;


    this.repo.recordMetric({ id: `m-${Date.now().toString(36)}-${Math.random()}`, metricKey: 'task_count', metricValue: 1, meta: { path: req.path }, createdAt: new Date().toISOString() });

    if (req.method === 'GET' && path === '/api/finance/dashboard') return this.done(start, 200, this.query.dashboard());

    if (req.method === 'GET' && path === '/api/finance/portfolios') {
      return this.done(start, 200, this.query.portfolio(req.query?.portfolioId));
    }
    if (req.method === 'POST' && path === '/api/finance/portfolios') {
      const payload = req.body as Record<string, unknown>;
      const portfolio = this.repo.upsertPortfolio({ id: String(payload.id), name: String(payload.name), baseCurrency: String(payload.baseCurrency ?? 'USD'), createdAt: new Date().toISOString() });
      return this.done(start, 200, { portfolio });
    }

    if (req.method === 'GET' && path === '/api/finance/holdings') {
      const portfolioId = req.query?.portfolioId;
      return this.done(start, 200, { holdings: portfolioId ? this.repo.listHoldings(portfolioId) : [] });
    }
    if (req.method === 'POST' && path === '/api/finance/holdings') {
      const p = req.body as Record<string, unknown>;
      const holding = this.repo.upsertHolding({ id: String(p.id), portfolioId: String(p.portfolioId), ticker: String(p.ticker), quantity: Number(p.quantity ?? 0), averageCost: Number(p.averageCost ?? 0), updatedAt: new Date().toISOString() });
      return this.done(start, 200, { holding });
    }

    if (req.method === 'GET' && path === '/api/finance/watchlist') return this.done(start, 200, { items: this.repo.listWatchlist() });
    if (req.method === 'POST' && path === '/api/finance/watchlist') {
      const p = req.body as Record<string, unknown>;
      const item = this.repo.upsertWatchlistItem({ id: String(p.id), ticker: String(p.ticker), thesis: String(p.thesis), priority: (p.priority as 'low'|'medium'|'high') ?? 'medium', addedAt: new Date().toISOString() });
      return this.done(start, 200, { item });
    }

    if (req.method === 'GET' && path === '/api/finance/reports') return this.done(start, 200, { reports: this.artifacts.list() });
    if (req.method === 'POST' && path === '/api/finance/reports') {
      const p = req.body as Record<string, unknown>;
      const reportTicker = p.ticker ? String(p.ticker) : undefined;
      const report = this.artifacts.generate({ taskType: 'daily_brief_generation', artifactType: p.artifactType as 'daily_brief' | 'weekly_review' | 'stock_deep_dive' | 'risk_alert', title: String(p.title), body: String(p.body), ticker: reportTicker, evidence: ['api_input'] });
      this.repo.recordMetric({ id: `m-${Date.now().toString(36)}-${Math.random()}`, metricKey: 'artifact_count', metricValue: 1, meta: { reportId: report.id }, createdAt: new Date().toISOString() });
      return this.done(start, 200, { report });
    }

    if (req.method === 'GET' && path === '/api/finance/predictions') return this.done(start, 200, { predictions: this.predictions.listPredictions() });
    if (req.method === 'POST' && path === '/api/finance/predictions') {
      const p = req.body as Record<string, unknown>;
      const artifact = this.repo.listArtifacts().find((x) => x.id === String(p.artifactId));
      if (!artifact) return this.done(start, 404, { error: 'artifact_not_found' });
      const extracted = this.predictions.extractFromArtifact(artifact);
      this.repo.recordMetric({ id: `m-${Date.now().toString(36)}-${Math.random()}`, metricKey: 'claim_extraction_count', metricValue: extracted.admitted.length, meta: { artifactId: artifact.id }, createdAt: new Date().toISOString() });
      return this.done(start, 200, extracted);
    }

    if (req.method === 'GET' && path === '/api/finance/reviews') return this.done(start, 200, { reviews: this.reviews.listReviews() });

    if (req.method === 'GET' && path.startsWith('/api/finance/errors')) return this.done(start, 200, { patterns: this.repo.listPatterns() });
    if (req.method === 'GET' && path.startsWith('/api/finance/candidates')) return this.done(start, 200, { candidates: this.repo.listSTUProposals() });

    if (req.method === 'GET' && path.startsWith('/api/finance/bias')) return this.done(start, 200, { snapshots: this.repo.listBiasSnapshots(req.query?.scopeKey) });

    if (req.method === 'GET' && path === '/api/finance/timeline') {
      return this.done(start, 200, this.query.timeline({
        ticker: req.query?.ticker,
        portfolioId: req.query?.portfolioId,
        taskType: req.query?.taskType,
        from: req.query?.from,
        to: req.query?.to,
        limit: Number(req.query?.limit ?? '20'),
        offset: Number(req.query?.offset ?? '0'),
        detailId: req.query?.id
      }));
    }


    if (req.method === 'GET' && path === '/api/finance/strategy-lab') {
      return this.done(start, 200, {
        ...this.query.strategyLabComparison(),
        benchmark: this.repo.listBenchmarkSamples(req.query?.sampleSet ?? 'default')
      });
    }

    if (req.method === 'GET' && path === '/api/finance/experiments') {
      return this.done(start, 200, this.query.experimentSuggestions());
    }

    if (req.method === 'GET' && path === '/api/finance/metrics') return this.done(start, 200, { metrics: this.repo.getMetricsSummary(), providerStats: getProviderCallStats(), runCenter: this.taskAutomation.runCenterSummary() });

    if (req.method === 'POST' && path === '/api/finance/benchmark/seed') return this.done(start, 200, { samples: this.benchmark.seedDefaultSamples() });

    if (req.method === 'POST' && path === '/api/finance/mock/run') {
      const p = req.body as Record<string, unknown>;
      const providers = createFinanceProviderRegistry();
      const ticker = p.ticker ? String(p.ticker) : 'NVDA';
      await providers.market.getQuote(ticker);
      await providers.news.listHeadlines(ticker);
      await providers.events.listEvents(ticker);
      const result = await this.orchestrator.runMockTask({ artifactType: (p.artifactType as 'daily_brief'|'weekly_review'|'stock_deep_dive'|'risk_alert') ?? 'daily_brief', title: String(p.title ?? 'Mock report'), body: String(p.body ?? 'Revenue may grow.'), ticker: p.ticker ? String(p.ticker) : ticker, riskLevel: (p.riskLevel as 'low'|'medium'|'high') ?? 'medium', activeSTUContext: Array.isArray(p.activeSTUContext) ? p.activeSTUContext.map((x) => String(x)) : [] });
      return this.done(start, 200, result);
    }

    if (req.method === 'POST' && path === '/api/finance/replay/stu-effect/run') {
      const p = req.body as Record<string, unknown>;
      const result = await this.stuEffectProof.runReplay({
        ticker: String(p.ticker ?? 'NVDA'),
        thesisType: String(p.thesisType ?? 'growth'),
        inputBody: String(p.inputBody ?? 'Revenue will accelerate next quarter.')
      });
      return this.done(start, 200, result);
    }
    if (req.method === 'GET' && path === '/api/finance/replay/stu-effect') {
      return this.done(start, 200, { replays: this.repo.listSTUEffectReplays() });
    }


    if (req.method === 'POST' && path === '/api/finance/tasks/enqueue') {
      const p = req.body as Record<string, unknown>;
      const task = await this.taskAutomation.enqueue(String(p.taskType) as never, (p.payload as Record<string, unknown>) ?? {}, 'manual');
      return this.done(start, 200, { task });
    }

    if (req.method === 'GET' && path === '/api/finance/tasks') {
      return this.done(start, 200, {
        tasks: this.taskAutomation.list({ status: req.query?.status, taskType: req.query?.taskType, limit: Number(req.query?.limit ?? '100') })
      });
    }

    if (req.method === 'GET' && path.startsWith('/api/finance/tasks/') && !path.endsWith('/retry') && !path.endsWith('/cancel')) {
      const id = path.split('/').pop() as string;
      return this.done(start, 200, { task: this.taskAutomation.list({ limit: 500 }).find((t) => t.id === id) });
    }

    if (req.method === 'POST' && path.endsWith('/retry') && path.startsWith('/api/finance/tasks/')) {
      const id = path.split('/')[4] as string;
      return this.done(start, 200, { task: await this.taskAutomation.retry(id) });
    }

    if (req.method === 'POST' && path.endsWith('/cancel') && path.startsWith('/api/finance/tasks/')) {
      const id = path.split('/')[4] as string;
      return this.done(start, 200, { task: this.taskAutomation.cancel(id) });
    }

    if (req.method === 'POST' && path === '/api/finance/tasks/run-now') {
      return this.done(start, 200, { task: await this.taskAutomation.runNext() });
    }

    if (req.method === 'POST' && path === '/api/finance/tasks/schedule') {
      const p = req.body as Record<string, unknown>;
      await this.taskAutomation.schedule(String(p.taskType) as never, String(p.runAt), (p.payload as Record<string, unknown>) ?? {});
      return this.done(start, 200, { ok: true });
    }

    if (req.method === 'POST' && path === '/api/finance/tasks/poll-scheduled') {
      const queued = await this.taskAutomation.pollScheduled();
      return this.done(start, 200, { queued });
    }

    if (req.method === 'POST' && path === '/api/finance/ingest/source-documents') {
      const p = req.body as Record<string, unknown>;
      const doc = this.ingest.ingestSourceDocument({
        ticker: p.ticker ? String(p.ticker) : undefined,
        portfolioId: p.portfolioId ? String(p.portfolioId) : undefined,
        sourceType: String(p.sourceType),
        sourceTimestamp: String(p.sourceTimestamp ?? new Date().toISOString()),
        content: String(p.content ?? ''),
        normalizedPayload: (p.normalizedPayload as Record<string, unknown>) ?? {}
      });
      return this.done(start, 200, { document: doc });
    }

    if (req.method === 'POST' && path === '/api/finance/ingest/outcomes') {
      const p = req.body as Record<string, unknown>;
      const outcome = this.ingest.ingestOutcome({
        predictionId: p.predictionId ? String(p.predictionId) : undefined,
        outcomeType: String(p.outcomeType) as never,
        outcomeTimestamp: String(p.outcomeTimestamp ?? new Date().toISOString()),
        payload: (p.payload as Record<string, unknown>) ?? {}
      });
      // auto enqueue prediction review after outcome ingest
      await this.taskAutomation.enqueue('prediction_review' as never, { predictionId: outcome.predictionId }, 'manual');
      return this.done(start, 200, { outcome });
    }

    if (req.method === 'POST' && path.startsWith('/api/finance/reviews/') && path.endsWith('/correct')) {
      const id = path.split('/')[4] as string;
      const p = req.body as Record<string, unknown>;
      const correction = this.ingest.correctReview({
        reviewId: id,
        correctedPayload: (p.correctedPayload as Record<string, unknown>) ?? {},
        reason: p.reason ? String(p.reason) : undefined,
        counterevidence: p.counterevidence ? String(p.counterevidence) : undefined
      });
      return this.done(start, 200, { correction });
    }

    if (req.method === 'GET' && path === '/api/finance/run-center/summary') {
      return this.done(start, 200, this.taskAutomation.runCenterSummary());
    }

    if (req.method === 'GET' && path === '/api/finance/setup/status') {
      return this.done(start, 200, this.setup.status());
    }
    if (req.method === 'POST' && path === '/api/finance/setup/validate') {
      return this.done(start, 200, this.setup.validate((req.body ?? {}) as Record<string, unknown>));
    }
    if (req.method === 'POST' && path === '/api/finance/setup/save-config') {
      return this.done(start, 200, this.setup.saveConfig((req.body ?? {}) as never));
    }
    if (req.method === 'POST' && path === '/api/finance/setup/bootstrap') {
      return this.done(start, 200, this.setup.bootstrap());
    }
    if (req.method === 'POST' && path === '/api/finance/setup/healthcheck') {
      return this.done(start, 200, await this.setup.healthcheck());
    }
    if (req.method === 'POST' && path === '/api/finance/setup/demo-run') {
      return this.done(start, 200, await this.setup.demoRun());
    }

    return this.done(start, 404, { error: 'route_not_found' });
  }

  private done(start: number, status: number, body: unknown): RouteResponse {
    this.repo.recordMetric({
      id: `m-${Date.now().toString(36)}-${Math.random()}`,
      metricKey: 'local_latency_ms',
      metricValue: Date.now() - start,
      meta: {},
      createdAt: new Date().toISOString()
    });
    return { status, body };
  }
}
