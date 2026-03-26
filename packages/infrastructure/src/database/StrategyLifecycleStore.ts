import type { DatabaseAdapter } from './DatabaseAdapter.js';
import { SQLiteDatabaseAdapter } from './SQLiteDatabaseAdapter.js';

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

export interface StrategyLifecyclePersistenceDriver {
  save(snapshot: StrategyLifecycleSnapshot): Promise<void>;
  get(candidateId: string): Promise<StrategyLifecycleSnapshot | undefined>;
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
