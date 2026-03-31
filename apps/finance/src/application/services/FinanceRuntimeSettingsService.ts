import { ModelRouter } from '@stratos/model-router';
import { ModelGateway, MockProviderAdapter } from '@stratos/model-gateway';
import {
  FinanceRepository,
  type FinanceRuntimeSettingsHistoryRecord,
  type FinanceRuntimeSettingsRecord
} from '../../domain/repository.js';

interface RuntimeSettingsInput {
  mode: 'mock' | 'real-runtime-configured';
  runtimeConfig: Record<string, unknown>;
  appPreferences: Record<string, unknown>;
  secretRefs?: Record<string, unknown>;
  changedBy?: string;
}

export class FinanceRuntimeSettingsService {
  private readonly router = new ModelRouter();
  private readonly gateway = new ModelGateway([new MockProviderAdapter()]);

  constructor(private readonly repo = new FinanceRepository()) {}

  read(): Record<string, unknown> {
    const active = this.repo.getActiveRuntimeSettings();
    if (!active) return this.defaultSummary();
    return this.maskedSummary(active);
  }

  validate(input: Partial<RuntimeSettingsInput>): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!input.mode || !['mock', 'real-runtime-configured'].includes(input.mode)) errors.push('mode_invalid');
    if (!input.runtimeConfig?.providerProfileId) errors.push('provider_profile_missing');
    if (!input.runtimeConfig?.defaultModelAlias) errors.push('default_model_alias_missing');
    if (!input.runtimeConfig?.routingDefaults) warnings.push('routing_defaults_missing');
    if (!input.appPreferences?.taskRoutingDefaults) warnings.push('task_routing_defaults_missing');
    return { valid: errors.length === 0, errors, warnings };
  }

  save(input: RuntimeSettingsInput): Record<string, unknown> {
    const now = new Date().toISOString();
    const previous = this.repo.getActiveRuntimeSettings();
    const settings: FinanceRuntimeSettingsRecord = {
      id: `runtime-${Date.now().toString(36)}`,
      mode: input.mode,
      runtimeConfig: input.runtimeConfig,
      appPreferences: input.appPreferences,
      secretRefs: input.secretRefs ?? {},
      updatedBy: input.changedBy ?? 'finance-admin',
      updatedAt: now,
      active: true
    };
    this.repo.saveRuntimeSettings(settings);

    const changedFields = this.computeChangedFields(previous, settings);
    const history: FinanceRuntimeSettingsHistoryRecord = {
      id: `runtime-history-${Date.now().toString(36)}`,
      settingsId: settings.id,
      changedBy: settings.updatedBy,
      changedAt: now,
      changedFields,
      previousSummary: previous ? this.maskedSummary(previous) : { empty: true },
      newSummary: this.maskedSummary(settings)
    };
    this.repo.saveRuntimeSettingsHistory(history);
    return this.maskedSummary(settings);
  }

  history(): { entries: FinanceRuntimeSettingsHistoryRecord[] } {
    return { entries: this.repo.listRuntimeSettingsHistory(50) };
  }

  resolveProfile(alias: string): Record<string, unknown> {
    const current = this.repo.getActiveRuntimeSettings();
    const profiles = (current?.runtimeConfig.providerProfiles as Array<Record<string, unknown>> | undefined) ?? [];
    const profile = profiles.find((x) => String(x.defaultModelAlias ?? '') === alias || String(x.reviewerModelAlias ?? '') === alias || String(x.fallbackModelAlias ?? '') === alias);
    return {
      resolved: Boolean(profile),
      alias,
      profile: profile ?? null
    };
  }

  async healthcheck(): Promise<Record<string, unknown>> {
    const current = this.repo.getActiveRuntimeSettings();
    const provider = String((current?.runtimeConfig.providerKey as string | undefined) ?? 'mock');
    const decision = this.router.route({ providers: [provider, 'mock'] } as never, {
      allowProviders: [provider, 'mock']
    });
    const textResult = await this.gateway.generateText('finance-runtime-healthcheck', {
      taskType: 'runtime_healthcheck',
      modelLayer: 'light',
      preferredProvider: decision.provider,
      fallbackProvider: 'mock'
    });
    const structuredResult = await this.gateway.generateStructuredJson('finance-runtime-healthcheck-json', {
      taskType: 'runtime_healthcheck',
      modelLayer: 'light',
      preferredProvider: decision.provider,
      fallbackProvider: 'mock'
    });

    return {
      status: textResult.provider ? 'pass' : 'fail',
      timestamp: new Date().toISOString(),
      affectedProfile: (current?.runtimeConfig.providerProfileId as string | undefined) ?? 'default',
      checks: {
        gatewayConnectivity: Boolean(textResult.provider),
        routerConfiguration: Boolean(decision.provider),
        modelProfileResolution: Boolean((current?.runtimeConfig.defaultModelAlias as string | undefined) ?? 'mock-model-v1'),
        structuredOutputSupport: Boolean(structuredResult.json),
        demoDryRun: Boolean(textResult.text ?? structuredResult.json)
      },
      routingDecision: decision
    };
  }

  mapTaskDefaults(taskType: string): Record<string, unknown> {
    const active = this.repo.getActiveRuntimeSettings();
    const taskRouting = ((active?.appPreferences.taskRoutingDefaults as Record<string, unknown> | undefined) ?? {}) as Record<string, Record<string, unknown>>;
    return taskRouting[taskType] ?? {};
  }

  private defaultSummary(): Record<string, unknown> {
    return {
      mode: 'mock',
      runtimeOverview: {
        providerProfile: null,
        defaultModelAlias: null,
        reviewerModelAlias: null,
        structuredOutputMode: 'required',
        costGuardrail: null,
        latencyGuardrail: null,
        healthStatus: 'unknown',
        updatedAt: null
      },
      runtimeConfig: {},
      appPreferences: {},
      secrets: {}
    };
  }

  private maskedSummary(record: FinanceRuntimeSettingsRecord): Record<string, unknown> {
    return {
      id: record.id,
      mode: record.mode,
      runtimeOverview: {
        providerProfile: record.runtimeConfig.providerProfileId ?? null,
        defaultModelAlias: record.runtimeConfig.defaultModelAlias ?? null,
        reviewerModelAlias: record.runtimeConfig.reviewerModelAlias ?? null,
        structuredOutputMode: record.runtimeConfig.structuredOutputMode ?? 'required',
        costGuardrail: record.runtimeConfig.costGuardrail ?? null,
        latencyGuardrail: record.runtimeConfig.latencyGuardrail ?? null,
        healthStatus: 'configured',
        updatedAt: record.updatedAt
      },
      runtimeConfig: record.runtimeConfig,
      appPreferences: record.appPreferences,
      secrets: Object.keys(record.secretRefs).reduce<Record<string, string>>((acc, key) => {
        acc[key] = 'configured';
        return acc;
      }, {})
    };
  }

  private computeChangedFields(previous: FinanceRuntimeSettingsRecord | undefined, next: FinanceRuntimeSettingsRecord): string[] {
    if (!previous) return ['initial_save'];
    const fields: string[] = [];
    if (previous.mode !== next.mode) fields.push('mode');
    if (JSON.stringify(previous.runtimeConfig) !== JSON.stringify(next.runtimeConfig)) fields.push('runtimeConfig');
    if (JSON.stringify(previous.appPreferences) !== JSON.stringify(next.appPreferences)) fields.push('appPreferences');
    if (JSON.stringify(previous.secretRefs) !== JSON.stringify(next.secretRefs)) fields.push('secretRefs');
    return fields.length ? fields : ['no_material_change'];
  }
}
