import { FinanceRepository } from '../../domain/repository.js';

export interface QueueMessage {
  id: string;
  taskId: string;
  taskType: string;
  payload: Record<string, unknown>;
  source: 'manual' | 'schedule' | 'replay';
  enqueuedAt: string;
  claimToken?: string;
  leaseUntil?: string;
  attemptCount?: number;
}

export interface FinanceQueueAdapter {
  enqueue(message: QueueMessage): Promise<void>;
  dequeue(): Promise<QueueMessage | undefined>;
  ack(messageId: string, claimToken?: string): Promise<void>;
  fail(messageId: string, claimToken?: string): Promise<void>;
  stale(now?: Date): Promise<QueueMessage[]>;
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

  async ack(_messageId: string): Promise<void> {
    return undefined;
  }

  async fail(_messageId: string): Promise<void> {
    return undefined;
  }

  async stale(): Promise<QueueMessage[]> {
    return [];
  }

  async size(): Promise<number> {
    return this.queue.length;
  }
}

export class DurableFinanceQueueAdapter implements FinanceQueueAdapter {
  constructor(private readonly repo = new FinanceRepository()) {}

  async enqueue(message: QueueMessage): Promise<void> {
    const duplicate = this.repo
      .listQueueRecords()
      .find((x) => x.taskId === message.taskId && (x.status === 'queued' || x.status === 'claimed'));
    if (duplicate) return;
    this.repo.saveQueueRecord({
      id: message.id,
      taskId: message.taskId,
      taskType: message.taskType,
      payload: message.payload,
      source: message.source,
      status: 'queued',
      attemptCount: 0,
      enqueuedAt: message.enqueuedAt
    });
  }

  async dequeue(): Promise<QueueMessage | undefined> {
    const now = new Date();
    const candidate = this.repo
      .listQueueRecords()
      .find((x) => x.status === 'queued' || (x.status === 'claimed' && x.leaseUntil && new Date(x.leaseUntil) <= now));
    if (!candidate) return undefined;
    const claimToken = `claim-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const leaseUntil = new Date(now.getTime() + 60_000).toISOString();
    this.repo.saveQueueRecord({
      ...candidate,
      status: 'claimed',
      claimToken,
      leaseUntil,
      attemptCount: candidate.attemptCount + 1
    });
    return { ...candidate, claimToken, leaseUntil, attemptCount: candidate.attemptCount + 1 };
  }

  async ack(messageId: string, claimToken?: string): Promise<void> {
    const row = this.repo.listQueueRecords().find((x) => x.id === messageId);
    if (!row) return;
    if (claimToken && row.claimToken && row.claimToken !== claimToken) return;
    this.repo.saveQueueRecord({ ...row, status: 'succeeded' });
  }

  async fail(messageId: string, claimToken?: string): Promise<void> {
    const row = this.repo.listQueueRecords().find((x) => x.id === messageId);
    if (!row) return;
    if (claimToken && row.claimToken && row.claimToken !== claimToken) return;
    this.repo.saveQueueRecord({ ...row, status: 'failed' });
  }

  async stale(now = new Date()): Promise<QueueMessage[]> {
    return this.repo
      .listQueueRecords('claimed')
      .filter((x) => x.leaseUntil && new Date(x.leaseUntil) <= now)
      .map((x) => ({
        id: x.id,
        taskId: x.taskId,
        taskType: x.taskType,
        payload: x.payload,
        source: x.source,
        enqueuedAt: x.enqueuedAt,
        claimToken: x.claimToken,
        leaseUntil: x.leaseUntil,
        attemptCount: x.attemptCount
      }));
  }

  async size(): Promise<number> {
    return this.repo.listQueueRecords().filter((x) => x.status === 'queued' || x.status === 'claimed').length;
  }
}
