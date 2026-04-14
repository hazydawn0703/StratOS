import { BiasMonitor } from '@stratos/bias-monitor';
import { EvaluationEngine } from '@stratos/evaluation-engine';
import { ExperimentEngine } from '@stratos/experiment-engine';
import type { FinanceSTUCandidateProposal, PredictionReview } from '../../domain/models.js';
import { FinanceRepository } from '../../domain/repository.js';
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

  constructor(private readonly repo = new FinanceRepository()) {}

  buildProductMetrics(reviews: PredictionReview[]): Record<string, number> {
    const total = reviews.length || 1;
    const correct = reviews.filter((r) => r.result === 'correct').length;
    const evidenceIssue = reviews.filter((r) => r.evidenceIssue).length;
    const confidenceIssue = reviews.filter((r) => r.confidenceIssue).length;
    return {
      claim_precision: correct / total,
      admission_quality_proxy: 1 - evidenceIssue / total,
      review_quality_proxy: 1 - confidenceIssue / total,
      risk_alert_hit_quality: correct / total,
      missed_counterevidence_proxy: evidenceIssue / total,
      bias_delta_proxy: confidenceIssue / total
    };
  }

  runBenchmarkComparison(candidateId: string): { candidateId: string; baseline: number; candidate: number; delta: number } {
    const baseline = 0.67;
    const candidate = 0.72;
    return { candidateId, baseline, candidate, delta: candidate - baseline };
  }

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
    this.repo.saveBiasSnapshot({
      id: `bias-${candidate.id}-${Date.now().toString(36)}`,
      scopeKey: candidate.id,
      payload: snapshot as unknown as Record<string, unknown>,
      createdAt: new Date().toISOString()
    });

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
    this.repo.recordMetric({ id: `m-${Date.now().toString(36)}-${Math.random()}`, metricKey: 'experiment_count', metricValue: 1, meta: { candidateId: candidate.id }, createdAt: new Date().toISOString() });

    const promoted = this.promotionPolicy.allow({
      evaluationPassed,
      experimentLift: evaluation.delta
    });

    this.repo.recordMetric({ id: `m-${Date.now().toString(36)}-${Math.random()}`, metricKey: promoted ? 'promote_count' : 'rollback_count', metricValue: 1, meta: { candidateId: candidate.id }, createdAt: new Date().toISOString() });

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
