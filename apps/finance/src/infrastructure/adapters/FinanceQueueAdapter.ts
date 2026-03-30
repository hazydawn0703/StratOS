export interface QueueMessage {
  id: string;
  taskId: string;
  taskType: string;
  payload: Record<string, unknown>;
  source: 'manual' | 'schedule' | 'replay';
  enqueuedAt: string;
}

export interface FinanceQueueAdapter {
  enqueue(message: QueueMessage): Promise<void>;
  dequeue(): Promise<QueueMessage | undefined>;
  size(): Promise<number>;
}

export class InMemoryFinanceQueueAdapter implements FinanceQueueAdapter {
  private readonly queue: QueueMessage[] = [];

  async enqueue(message: QueueMessage): Promise<void> {
    this.queue.push(message);
  }

  async dequeue(): Promise<QueueMessage | undefined> {
    return this.queue.shift();
  }

  async size(): Promise<number> {
    return this.queue.length;
  }
}
