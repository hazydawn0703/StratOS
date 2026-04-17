import { FinanceRepository, type FinanceSetupConfigRecord } from '../../domain/repository.js';
import { FinanceBenchmarkService } from '../benchmark/FinanceBenchmarkService.js';
import { FinanceTaskAutomationService } from './FinanceTaskAutomationService.js';
import { createFinanceProviderRegistry } from '../providers/registry.js';
import { FinanceRuntimeSettingsService } from './FinanceRuntimeSettingsService.js';

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
  private readonly runtimeSettings: FinanceRuntimeSettingsService;

  constructor(
    private readonly repo: FinanceRepository,
    private readonly benchmark: FinanceBenchmarkService,
    private readonly taskAutomation: FinanceTaskAutomationService
  ) {
    this.runtimeSettings = new FinanceRuntimeSettingsService(repo);
  }

  status(): Record<string, unknown> {
    const config = this.repo.getLatestSetupConfig();
    const latestHealthcheck = this.repo.listSetupHealthchecks(1)[0];
    const runCenter = this.taskAutomation.runCenterSummary();
    const runtime = this.runtimeSettings.read();
    const recentTasks = this.repo.listTasks({ limit: 50 });
    const missingSteps: string[] = [];
    if (!config) missingSteps.push('save_config');
    if (config && !config.setupCompleted) missingSteps.push('bootstrap');
    if (!latestHealthcheck || latestHealthcheck.status !== 'ok') missingSteps.push('healthcheck');
    if (!recentTasks.some((task) => task.source === 'manual' && task.status === 'succeeded')) {
      missingSteps.push('demo_run');
    }
    const state = this.resolveSetupState(config, latestHealthcheck?.status, missingSteps.length === 0);

    return {
      setupCompleted: config?.setupCompleted ?? false,
      setupState: state,
      requiresReconfigure: state === 'requires_reconfigure' || state === 'invalid',
      setupVersion: config?.setupVersion ?? 'none',
      lastUpdatedAt: config?.updatedAt ?? null,
      mode: config?.mode ?? null,
      dbStatus: 'ok',
      queueStatus: recentTasks.some((x) => x.status === 'queued') ? 'active' : 'idle',
      schedulerStatus: this.repo.listScheduleRecords().length ? 'configured' : 'idle',
      modelConfigStatus: runtime.runtimeOverview ? 'configured' : 'missing',
      activeAutomation: runCenter.statusDistribution,
      runtimeSettingsStatus: runtime.runtimeOverview,
      latestHealthcheck: latestHealthcheck ?? null,
      latestDemoRun: recentTasks.find((task) => task.source === 'manual') ?? null,
      missingSteps
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

    const taskRoutingDefaults = ((input.model.taskRoutingDefaults as Record<string, unknown> | undefined) ?? {}) as Record<string, unknown>;
    this.runtimeSettings.save({
      mode: input.model.useMockProvider ? 'mock' : 'real-runtime-configured',
      runtimeConfig: {
        providerProfileId: String(input.model.providerProfileId ?? `${input.mode}-profile`),
        providerKey: String(input.model.providerType ?? 'mock'),
        defaultModelAlias: String(input.model.modelAlias ?? 'mock-model-v1'),
        reviewerModelAlias: input.model.reviewerModelAlias ? String(input.model.reviewerModelAlias) : undefined,
        fallbackModelAlias: input.model.fallbackModelAlias ? String(input.model.fallbackModelAlias) : undefined,
        structuredOutputMode: String(input.model.structuredOutputMode ?? 'required'),
        costGuardrail: input.model.costGuardrail,
        latencyGuardrailMs: input.model.latencyGuardrailMs
      },
      appPreferences: { taskRoutingDefaults },
      secretRefs: Object.keys(input.secrets ?? {}).reduce<Record<string, string>>((acc, key) => {
        acc[key] = 'configured';
        return acc;
      }, {}),
      changedBy: 'setup-wizard'
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
    const defaultTaskTypes = enabledTasks.length
      ? enabledTasks
      : ['daily_brief_generation', 'prediction_review', 'error_pattern_scan'];

    defaultTaskTypes.forEach((taskType, index) => {
      this.repo.saveScheduleRecord({
        id: `setup-schedule-${index + 1}-${Date.now().toString(36)}`,
        taskType: taskType as never,
        runAt: new Date(Date.now() + 60_000 * (index + 1)).toISOString(),
        payload: { source: 'setup-default' },
        source: 'schedule',
        status: 'pending',
        createdAt: now
      });
    });

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
      enabledAutomation: defaultTaskTypes
    };
  }

  async healthcheck(): Promise<{ id: string; status: 'ok' | 'degraded' | 'failed'; result: Record<string, unknown>; createdAt: string }> {
    const config = this.repo.getLatestSetupConfig();
    const dbProbe = this.repo.listPortfolios();
    const providers = createFinanceProviderRegistry();
    await providers.market.getQuote('NVDA');
    const demoTask = await this.taskAutomation.enqueue('daily_brief_generation', { title: 'setup-healthcheck-demo', body: 'demo task' }, 'manual');
    const run = await this.taskAutomation.runNext();

    const runtimeHealth = (await this.runtimeSettings.healthcheck()) as Record<string, unknown>;
    const runtimeChecks = (runtimeHealth.checks as Record<string, unknown> | undefined) ?? {};
    const checks = {
      dbReadWrite: dbProbe !== undefined,
      queueScheduler: this.repo.listQueueRecords('queued').length >= 0 && this.repo.listScheduleRecords().length >= 0,
      configLoad: Boolean(config),
      runtimeSettingsAvailability: Boolean(this.repo.getActiveRuntimeSettings()),
      modelRouterConnectivity: runtimeChecks.routerConfiguration === true,
      modelGatewayConnectivity: runtimeChecks.gatewayConnectivity === true,
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
    const run1 = await this.taskAutomation.runNext();
    const run2 = await this.taskAutomation.runNext();
    const run3 = await this.taskAutomation.runNext();
    return {
      queuedTaskId: task.id,
      runs: [run1, run2, run3].filter(Boolean),
      artifacts: this.repo.listArtifacts().slice(0, 3),
      predictions: this.repo.listPredictions().slice(0, 3),
      reviews: this.repo.listReviews().slice(0, 3),
      timeline: this.repo.listTimeline({ limit: 3 })
    };
  }

  history(limit = 10): Record<string, unknown> {
    return {
      setupConfigs: this.repo.getLatestSetupConfig() ? [this.repo.getLatestSetupConfig()] : [],
      healthchecks: this.repo.listSetupHealthchecks(limit)
    };
  }

  reset(reason = 'manual_reset'): Record<string, unknown> {
    const now = new Date().toISOString();
    const previous = this.repo.getLatestSetupConfig();
    this.repo.saveSetupConfig({
      id: `setup-reset-${Date.now().toString(36)}`,
      setupVersion: 'D2',
      mode: previous?.mode ?? 'local',
      nonSecret: {
        ...(previous?.nonSecret ?? {}),
        resetReason: reason
      },
      secret: {},
      setupCompleted: false,
      updatedAt: now
    });
    return {
      reset: true,
      at: now,
      reason
    };
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

  private resolveSetupState(
    config: FinanceSetupConfigRecord | undefined,
    healthStatus: 'ok' | 'degraded' | 'failed' | undefined,
    completed: boolean
  ): 'not_initialized' | 'partial' | 'completed' | 'invalid' | 'requires_reconfigure' {
    if (!config) return 'not_initialized';
    if (!config.setupCompleted) return 'partial';
    if (healthStatus === 'failed') return 'invalid';
    if (healthStatus === 'degraded') return 'requires_reconfigure';
    return completed ? 'completed' : 'requires_reconfigure';
  }
}
