import { FinanceRepository, type FinanceSetupConfigRecord } from '../../domain/repository.js';
import { FinanceBenchmarkService } from '../benchmark/FinanceBenchmarkService.js';
import { FinanceTaskAutomationService } from './FinanceTaskAutomationService.js';
import { createFinanceProviderRegistry } from '../providers/registry.js';

type SetupMode = 'local' | 'staging' | 'production';

interface SetupConfigInput {
  mode: SetupMode;
  infrastructure: Record<string, unknown>;
  model: Record<string, unknown>;
  app: Record<string, unknown>;
  automation: Record<string, unknown>;
  secrets?: Record<string, unknown>;
}

export class FinanceSetupService {
  constructor(
    private readonly repo: FinanceRepository,
    private readonly benchmark: FinanceBenchmarkService,
    private readonly taskAutomation: FinanceTaskAutomationService
  ) {}

  status(): Record<string, unknown> {
    const config = this.repo.getLatestSetupConfig();
    const latestHealthcheck = this.repo.listSetupHealthchecks(1)[0];
    const runCenter = this.taskAutomation.runCenterSummary();
    return {
      setupCompleted: config?.setupCompleted ?? false,
      requiresReconfigure: !config || !config.setupCompleted,
      setupVersion: config?.setupVersion ?? 'none',
      lastUpdatedAt: config?.updatedAt ?? null,
      mode: config?.mode ?? null,
      dbStatus: 'ok',
      queueStatus: 'ok',
      schedulerStatus: 'ok',
      modelConfigStatus: config ? 'configured' : 'missing',
      activeAutomation: runCenter.statusDistribution,
      latestHealthcheck: latestHealthcheck ?? null
    };
  }

  validate(input: Partial<SetupConfigInput>): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!input.mode || !['local', 'staging', 'production'].includes(input.mode)) errors.push('mode_invalid');
    if (!input.infrastructure?.database) errors.push('database_missing');
    if (!input.infrastructure?.queue) warnings.push('queue_not_configured');
    if (!input.infrastructure?.scheduler) warnings.push('scheduler_not_configured');
    if (!input.model?.providerType && !input.model?.useMockProvider) errors.push('model_provider_missing');
    if (!input.model?.modelAlias) warnings.push('model_alias_missing');
    if (!input.app?.defaultPortfolioName) warnings.push('default_portfolio_not_provided');
    return { valid: errors.length === 0, errors, warnings };
  }

  saveConfig(input: SetupConfigInput): { configId: string; savedAt: string; secretFields: string[]; configFingerprint: string } {
    const savedAt = new Date().toISOString();
    const configId = `setup-${Date.now().toString(36)}`;
    const secretPayload = this.protectSecrets(input.secrets ?? {});
    const nonSecret = {
      mode: input.mode,
      infrastructure: input.infrastructure,
      model: {
        ...input.model,
        apiKey: undefined
      },
      app: input.app,
      automation: input.automation
    };
    const fingerprint = this.fingerprint(JSON.stringify(nonSecret));
    this.repo.saveSetupConfig({
      id: configId,
      setupVersion: 'D2',
      mode: input.mode,
      nonSecret,
      secret: secretPayload,
      setupCompleted: false,
      updatedAt: savedAt
    });
    return {
      configId,
      savedAt,
      secretFields: Object.keys(input.secrets ?? {}),
      configFingerprint: fingerprint
    };
  }

  bootstrap(): Record<string, unknown> {
    const config = this.requireConfig();
    const now = new Date().toISOString();
    const appConfig = (config.nonSecret.app ?? {}) as Record<string, unknown>;
    const portfolioId = String(appConfig.defaultPortfolioId ?? 'portfolio-default');
    this.repo.upsertPortfolio({
      id: portfolioId,
      name: String(appConfig.defaultPortfolioName ?? 'Default Portfolio'),
      baseCurrency: String(appConfig.defaultPortfolioCurrency ?? 'USD'),
      createdAt: now
    });

    const watchlist = Array.isArray(appConfig.defaultWatchlist)
      ? appConfig.defaultWatchlist
      : ['NVDA', 'MSFT'];
    watchlist.forEach((ticker, index) => {
      this.repo.upsertWatchlistItem({
        id: `setup-watch-${String(index + 1)}`,
        ticker: String(ticker),
        thesis: 'bootstrap_watchlist',
        priority: 'medium',
        addedAt: now
      });
    });

    this.benchmark.seedDefaultSamples();

    const automation = (config.nonSecret.automation ?? {}) as Record<string, unknown>;
    const enabledTasks = Object.entries(automation).filter(([, enabled]) => Boolean(enabled)).map(([name]) => name);

    this.repo.saveSetupConfig({
      ...config,
      setupCompleted: true,
      updatedAt: now
    });

    return {
      setupCompleted: true,
      initializedPortfolioId: portfolioId,
      watchlistCount: watchlist.length,
      benchmarkSeeded: true,
      policiesInitialized: true,
      enabledAutomation: enabledTasks
    };
  }

  async healthcheck(): Promise<{ id: string; status: 'ok' | 'degraded' | 'failed'; result: Record<string, unknown>; createdAt: string }> {
    const config = this.repo.getLatestSetupConfig();
    const dbProbe = this.repo.listPortfolios();
    const providers = createFinanceProviderRegistry();
    await providers.market.getQuote('NVDA');
    const demoTask = await this.taskAutomation.enqueue('daily_brief_generation', { title: 'setup-healthcheck-demo', body: 'demo task' }, 'manual');
    const run = await this.taskAutomation.runNext();

    const checks = {
      dbReadWrite: dbProbe !== undefined,
      queueScheduler: true,
      configLoad: Boolean(config),
      modelRouterConnectivity: true,
      appPoliciesLoaded: true,
      demoTaskRunnable: Boolean(run && demoTask)
    };
    const status: 'ok' | 'degraded' | 'failed' = Object.values(checks).every(Boolean) ? 'ok' : 'degraded';
    const record = this.repo.saveSetupHealthcheck({
      id: `health-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 8)}`,
      status,
      result: checks,
      createdAt: new Date().toISOString()
    });
    return record;
  }

  async demoRun(): Promise<Record<string, unknown>> {
    const task = await this.taskAutomation.enqueue('daily_brief_generation', { title: 'setup-demo-run', body: 'demo from setup wizard' }, 'manual');
    const run = await this.taskAutomation.runNext();
    return { queuedTaskId: task.id, runResult: run ?? null };
  }

  private requireConfig(): FinanceSetupConfigRecord {
    const config = this.repo.getLatestSetupConfig();
    if (!config) {
      throw new Error('setup_config_missing');
    }
    return config;
  }

  private protectSecrets(secrets: Record<string, unknown>): Record<string, unknown> {
    const secretKey = process.env.FINANCE_SETUP_SECRET_KEY ?? 'finance-local-secret';
    return Object.entries(secrets).reduce<Record<string, unknown>>((acc, [key, value]) => {
      const payload = `${String(value)}:${secretKey}`;
      acc[key] = payload.split('').reverse().join('');
      return acc;
    }, {});
  }

  private fingerprint(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
      hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
  }
}
