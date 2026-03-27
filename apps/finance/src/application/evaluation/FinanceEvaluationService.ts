import { BiasMonitor } from '@stratos/bias-monitor';
import { EvaluationEngine } from '@stratos/evaluation-engine';
import { ExperimentEngine } from '@stratos/experiment-engine';
import type { FinanceSTUCandidateProposal, PredictionReview } from '../../domain/models.js';
import {
  BiasAlertPolicy,
  EvaluationPolicy,
  PromotionPolicy,
  RoutingDecisionPolicy
} from '../policies/financePolicies.js';

export interface FinanceExperimentResult {
  candidateId: string;
  evaluationPassed: boolean;
  promoted: boolean;
  experimentId: string;
  route: string;
  biasTriggered: boolean;
}

export class FinanceEvaluationService {
  private readonly evaluationEngine = new EvaluationEngine();
  private readonly experimentEngine = new ExperimentEngine();
  private readonly biasMonitor = new BiasMonitor();

  private readonly evaluationPolicy = new EvaluationPolicy();
  private readonly promotionPolicy = new PromotionPolicy();
  private readonly routingPolicy = new RoutingDecisionPolicy();
  private readonly biasPolicy = new BiasAlertPolicy();

  async run(
    candidate: FinanceSTUCandidateProposal,
    reviews: PredictionReview[],
    riskLevel: 'low' | 'medium' | 'high'
  ): Promise<FinanceExperimentResult> {
    const bias = this.biasPolicy.check(reviews);
    const route = this.routingPolicy.routeForRisk(riskLevel);

    const snapshot = this.biasMonitor.computeSnapshot({
      confidenceScores: reviews.map((r) => (r.confidenceIssue ? 0.8 : 0.5)),
      rejectionFlags: reviews.map((r) => r.result === 'incorrect'),
      riskHints: reviews.map((r) => r.result !== 'correct'),
      claimTiltValues: reviews.map((r) => (r.directionIssue ? 0.8 : 0.1)),
      reviewPassFlags: reviews.map((r) => r.result === 'correct'),
      errorDirectionValues: reviews.map((r) => (r.directionIssue ? 1 : 0)),
      severeErrorFlags: reviews.map((r) => r.result === 'incorrect'),
      rollbackFlags: [false]
    });

    const gate = this.biasMonitor.gateCandidate(candidate.id, snapshot);
    const evaluation = this.evaluationEngine.evaluateCandidateAgainstBaseline({
      candidateId: candidate.id,
      baselineId: 'finance-baseline-v1',
      candidateScore: gate.gate_status === 'ready_for_evaluation' ? 0.72 : 0.48,
      baselineScore: 0.67,
      supportCount: reviews.length
    });
    const evaluationPassed = this.evaluationPolicy.accept(evaluation.delta + 0.5);

    await this.experimentEngine.registerCandidate(candidate.id);
    await this.experimentEngine.markCandidateEvaluated(candidate.id, evaluation.rationale);
    const experiment = await this.experimentEngine.startExperimentGuarded(candidate.id);

    const promoted = this.promotionPolicy.allow({
      evaluationPassed,
      experimentLift: evaluation.delta
    });

    return {
      candidateId: candidate.id,
      evaluationPassed,
      promoted,
      experimentId: experiment.id,
      route,
      biasTriggered: bias.triggered
    };
  }
}
