import {
  DatabaseStrategyLifecycleStore,
  type StrategyLifecycleSnapshot,
  type StrategyLifecycleState,
  type StrategyLifecycleStore
} from '@stratos/infrastructure';

export type { StrategyLifecycleState, StrategyLifecycleSnapshot, StrategyLifecycleStore };

const allowedTransitions: Record<StrategyLifecycleState, StrategyLifecycleState[]> = {
  candidate: ['evaluated', 'rolled_back', 'deprecated'],
  evaluated: ['experimenting', 'rolled_back', 'deprecated'],
  experimenting: ['active', 'rolled_back', 'deprecated'],
  active: ['rolled_back', 'deprecated'],
  rolled_back: ['deprecated'],
  deprecated: []
};

export class StrategyLifecycleGuard {
  constructor(private readonly store: StrategyLifecycleStore = new DatabaseStrategyLifecycleStore()) {}

  async registerCandidate(candidateId: string): Promise<StrategyLifecycleSnapshot> {
    const snapshot: StrategyLifecycleSnapshot = {
      candidateId,
      state: 'candidate',
      history: [{ at: new Date().toISOString(), state: 'candidate' }]
    };
    await this.store.save(snapshot);
    return snapshot;
  }

  markEvaluated(candidateId: string, note = 'evaluation completed'): Promise<StrategyLifecycleSnapshot> {
    return this.transition(candidateId, 'evaluated', note);
  }

  markExperimenting(candidateId: string, note = 'experiment started'): Promise<StrategyLifecycleSnapshot> {
    return this.transition(candidateId, 'experimenting', note);
  }

  activate(candidateId: string, note = 'promoted to active'): Promise<StrategyLifecycleSnapshot> {
    return this.transition(candidateId, 'active', note);
  }

  rollback(candidateId: string, note = 'rolled back'): Promise<StrategyLifecycleSnapshot> {
    return this.transition(candidateId, 'rolled_back', note);
  }

  deprecate(candidateId: string, note = 'deprecated'): Promise<StrategyLifecycleSnapshot> {
    return this.transition(candidateId, 'deprecated', note);
  }

  getSnapshot(candidateId: string): Promise<StrategyLifecycleSnapshot | undefined> {
    return this.store.get(candidateId);
  }

  private async transition(
    candidateId: string,
    nextState: StrategyLifecycleState,
    note?: string
  ): Promise<StrategyLifecycleSnapshot> {
    const current = await this.store.get(candidateId);
    if (!current) {
      throw new Error(`Candidate ${candidateId} is not registered.`);
    }

    const allowed = allowedTransitions[current.state];
    if (!allowed.includes(nextState)) {
      throw new Error(
        `Invalid lifecycle transition for ${candidateId}: ${current.state} -> ${nextState}.`
      );
    }

    const updated: StrategyLifecycleSnapshot = {
      ...current,
      state: nextState,
      history: [...current.history, { at: new Date().toISOString(), state: nextState, note }]
    };
    await this.store.save(updated);
    return updated;
  }
}
