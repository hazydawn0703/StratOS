import { FinanceRepository, type FinanceBenchmarkSample } from '../../domain/repository.js';

export class FinanceBenchmarkService {
  constructor(private readonly repo = new FinanceRepository()) {}

  seedDefaultSamples(): FinanceBenchmarkSample[] {
    const now = new Date().toISOString();
    const samples: FinanceBenchmarkSample[] = [
      {
        id: 'bm-fin-001',
        sampleSet: 'default',
        taskType: 'stock_deep_dive',
        input: { ticker: 'NVDA', thesis: 'AI demand sustains growth' },
        expected: { shouldAdmit: true, expectedDirection: 'bullish' },
        createdAt: now
      },
      {
        id: 'bm-fin-002',
        sampleSet: 'default',
        taskType: 'risk_alert_generation',
        input: { ticker: 'TSLA', thesis: 'margin compression risk increases' },
        expected: { shouldAdmit: true, expectedDirection: 'bearish' },
        createdAt: now
      }
    ];

    return samples.map((sample) => this.repo.saveBenchmarkSample(sample));
  }

  list(sampleSet = 'default'): FinanceBenchmarkSample[] {
    return this.repo.listBenchmarkSamples(sampleSet);
  }
}
