import type { DatabaseAdapter } from './DatabaseAdapter.js';
import { SQLiteDatabaseAdapter } from './SQLiteDatabaseAdapter.js';
import type { RuntimeGovernanceEvent } from '@stratos/shared-types';

export type StrategyLifecycleState =
  | 'candidate'
  | 'evaluated'
  | 'experimenting'
  | 'active'
  | 'rolled_back'
  | 'deprecated';

export interface StrategyLifecycleSnapshot {
  candidateId: string;
  state: StrategyLifecycleState;
  history: Array<{ at: string; state: StrategyLifecycleState; note?: string }>;
}

export interface StrategyLifecycleStore {
  save(snapshot: StrategyLifecycleSnapshot): Promise<void>;
  get(candidateId: string): Promise<StrategyLifecycleSnapshot | undefined>;
}

export interface GovernanceEventStore {
  append(event: RuntimeGovernanceEvent): Promise<void>;
  listByCandidate(candidateId: string): Promise<RuntimeGovernanceEvent[]>;
}

export interface StrategyLifecyclePersistenceDriver {
  save(snapshot: StrategyLifecycleSnapshot): Promise<void>;
  get(candidateId: string): Promise<StrategyLifecycleSnapshot | undefined>;
}

export interface GovernanceEventPersistenceDriver {
  append(event: RuntimeGovernanceEvent): Promise<void>;
  listByCandidate(candidateId: string): Promise<RuntimeGovernanceEvent[]>;
}

export class InMemoryStrategyLifecycleStore implements StrategyLifecycleStore {
  private readonly data = new Map<string, StrategyLifecycleSnapshot>();

  async save(snapshot: StrategyLifecycleSnapshot): Promise<void> {
    this.data.set(snapshot.candidateId, snapshot);
  }

  async get(candidateId: string): Promise<StrategyLifecycleSnapshot | undefined> {
    return this.data.get(candidateId);
  }
}

export class InMemoryGovernanceEventStore implements GovernanceEventStore {
  private readonly events: RuntimeGovernanceEvent[] = [];

  async append(event: RuntimeGovernanceEvent): Promise<void> {
    this.events.push(event);
  }

  async listByCandidate(candidateId: string): Promise<RuntimeGovernanceEvent[]> {
    return this.events.filter((event) => event.candidate_id === candidateId);
  }
}

/**
 * Database-backed lifecycle store facade.
 * It can use a concrete persistence driver (e.g. sqlite/remote), while keeping
 * transaction orchestration and governance contracts inside the framework layer.
 */
export class DatabaseStrategyLifecycleStore implements StrategyLifecycleStore {
  private readonly cache = new Map<string, StrategyLifecycleSnapshot>();

  constructor(
    private readonly database: DatabaseAdapter = new SQLiteDatabaseAdapter(),
    private readonly driver?: StrategyLifecyclePersistenceDriver
  ) {}

  async save(snapshot: StrategyLifecycleSnapshot): Promise<void> {
    await this.database.transaction(async () => {
      if (this.driver) {
        await this.driver.save(snapshot);
      }
      this.cache.set(snapshot.candidateId, snapshot);
    });
  }

  async get(candidateId: string): Promise<StrategyLifecycleSnapshot | undefined> {
    let result: StrategyLifecycleSnapshot | undefined;
    await this.database.transaction(async () => {
      if (this.driver) {
        result = await this.driver.get(candidateId);
        return;
      }
      result = this.cache.get(candidateId);
    });
    return result;
  }
}

export class DatabaseGovernanceEventStore implements GovernanceEventStore {
  private readonly cache: RuntimeGovernanceEvent[] = [];

  constructor(
    private readonly database: DatabaseAdapter = new SQLiteDatabaseAdapter(),
    private readonly driver?: GovernanceEventPersistenceDriver
  ) {}

  async append(event: RuntimeGovernanceEvent): Promise<void> {
    await this.database.transaction(async () => {
      if (this.driver) {
        await this.driver.append(event);
      }
      this.cache.push(event);
    });
  }

  async listByCandidate(candidateId: string): Promise<RuntimeGovernanceEvent[]> {
    let result: RuntimeGovernanceEvent[] = [];
    await this.database.transaction(async () => {
      if (this.driver) {
        result = await this.driver.listByCandidate(candidateId);
        return;
      }
      result = this.cache.filter((event) => event.candidate_id === candidateId);
    });
    return result;
  }
}
