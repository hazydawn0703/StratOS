export type ExperimentState = 'shadow' | 'canary' | 'partial' | 'full' | 'rolled_back' | 'promoted';

export interface ExperimentRecord {
  id: string;
  candidateId: string;
  state: ExperimentState;
  metrics: Array<Record<string, number>>;
}
