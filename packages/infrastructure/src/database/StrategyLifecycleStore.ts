export type StrategyLifecycleState =
  | 'candidate'
  | 'evaluated'
  | 'experimenting'
  | 'active'
  | 'rolled_back';

export interface StrategyLifecycleSnapshot {
  candidateId: string;
  state: StrategyLifecycleState;
  history: Array<{ at: string; state: StrategyLifecycleState; note?: string }>;
}

export interface StrategyLifecycleStore {
  save(snapshot: StrategyLifecycleSnapshot): void;
  get(candidateId: string): StrategyLifecycleSnapshot | undefined;
}

export class InMemoryStrategyLifecycleStore implements StrategyLifecycleStore {
  private readonly data = new Map<string, StrategyLifecycleSnapshot>();

  save(snapshot: StrategyLifecycleSnapshot): void {
    this.data.set(snapshot.candidateId, snapshot);
  }

  get(candidateId: string): StrategyLifecycleSnapshot | undefined {
    return this.data.get(candidateId);
  }
}
