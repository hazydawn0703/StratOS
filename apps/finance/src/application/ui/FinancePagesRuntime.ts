import { FinanceQueryService } from '../query/FinanceQueryService.js';
import { FinanceRepository } from '../../domain/repository.js';

export class FinancePagesRuntime {
  private readonly query = new FinanceQueryService(new FinanceRepository());

  render(page:
    | 'Dashboard'
    | 'Portfolio'
    | 'Watchlist'
    | 'Reports'
    | 'Predictions'
    | 'Reviews'
    | 'Error Intelligence'
    | 'Strategy Lab'
    | 'Experiment Center'
    | 'Thesis Timeline',
  params: Record<string, string> = {}): string {
    if (page === 'Dashboard') return this.html(page, this.query.dashboard());
    if (page === 'Portfolio') return this.html(page, this.query.portfolio(params.portfolioId));
    if (page === 'Watchlist') return this.html(page, { items: new FinanceRepository().listWatchlist() });
    if (page === 'Reports') return this.html(page, { reports: new FinanceRepository().listArtifacts() });
    if (page === 'Predictions') return this.html(page, { predictions: new FinanceRepository().listPredictions() });
    if (page === 'Reviews') return this.html(page, { reviews: new FinanceRepository().listReviews() });
    if (page === 'Error Intelligence') {
      return this.html(page, { patterns: new FinanceRepository().listPatterns(), candidates: new FinanceRepository().listSTUProposals() });
    }
    if (page === 'Strategy Lab') {
      return this.html(page, { benchmark: new FinanceRepository().listBenchmarkSamples('default'), bias: new FinanceRepository().listBiasSnapshots() });
    }
    if (page === 'Experiment Center') return this.html(page, this.query.timeline({ ticker: params.ticker }));
    return this.html(page, this.query.timeline({ ticker: params.ticker, portfolioId: params.portfolioId }));
  }

  private html(title: string, payload: unknown): string {
    return `<!doctype html><html><body><h1>${title}</h1><pre>${JSON.stringify(payload, null, 2)}</pre></body></html>`;
  }
}
