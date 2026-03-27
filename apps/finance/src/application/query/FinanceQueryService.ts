import { FinanceRepository } from '../../domain/repository.js';

export class FinanceQueryService {
  constructor(private readonly repo = new FinanceRepository()) {}

  dashboard(): Record<string, unknown> {
    return {
      portfolios: this.repo.listPortfolios(),
      latestReports: this.repo.listArtifacts().slice(0, 5),
      bias: this.repo.listBiasSnapshots().slice(0, 3)
    };
  }

  portfolio(id?: string): Record<string, unknown> {
    const portfolios = this.repo.listPortfolios();
    const selected = id ? portfolios.find((p) => p.id === id) : portfolios[0];
    return {
      portfolio: selected,
      holdings: selected ? this.repo.listHoldings(selected.id) : []
    };
  }

  timeline(params: { ticker?: string; portfolioId?: string }): Record<string, unknown> {
    const links = params.ticker
      ? this.repo.listTimelineByTicker(params.ticker)
      : params.portfolioId
        ? this.repo.listTimelineByPortfolio(params.portfolioId)
        : [];
    return { links };
  }
}
