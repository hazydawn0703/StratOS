import type { TaskContext } from '@stratos/shared-types';

export interface TaskRuntime {
  createTaskContext(seed: Partial<TaskContext>): TaskContext;
  enrichTaskContext(context: TaskContext, enrichment: Record<string, unknown>): TaskContext;
}

export class MockTaskRuntime implements TaskRuntime {
  createTaskContext(seed: Partial<TaskContext>): TaskContext {
    return {
      taskType: seed.taskType ?? 'unknown',
      thesisType: seed.thesisType ?? 'generic',
      riskLevel: seed.riskLevel ?? 'medium',
      ticker: seed.ticker,
      metadata: seed.metadata ?? {}
    };
  }

  enrichTaskContext(context: TaskContext, enrichment: Record<string, unknown>): TaskContext {
    return { ...context, metadata: { ...(context.metadata ?? {}), ...enrichment } };
  }
}
