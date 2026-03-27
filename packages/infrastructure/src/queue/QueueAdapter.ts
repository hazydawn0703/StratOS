export interface QueueAdapter<T = unknown> {
  enqueue(message: T): Promise<string>;
  dequeue(): Promise<{ id: string; message: T } | undefined>;
  ack(messageId: string): Promise<void>;
  retry(messageId: string): Promise<void>;
}

export class InMemoryQueueAdapter<T = unknown> implements QueueAdapter<T> {
  private queue: Array<{ id: string; message: T }> = [];
  private nextId = 1;
  private readonly inFlight = new Map<string, T>();
  private readonly retryCount = new Map<string, number>();
  private readonly deadLetters: Array<{ id: string; message: T; retries: number }> = [];

  constructor(private readonly maxRetries = 3) {}

  async enqueue(message: T): Promise<string> {
    const id = `msg-${this.nextId++}`;
    this.queue.push({ id, message });
    return id;
  }

  async dequeue(): Promise<{ id: string; message: T } | undefined> {
    const item = this.queue.shift();
    if (!item) return undefined;
    this.inFlight.set(item.id, item.message);
    return item;
  }

  async ack(messageId: string): Promise<void> {
    this.inFlight.delete(messageId);
    this.retryCount.delete(messageId);
  }

  async retry(messageId: string): Promise<void> {
    const message = this.inFlight.get(messageId);
    if (!message) return;

    const retries = (this.retryCount.get(messageId) ?? 0) + 1;
    this.retryCount.set(messageId, retries);
    this.inFlight.delete(messageId);

    if (retries > this.maxRetries) {
      this.deadLetters.push({ id: messageId, message, retries });
      this.retryCount.delete(messageId);
      return;
    }
    this.queue.push({ id: messageId, message });
  }

  getDeadLetters(): Array<{ id: string; message: T; retries: number }> {
    return [...this.deadLetters];
  }
}
