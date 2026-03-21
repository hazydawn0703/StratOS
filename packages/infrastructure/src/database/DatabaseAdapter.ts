export interface DatabaseAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  transaction<T>(operation: () => Promise<T>): Promise<T>;
}

export class MockDatabaseAdapter implements DatabaseAdapter {
  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {}
  async transaction<T>(operation: () => Promise<T>): Promise<T> {
    return operation();
  }
}
