export interface ReplayEvent {
  at: string;
  stage: string;
  payload: Record<string, unknown>;
}

export interface ReplayFixture {
  runId: string;
  events: ReplayEvent[];
}

export interface ReplayResult {
  replayable: boolean;
  eventCount: number;
  stages: string[];
}

export interface ReplayDiff {
  stageDiff: string[];
  payloadKeyDiff: string[];
}

export interface PromotionReplayFixture {
  run_id?: string;
  candidate_id: string;
  source_error_pattern_id: string;
  baseline_version: string;
  candidate_version: string;
  experiment_mode: string;
  experiment_bucket: string;
  promotion_action: string;
  decision_reasons: string[];
  active_stu_version?: string;
}

export interface RunPromotionAuditSummaryInput {
  run_id: string;
  promotion: PromotionReplayFixture;
  governance_events?: string[];
}

export interface RunPromotionAuditIndexItem {
  run_id: string;
  summary: string;
  indexed_at: string;
}

export class ReplayAuditEngine {
  private readonly runAuditIndex = new Map<string, RunPromotionAuditIndexItem>();
  replay(fixture: ReplayFixture): ReplayResult {
    const stages = fixture.events.map((event) => event.stage);
    return {
      replayable: fixture.events.length > 0,
      eventCount: fixture.events.length,
      stages
    };
  }

  diff(base: ReplayFixture, candidate: ReplayFixture): ReplayDiff {
    const baseStages = new Set(base.events.map((event) => event.stage));
    const candidateStages = new Set(candidate.events.map((event) => event.stage));
    const stageDiff = Array.from(new Set([...baseStages, ...candidateStages])).filter(
      (stage) => !baseStages.has(stage) || !candidateStages.has(stage)
    );

    const baseKeys = new Set(base.events.flatMap((event) => Object.keys(event.payload)));
    const candidateKeys = new Set(candidate.events.flatMap((event) => Object.keys(event.payload)));
    const payloadKeyDiff = Array.from(new Set([...baseKeys, ...candidateKeys])).filter(
      (key) => !baseKeys.has(key) || !candidateKeys.has(key)
    );

    return { stageDiff, payloadKeyDiff };
  }

  explainPromotionChange(fixture: PromotionReplayFixture): string {
    const activeInfo = fixture.active_stu_version
      ? `active:${fixture.active_stu_version}`
      : 'active:not_promoted';
    return [
      ...(fixture.run_id ? [`run:${fixture.run_id}`] : []),
      `candidate:${fixture.candidate_id}`,
      `pattern:${fixture.source_error_pattern_id}`,
      `baseline:${fixture.baseline_version}`,
      `candidate_version:${fixture.candidate_version}`,
      `experiment:${fixture.experiment_mode}/${fixture.experiment_bucket}`,
      `decision:${fixture.promotion_action}`,
      activeInfo,
      `reasons:${fixture.decision_reasons.join('|')}`
    ].join(';');
  }

  explainPromotionRunSummary(input: RunPromotionAuditSummaryInput): string {
    const promoSummary = this.explainPromotionChange({
      ...input.promotion,
      run_id: input.run_id
    });
    const events = input.governance_events?.length ? input.governance_events.join('|') : 'none';
    return `${promoSummary};governance_events:${events}`;
  }

  indexPromotionRunSummary(input: RunPromotionAuditSummaryInput): RunPromotionAuditIndexItem {
    const summary = this.explainPromotionRunSummary(input);
    const item: RunPromotionAuditIndexItem = {
      run_id: input.run_id,
      summary,
      indexed_at: new Date().toISOString()
    };
    this.runAuditIndex.set(input.run_id, item);
    return item;
  }

  getRunSummary(runId: string): string | undefined {
    return this.runAuditIndex.get(runId)?.summary;
  }

  listRunSummaries(input?: {
    from?: string;
    to?: string;
    sort?: 'indexed_at_asc' | 'indexed_at_desc';
    offset?: number;
    limit?: number;
  }): RunPromotionAuditIndexItem[] {
    const from = input?.from;
    const to = input?.to;
    const sort = input?.sort ?? 'indexed_at_desc';
    const offset = Math.max(0, input?.offset ?? 0);
    const limit = input?.limit ? Math.max(1, input.limit) : undefined;

    const filtered = [...this.runAuditIndex.values()].filter((item) => {
      if (from && item.indexed_at < from) return false;
      if (to && item.indexed_at > to) return false;
      return true;
    });
    filtered.sort((a, b) => (sort === 'indexed_at_asc' ? a.indexed_at.localeCompare(b.indexed_at) : b.indexed_at.localeCompare(a.indexed_at)));
    const paged = filtered.slice(offset, limit ? offset + limit : undefined);
    return paged;
  }
}
