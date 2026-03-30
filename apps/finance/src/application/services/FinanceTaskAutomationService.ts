import { FinanceRepository, type FinanceTaskRecord } from '../../domain/repository.js';
import type { FinanceTaskType } from '../../domain/models.js';
import { InMemoryFinanceQueueAdapter, type FinanceQueueAdapter } from '../../infrastructure/adapters/FinanceQueueAdapter.js';
import {
  InMemoryFinanceSchedulerAdapter,
  type FinanceSchedulerAdapter
} from '../../infrastructure/adapters/FinanceSchedulerAdapter.js';
import { FinanceAppOrchestratorService } from './FinanceAppOrchestratorService.js';
import { FinanceReviewService } from '../reviews/FinanceReviewService.js';
import { FinanceErrorIntelligenceService } from '../error-intelligence/FinanceErrorIntelligenceService.js';

export class FinanceTaskAutomationService {
  private readonly orchestrator: FinanceAppOrchestratorService;
  private readonly reviewService: FinanceReviewService;
  private readonly errorService: FinanceErrorIntelligenceService;

  constructor(
    private readonly repo = new FinanceRepository(),
    private readonly queue: FinanceQueueAdapter = new InMemoryFinanceQueueAdapter(),
    private readonly scheduler: FinanceSchedulerAdapter = new InMemoryFinanceSchedulerAdapter()
  ) {
    this.orchestrator = new FinanceAppOrchestratorService(repo);
    this.reviewService = new FinanceReviewService(repo);
    this.errorService = new FinanceErrorIntelligenceService(repo);
  }

  async enqueue(taskType: FinanceTaskType, payload: Record<string, unknown>, source: FinanceTaskRecord['source']): Promise<FinanceTaskRecord> {
    const idempotencyKey = `${taskType}:${JSON.stringify(payload)}`;
    const existing = this.repo.listTasks({ limit: 500 }).find((x) => x.idempotencyKey === idempotencyKey && x.status === 'pending');
    if (existing) return existing;

    const task: FinanceTaskRecord = {
      id: `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      taskType,
      status: 'pending',
      scheduledAt: undefined,
      retryCount: 0,
      source,
      idempotencyKey,
      refs: {},
      payload,
      createdAt: new Date().toISOString()
    };
    this.repo.saveTask(task);
    await this.queue.enqueue({ id: `msg-${task.id}`, taskId: task.id, taskType: task.taskType, payload, source, enqueuedAt: new Date().toISOString() });
    this.repo.recordMetric({ id: `m-${Date.now().toString(36)}`, metricKey: 'queued_task_count', metricValue: 1, meta: { taskType }, createdAt: new Date().toISOString() });
    if (source === 'manual') this.repo.recordMetric({ id: `m-${Date.now().toString(36)}-manual`, metricKey: 'manual_run_count', metricValue: 1, meta: {}, createdAt: new Date().toISOString() });
    return task;
  }

  async schedule(taskType: FinanceTaskType, runAt: string, payload: Record<string, unknown>): Promise<void> {
    await this.scheduler.register({ id: `sched-${Date.now().toString(36)}`, taskType, runAt, payload, source: 'schedule' });
    this.repo.recordMetric({ id: `m-${Date.now().toString(36)}-sched`, metricKey: 'scheduled_run_count', metricValue: 1, meta: { taskType }, createdAt: new Date().toISOString() });
  }

  async pollScheduled(now = new Date()): Promise<number> {
    const due = await this.scheduler.due(now);
    for (const task of due) {
      await this.enqueue(task.taskType as FinanceTaskType, task.payload, 'schedule');
    }
    return due.length;
  }

  async runNext(): Promise<FinanceTaskRecord | undefined> {
    const message = await this.queue.dequeue();
    if (!message) return undefined;
    const task = this.repo.getTask(message.taskId);
    if (!task || task.status === 'cancelled') return task;

    task.status = 'running';
    task.startedAt = new Date().toISOString();
    this.repo.saveTask(task);
    this.repo.recordMetric({ id: `m-${Date.now().toString(36)}-running`, metricKey: 'running_task_count', metricValue: 1, meta: { taskType: task.taskType }, createdAt: new Date().toISOString() });

    try {
      await this.execute(task);
      task.status = 'succeeded';
      task.finishedAt = new Date().toISOString();
      this.repo.saveTask(task);
      this.repo.recordMetric({ id: `m-${Date.now().toString(36)}-success`, metricKey: 'task_success_rate', metricValue: 1, meta: {}, createdAt: new Date().toISOString() });
    } catch (error) {
      task.status = 'failed';
      task.errorSummary = error instanceof Error ? error.message : String(error);
      task.finishedAt = new Date().toISOString();
      this.repo.saveTask(task);
      this.repo.recordMetric({ id: `m-${Date.now().toString(36)}-failed`, metricKey: 'failed_task_count', metricValue: 1, meta: { taskType: task.taskType }, createdAt: new Date().toISOString() });
    }

    return task;
  }

  async retry(taskId: string): Promise<FinanceTaskRecord | undefined> {
    const task = this.repo.getTask(taskId);
    if (!task || task.status !== 'failed') return task;
    task.status = 'pending';
    task.retryCount += 1;
    task.errorSummary = undefined;
    this.repo.saveTask(task);
    await this.queue.enqueue({ id: `msg-retry-${task.id}-${task.retryCount}`, taskId: task.id, taskType: task.taskType, payload: task.payload, source: task.source, enqueuedAt: new Date().toISOString() });
    this.repo.recordMetric({ id: `m-${Date.now().toString(36)}-retry`, metricKey: 'retry_count', metricValue: 1, meta: { taskId }, createdAt: new Date().toISOString() });
    return task;
  }

  cancel(taskId: string): FinanceTaskRecord | undefined {
    const task = this.repo.getTask(taskId);
    if (!task || task.status !== 'pending') return task;
    task.status = 'cancelled';
    task.finishedAt = new Date().toISOString();
    this.repo.saveTask(task);
    return task;
  }

  list(filters?: { status?: string; taskType?: string; limit?: number }): FinanceTaskRecord[] {
    return this.repo.listTasks(filters);
  }

  runCenterSummary(): Record<string, unknown> {
    return this.repo.getRunCenterSummary();
  }

  private async execute(task: FinanceTaskRecord): Promise<void> {
    if (task.taskType === 'daily_brief_generation' || task.taskType === 'weekly_portfolio_review') {
      const result = await this.orchestrator.runMockTask({
        artifactType: task.taskType === 'daily_brief_generation' ? 'daily_brief' : 'weekly_review',
        title: String(task.payload.title ?? task.taskType),
        body: String(task.payload.body ?? 'scheduled task body'),
        ticker: task.payload.ticker ? String(task.payload.ticker) : undefined,
        riskLevel: (task.payload.riskLevel as 'low' | 'medium' | 'high') ?? 'medium',
        activeSTUContext: []
      });
      task.refs = { artifactId: result.artifactId, reviewIds: result.reviewIds };
      return;
    }

    if (task.taskType === 'prediction_review') {
      const due = this.reviewService
        .listByTrigger('time_based')
        .filter((p) => this.reviewService.shouldTriggerReview(p));
      task.refs = { duePredictions: due.map((d) => d.id) };
      return;
    }

    if (task.taskType === 'error_pattern_scan') {
      const patterns = this.errorService.aggregatePatterns(this.reviewService.listReviews());
      task.refs = { patternIds: patterns.map((p) => p.id) };
      return;
    }

    // lightweight placeholders for required task types
    task.refs = { note: `task ${task.taskType} executed` };
  }
}
