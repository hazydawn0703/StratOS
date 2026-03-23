import type { TaskContext } from '@stratos/shared-types';

export interface Orchestrator {
  runTask(context: TaskContext): Promise<unknown>;
  runReview(context: TaskContext): Promise<unknown>;
  runEvaluation(context: TaskContext): Promise<unknown>;
}

export class MockOrchestrator implements Orchestrator {
  async runTask(context: TaskContext): Promise<unknown> {
    return { type: 'task', context };
  }

  async runReview(context: TaskContext): Promise<unknown> {
    return { type: 'review', context };
  }

  async runEvaluation(context: TaskContext): Promise<unknown> {
    return { type: 'evaluation', context };
  }
}
