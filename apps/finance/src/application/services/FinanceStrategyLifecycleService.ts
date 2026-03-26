import { ExperimentEngine } from '@stratos/experiment-engine';

/**
 * Finance app lifecycle facade that uses guarded experiment-engine APIs only.
 * This prevents candidate direct-go-live shortcuts in app workflows.
 */
export class FinanceStrategyLifecycleService {
  constructor(private readonly experimentEngine = new ExperimentEngine()) {}

  async startCandidateExperiment(candidateId: string): Promise<string> {
    await this.experimentEngine.registerCandidate(candidateId);
    await this.experimentEngine.markCandidateEvaluated(candidateId, 'finance evaluation completed');
    return (await this.experimentEngine.startExperimentGuarded(candidateId)).id;
  }

  finalizeCandidate(experimentId: string): Promise<'promoted' | 'rolled_back'> {
    return this.experimentEngine.decidePromotion(experimentId);
  }
}
