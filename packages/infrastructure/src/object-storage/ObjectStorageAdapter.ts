export interface ObjectStorageAdapter {
  putObject(key: string, value: Uint8Array): Promise<void>;
  getObject(key: string): Promise<Uint8Array | undefined>;
  deleteObject(key: string): Promise<void>;
}

export class InMemoryObjectStorageAdapter implements ObjectStorageAdapter {
  private readonly storage = new Map<string, Uint8Array>();

  async putObject(key: string, value: Uint8Array): Promise<void> {
    this.storage.set(key, value);
  }

  async getObject(key: string): Promise<Uint8Array | undefined> {
    return this.storage.get(key);
  }

  async deleteObject(key: string): Promise<void> {
    this.storage.delete(key);
  }
}
