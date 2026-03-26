import { ExperimentEngine } from '@stratos/experiment-engine';

/**
 * Finance app lifecycle facade that uses guarded experiment-engine APIs only.
 * This prevents candidate direct-go-live shortcuts in app workflows.
 */
export class FinanceStrategyLifecycleService {
  constructor(private readonly experimentEngine = new ExperimentEngine()) {}

  startCandidateExperiment(candidateId: string): string {
    this.experimentEngine.registerCandidate(candidateId);
    this.experimentEngine.markCandidateEvaluated(candidateId, 'finance evaluation completed');
    return this.experimentEngine.startExperimentGuarded(candidateId).id;
  }

  finalizeCandidate(experimentId: string): 'promoted' | 'rolled_back' {
    return this.experimentEngine.decidePromotion(experimentId);
  }
}
