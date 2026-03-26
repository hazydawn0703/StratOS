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

export class ReplayAuditEngine {
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
}
