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

export class ReplayAuditEngine {
  replay(fixture: ReplayFixture): ReplayResult {
    const stages = fixture.events.map((event) => event.stage);
    return {
      replayable: fixture.events.length > 0,
      eventCount: fixture.events.length,
      stages
    };
  }
}
