import {
  InMemoryStrategyLifecycleStore,
  type StrategyLifecycleSnapshot,
  type StrategyLifecycleState,
  type StrategyLifecycleStore
} from '@stratos/infrastructure';

export type { StrategyLifecycleState, StrategyLifecycleSnapshot, StrategyLifecycleStore };

const allowedTransitions: Record<StrategyLifecycleState, StrategyLifecycleState[]> = {
  candidate: ['evaluated', 'rolled_back'],
  evaluated: ['experimenting', 'rolled_back'],
  experimenting: ['active', 'rolled_back'],
  active: ['rolled_back'],
  rolled_back: []
};

export class StrategyLifecycleGuard {
  constructor(private readonly store: StrategyLifecycleStore = new InMemoryStrategyLifecycleStore()) {}

  registerCandidate(candidateId: string): StrategyLifecycleSnapshot {
    const snapshot: StrategyLifecycleSnapshot = {
      candidateId,
      state: 'candidate',
      history: [{ at: new Date().toISOString(), state: 'candidate' }]
    };
    this.store.save(snapshot);
    return snapshot;
  }

  markEvaluated(candidateId: string, note = 'evaluation completed'): StrategyLifecycleSnapshot {
    return this.transition(candidateId, 'evaluated', note);
  }

  markExperimenting(candidateId: string, note = 'experiment started'): StrategyLifecycleSnapshot {
    return this.transition(candidateId, 'experimenting', note);
  }

  activate(candidateId: string, note = 'promoted to active'): StrategyLifecycleSnapshot {
    return this.transition(candidateId, 'active', note);
  }

  rollback(candidateId: string, note = 'rolled back'): StrategyLifecycleSnapshot {
    return this.transition(candidateId, 'rolled_back', note);
  }

  getSnapshot(candidateId: string): StrategyLifecycleSnapshot | undefined {
    return this.store.get(candidateId);
  }

  private transition(
    candidateId: string,
    nextState: StrategyLifecycleState,
    note?: string
  ): StrategyLifecycleSnapshot {
    const current = this.store.get(candidateId);
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
    this.store.save(updated);
    return updated;
  }
}
