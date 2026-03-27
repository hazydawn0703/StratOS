import { FinanceArtifactService } from '../artifacts/FinanceArtifactService.js';
import { FinanceBenchmarkService } from '../benchmark/FinanceBenchmarkService.js';
import { FinanceErrorIntelligenceService } from '../error-intelligence/FinanceErrorIntelligenceService.js';
import { FinanceAppOrchestratorService } from '../services/FinanceAppOrchestratorService.js';
import { FinancePredictionService } from '../predictions/FinancePredictionService.js';
import { FinanceQueryService } from '../query/FinanceQueryService.js';
import { FinanceRepository } from '../../domain/repository.js';
import { FinanceReviewService } from '../reviews/FinanceReviewService.js';

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
  private readonly errors = new FinanceErrorIntelligenceService(this.repo);
  private readonly benchmark = new FinanceBenchmarkService(this.repo);
  private readonly orchestrator = new FinanceAppOrchestratorService();

  async handle(req: RouteRequest): Promise<RouteResponse> {
    if (req.method === 'GET' && req.path === '/api/finance/dashboard') {
      return { status: 200, body: this.query.dashboard() };
    }
    if (req.method === 'GET' && req.path === '/api/finance/portfolio') {
      return { status: 200, body: this.query.portfolio(req.query?.portfolioId) };
    }
    if (req.method === 'POST' && req.path === '/api/finance/portfolio') {
      const payload = req.body as Record<string, unknown>;
      const portfolio = this.repo.upsertPortfolio({
        id: String(payload.id),
        name: String(payload.name),
        baseCurrency: String(payload.baseCurrency ?? 'USD'),
        createdAt: new Date().toISOString()
      });
      return { status: 200, body: { portfolio } };
    }
    if (req.method === 'GET' && req.path === '/api/finance/watchlist') {
      return { status: 200, body: { items: this.repo.listWatchlist() } };
    }
    if (req.method === 'POST' && req.path === '/api/finance/watchlist') {
      const payload = req.body as Record<string, unknown>;
      const item = this.repo.upsertWatchlistItem({
        id: String(payload.id),
        ticker: String(payload.ticker),
        thesis: String(payload.thesis),
        priority: (payload.priority as 'low' | 'medium' | 'high') ?? 'medium',
        addedAt: new Date().toISOString()
      });
      return { status: 200, body: { item } };
    }
    if (req.method === 'GET' && req.path === '/api/finance/reports') {
      return { status: 200, body: { reports: this.artifacts.list() } };
    }
    if (req.method === 'POST' && req.path === '/api/finance/reports') {
      const payload = req.body as Record<string, unknown>;
      const report = this.artifacts.generate({
        taskType: 'daily_brief_generation',
        artifactType: payload.artifactType as 'daily_brief' | 'weekly_review' | 'stock_deep_dive' | 'risk_alert',
        title: String(payload.title),
        body: String(payload.body),
        ticker: payload.ticker ? String(payload.ticker) : undefined,
        evidence: ['api_input']
      });
      return { status: 200, body: { report } };
    }
    if (req.method === 'GET' && req.path === '/api/finance/predictions') {
      return { status: 200, body: { predictions: this.predictions.listPredictions() } };
    }
    if (req.method === 'POST' && req.path === '/api/finance/predictions/extract') {
      const payload = req.body as Record<string, unknown>;
      const artifact = this.repo.listArtifacts().find((x) => x.id === String(payload.artifactId));
      if (!artifact) return { status: 404, body: { error: 'artifact_not_found' } };
      return { status: 200, body: this.predictions.extractFromArtifact(artifact) };
    }
    if (req.method === 'GET' && req.path === '/api/finance/reviews') {
      return { status: 200, body: { reviews: this.reviews.listReviews() } };
    }
    if (req.method === 'GET' && req.path === '/api/finance/errors') {
      return { status: 200, body: { patterns: this.repo.listPatterns(), candidates: this.repo.listSTUProposals() } };
    }

    if (req.method === 'GET' && req.path === '/api/finance/candidates') {
      return { status: 200, body: { candidates: this.repo.listSTUProposals() } };
    }

    if (req.method === 'GET' && req.path === '/api/finance/experiments') {
      return { status: 200, body: { timeline: this.query.timeline({ ticker: req.query?.ticker }) } };
    }
    if (req.method === 'GET' && req.path === '/api/finance/bias') {
      return { status: 200, body: { snapshots: this.repo.listBiasSnapshots(req.query?.scopeKey) } };
    }
    if (req.method === 'GET' && req.path === '/api/finance/timeline') {
      return { status: 200, body: this.query.timeline({ ticker: req.query?.ticker, portfolioId: req.query?.portfolioId }) };
    }
    if (req.method === 'POST' && req.path === '/api/finance/benchmark/seed') {
      return { status: 200, body: { samples: this.benchmark.seedDefaultSamples() } };
    }
    if (req.method === 'POST' && req.path === '/api/finance/mock/run') {
      const payload = req.body as Record<string, unknown>;
      const result = await this.orchestrator.runMockTask({
        artifactType: (payload.artifactType as 'daily_brief' | 'weekly_review' | 'stock_deep_dive' | 'risk_alert') ?? 'daily_brief',
        title: String(payload.title ?? 'Mock report'),
        body: String(payload.body ?? 'Revenue may grow.'),
        ticker: payload.ticker ? String(payload.ticker) : undefined,
        riskLevel: (payload.riskLevel as 'low' | 'medium' | 'high') ?? 'medium',
        activeSTUContext: Array.isArray(payload.activeSTUContext)
          ? payload.activeSTUContext.map((x) => String(x))
          : ['guard downside with valuation discipline']
      });
      return { status: 200, body: result };
    }

    return { status: 404, body: { error: 'route_not_found' } };
  }
}
