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
