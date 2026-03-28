import { FinanceRepository } from '../../domain/repository.js';

export class FinanceQueryService {
  constructor(private readonly repo = new FinanceRepository()) {}

  dashboard(): Record<string, unknown> {
    return {
      portfolios: this.repo.listPortfolios(),
      latestReports: this.repo.listArtifacts().slice(0, 5),
      bias: this.repo.listBiasSnapshots().slice(0, 3),
      tasks: this.repo.getMetricsSummary().task_count ?? 0
    };
  }

  portfolio(id?: string): Record<string, unknown> {
    const portfolios = this.repo.listPortfolios();
    const selected = id ? portfolios.find((p) => p.id === id) : portfolios[0];
    return {
      list: portfolios,
      detail: selected,
      holdings: selected ? this.repo.listHoldings(selected.id) : []
    };
  }

  strategyLabComparison(): Record<string, unknown> {
    const replays = this.repo.listSTUEffectReplays();
    return {
      baselineVsCandidate: replays.slice(0, 10),
      thesisTypeAggregation: this.aggregateBy(replays, 'thesisType'),
      missedSamples: replays.filter((x) => Number((x.payload.effectSummary as Record<string, unknown>)?.predictionDelta ?? 0) <= 0)
    };
  }

  experimentSuggestions(): Record<string, unknown> {
    const timeline = this.repo.listTimeline({ limit: 100 });
    return {
      activeExperiments: timeline.filter((x) => x.experimentId),
      trafficRatio: { baseline: 0.5, candidate: 0.5 },
      recommendation: 'hold',
      reasoning: 'Need more support count before promote'
    };
  }

  timeline(params: {
    ticker?: string;
    portfolioId?: string;
    taskType?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
    detailId?: string;
  }): Record<string, unknown> {
    const links = this.repo.listTimeline(params);
    return {
      links,
      detail: params.detailId ? links.find((x) => x.id === params.detailId) : undefined,
      replayEntries: this.repo.listSTUEffectReplays().slice(0, 20)
    };
  }

  private aggregateBy(items: Array<{ payload: Record<string, unknown> }>, key: string): Record<string, number> {
    return items.reduce<Record<string, number>>((acc, item) => {
      const label = String(item.payload[key] ?? 'unknown');
      acc[label] = (acc[label] ?? 0) + 1;
      return acc;
    }, {});
  }
}
