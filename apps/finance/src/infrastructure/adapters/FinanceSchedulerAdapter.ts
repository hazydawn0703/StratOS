import { FinanceRepository } from '../../domain/repository.js';

export interface ScheduledFinanceTask {
  id: string;
  taskType: string;
  runAt: string;
  payload: Record<string, unknown>;
  source: 'schedule';
}

export interface FinanceSchedulerAdapter {
  register(task: ScheduledFinanceTask): Promise<void>;
  due(now?: Date): Promise<ScheduledFinanceTask[]>;
  remove(id: string): Promise<void>;
}

export class InMemoryFinanceSchedulerAdapter implements FinanceSchedulerAdapter {
  private readonly tasks = new Map<string, ScheduledFinanceTask>();

  async register(task: ScheduledFinanceTask): Promise<void> {
    this.tasks.set(task.id, task);
  }

  async due(now = new Date()): Promise<ScheduledFinanceTask[]> {
    const due = [...this.tasks.values()].filter((t) => new Date(t.runAt) <= now);
    for (const item of due) this.tasks.delete(item.id);
    return due;
  }

  async remove(id: string): Promise<void> {
    this.tasks.delete(id);
  }
}

export class DurableFinanceSchedulerAdapter implements FinanceSchedulerAdapter {
  constructor(private readonly repo = new FinanceRepository()) {}

  async register(task: ScheduledFinanceTask): Promise<void> {
    this.repo.saveScheduleRecord({
      id: task.id,
      taskType: task.taskType,
      runAt: task.runAt,
      payload: task.payload,
      source: 'schedule',
      status: 'pending',
      createdAt: new Date().toISOString()
    });
  }

  async due(now = new Date()): Promise<ScheduledFinanceTask[]> {
    const due = this.repo
      .listScheduleRecords('pending')
      .filter((x) => new Date(x.runAt) <= now);
    due.forEach((item) => {
      this.repo.saveScheduleRecord({ ...item, status: 'enqueued' });
    });
    return due.map((x) => ({
      id: x.id,
      taskType: x.taskType,
      runAt: x.runAt,
      payload: x.payload,
      source: 'schedule'
    }));
  }

  async remove(id: string): Promise<void> {
    const row = this.repo.listScheduleRecords().find((x) => x.id === id);
    if (!row) return;
    this.repo.saveScheduleRecord({ ...row, status: 'cancelled' });
  }
}
