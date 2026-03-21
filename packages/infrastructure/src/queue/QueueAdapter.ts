export interface QueueAdapter<T = unknown> {
  enqueue(message: T): Promise<string>;
  dequeue(): Promise<{ id: string; message: T } | undefined>;
  ack(messageId: string): Promise<void>;
  retry(messageId: string): Promise<void>;
}

export class InMemoryQueueAdapter<T = unknown> implements QueueAdapter<T> {
  private queue: Array<{ id: string; message: T }> = [];

  async enqueue(message: T): Promise<string> {
    const id = `msg-${this.queue.length + 1}`;
    this.queue.push({ id, message });
    return id;
  }

  async dequeue(): Promise<{ id: string; message: T } | undefined> {
    return this.queue.shift();
  }

  async ack(_messageId: string): Promise<void> {}
  async retry(messageId: string): Promise<void> {
    const existing = this.queue.find((item) => item.id === messageId);
    if (existing) {
      this.queue.push(existing);
    }
  }
}
