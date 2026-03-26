import type { DatabaseAdapter } from './DatabaseAdapter.js';

export interface RemoteTransactionClient {
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

/**
 * Remote DB adapter abstraction for managed database services.
 */
export class RemoteDatabaseAdapter implements DatabaseAdapter {
  constructor(private readonly client: RemoteTransactionClient) {}

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
