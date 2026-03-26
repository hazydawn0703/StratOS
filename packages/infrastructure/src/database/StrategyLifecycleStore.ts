import type { DatabaseAdapter } from './DatabaseAdapter.js';
import { SQLiteDatabaseAdapter } from './SQLiteDatabaseAdapter.js';

export type StrategyLifecycleState =
  | 'candidate'
  | 'evaluated'
  | 'experimenting'
  | 'active'
  | 'rolled_back';

export interface StrategyLifecycleSnapshot {
  candidateId: string;
  state: StrategyLifecycleState;
  history: Array<{ at: string; state: StrategyLifecycleState; note?: string }>;
}

export interface StrategyLifecycleStore {
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
 * Current implementation uses transaction boundaries and an internal cache as a bridge,
 * so workflow code can migrate to async persistence contract without waiting for a concrete DB driver.
 */
export class DatabaseStrategyLifecycleStore implements StrategyLifecycleStore {
  private readonly cache = new Map<string, StrategyLifecycleSnapshot>();

  constructor(private readonly database: DatabaseAdapter = new SQLiteDatabaseAdapter()) {}

  async save(snapshot: StrategyLifecycleSnapshot): Promise<void> {
    await this.database.transaction(async () => {
      this.cache.set(snapshot.candidateId, snapshot);
    });
  }

  async get(candidateId: string): Promise<StrategyLifecycleSnapshot | undefined> {
    let result: StrategyLifecycleSnapshot | undefined;
    await this.database.transaction(async () => {
      result = this.cache.get(candidateId);
    });
    return result;
  }
}
