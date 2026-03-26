import { BiasMonitor } from '@stratos/bias-monitor';
import { ClaimExtractor } from '@stratos/claim-extractor';
import { ErrorUtilizationEngine, type STUCandidate } from '@stratos/error-utilization';
import { EvaluationEngine } from '@stratos/evaluation-engine';
import { ExperimentEngine } from '@stratos/experiment-engine';
import { ReviewEngine, type OutcomeRecord } from '@stratos/review-engine';

export interface FinanceSTUInput {
  artifactId: string;
  artifactContent: string;
  taskType: string;
  outcome: OutcomeRecord;
}

export interface FinanceSTUResult {
  candidate: STUCandidate;
  gateStatus: 'needs_bias_review' | 'ready_for_evaluation';
  evaluationRecommendation: 'promote' | 'hold';
  experimentCandidate: {
    candidate_id: string;
    gate_status: 'needs_bias_review' | 'ready_for_evaluation';
    evaluation_recommendation: 'promote' | 'hold';
  };
}

export class FinanceSTUCandidateService {
  private readonly claimExtractor = new ClaimExtractor();
  private readonly reviewEngine = new ReviewEngine();
  private readonly errorUtilization = new ErrorUtilizationEngine();
  private readonly evaluationEngine = new EvaluationEngine();
  private readonly biasMonitor = new BiasMonitor();
  private readonly experimentEngine = new ExperimentEngine();

  async run(input: FinanceSTUInput): Promise<FinanceSTUResult> {
    const extraction = this.claimExtractor.extract({
      artifactId: input.artifactId,
      taskType: input.taskType,
      content: input.artifactContent
    });
    if (!extraction.ok || extraction.claims.length === 0) {
      throw new Error(extraction.error ?? 'claim extraction failed');
    }

    const reviews = extraction.claims.map((claim) =>
      this.reviewEngine.review(claim, { ...input.outcome, claim_id: claim.claim_id })
    );
    const review = reviews[0];
    const pattern = this.errorUtilization.aggregate(reviews)[0];
    const validated = this.errorUtilization.validate(pattern);
    const promoted = this.errorUtilization.promoteToSTUCandidate(validated);
    if (!promoted.candidate) {
      throw new Error('candidate not promotable from current error pattern state');
    }

    const biasSnapshot = this.biasMonitor.computeSnapshot({
      confidenceScores: [0.6],
      rejectionFlags: [review.result_label === 'rejected'],
      riskHints: [review.severity === 'high'],
      claimTiltValues: [0.1],
      reviewPassFlags: [review.result_label === 'confirmed'],
      errorDirectionValues: [review.result_label === 'rejected' ? 1 : 0],
      severeErrorFlags: [review.severity === 'high'],
      rollbackFlags: [false]
    });

    const gate = this.biasMonitor.gateCandidate(promoted.candidate.candidate_id, biasSnapshot);
    const evaluation = this.evaluationEngine.evaluateCandidateAgainstBaseline({
      candidateId: promoted.candidate.candidate_id,
      baselineId: 'baseline-default',
      candidateScore: gate.gate_status === 'ready_for_evaluation' ? 0.7 : 0.4,
      baselineScore: 0.5,
      supportCount: promoted.candidate.review_refs.length
    });

    await this.experimentEngine.registerCandidate(promoted.candidate.candidate_id);
    await this.experimentEngine.markCandidateEvaluated(promoted.candidate.candidate_id, evaluation.rationale);

    return {
      candidate: promoted.candidate,
      gateStatus: gate.gate_status,
      evaluationRecommendation: evaluation.recommendation,
      experimentCandidate: {
        candidate_id: promoted.candidate.candidate_id,
        gate_status: gate.gate_status,
        evaluation_recommendation: evaluation.recommendation
      }
    };
  }
}
