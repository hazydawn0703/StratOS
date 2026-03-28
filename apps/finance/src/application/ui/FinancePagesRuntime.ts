import { FinanceQueryService } from '../query/FinanceQueryService.js';
import { FinanceRepository } from '../../domain/repository.js';

export class FinancePagesRuntime {
  private readonly repo = new FinanceRepository();
  private readonly query = new FinanceQueryService(this.repo);

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
    const payload = this.payloadFor(page, params);
    return `<!doctype html><html><body><h1>${page}</h1><p>filter=${JSON.stringify(params)}</p><pre>${JSON.stringify(payload, null, 2)}</pre></body></html>`;
  }

  private payloadFor(page: string, params: Record<string, string>): unknown {
    if (page === 'Dashboard') {
      return {
        ...this.query.dashboard(),
        metrics: this.repo.getMetricsSummary()
      };
    }
    if (page === 'Portfolio') return this.query.portfolio(params.portfolioId);
    if (page === 'Watchlist') return { list: this.repo.listWatchlist(), detail: params.id };
    if (page === 'Reports') {
      const list = this.repo.listArtifacts().filter((x) => (params.ticker ? x.ticker === params.ticker : true));
      return { list, detail: params.id ? list.find((x) => x.id === params.id) : undefined, status: `count:${list.length}` };
    }
    if (page === 'Predictions') {
      const list = this.repo.listPredictions().filter((x) => (params.ticker ? x.ticker === params.ticker : true));
      return { list, detail: params.id ? list.find((x) => x.id === params.id) : undefined };
    }
    if (page === 'Reviews') {
      const list = this.repo.listReviews();
      return { list, detail: params.id ? list.find((x) => x.id === params.id) : undefined };
    }
    if (page === 'Error Intelligence') {
      return { patterns: this.repo.listPatterns(), candidates: this.repo.listSTUProposals(), detail: params.id };
    }
    if (page === 'Strategy Lab') {
      return {
        sampleSet: params.sampleSet ?? 'default',
        benchmark: this.repo.listBenchmarkSamples(params.sampleSet ?? 'default'),
        biasOverlay: this.repo.listBiasSnapshots(),
        replays: this.repo.listSTUEffectReplays()
      };
    }
    if (page === 'Experiment Center') {
      return {
        timeline: this.query.timeline({ ticker: params.ticker, portfolioId: params.portfolioId, from: params.from, to: params.to }),
        suggestions: this.query.experimentSuggestions(),
        biasRiskNote: this.repo.listBiasSnapshots().slice(0, 3)
      };
    }

    return this.query.timeline({
      ticker: params.ticker,
      portfolioId: params.portfolioId,
      taskType: params.taskType,
      from: params.from,
      to: params.to,
      limit: Number(params.limit ?? '20'),
      offset: Number(params.offset ?? '0'),
      detailId: params.id
    });
  }
}
