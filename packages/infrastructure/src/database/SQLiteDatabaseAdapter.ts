import type { DatabaseAdapter } from './DatabaseAdapter.js';

export interface SQLiteLikeClient {
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

class InMemorySQLiteClient implements SQLiteLikeClient {
  async begin(): Promise<void> {}
  async commit(): Promise<void> {}
  async rollback(): Promise<void> {}
}

/**
 * SQLite adapter abstraction with transaction semantics.
 * In production this client can be replaced with a real sqlite driver binding.
 */
export class SQLiteDatabaseAdapter implements DatabaseAdapter {
  constructor(private readonly client: SQLiteLikeClient = new InMemorySQLiteClient()) {}

  async connect(): Promise<void> {}

  async disconnect(): Promise<void> {}

  async transaction<T>(operation: () => Promise<T>): Promise<T> {
    await this.client.begin();
    try {
      const result = await operation();
      await this.client.commit();
      return result;
    } catch (error) {
      await this.client.rollback();
      throw error;
    }
  }
}
