export interface ConfigProvider {
  get(key: string): string | undefined;
  require(key: string): string;
}

export class InMemoryConfigProvider implements ConfigProvider {
  constructor(private readonly values: Record<string, string>) {}

  get(key: string): string | undefined {
    return this.values[key];
  }

  require(key: string): string {
    const value = this.get(key);
    if (!value) {
      throw new Error(`Missing config key: ${key}`);
    }

    return value;
  }
}
