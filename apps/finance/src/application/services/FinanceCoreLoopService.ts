import { ClaimExtractor } from '@stratos/claim-extractor';
import { ErrorUtilizationEngine } from '@stratos/error-utilization';
import { EvaluationEngine } from '@stratos/evaluation-engine';
import { ExperimentEngine } from '@stratos/experiment-engine';
import { ReviewEngine, type OutcomeRecord } from '@stratos/review-engine';

export interface FinanceCoreLoopInput {
  artifactId: string;
  artifactContent: string;
  taskType: string;
  outcome: OutcomeRecord;
}

export interface FinanceCoreLoopResult {
  claimId: string;
  reviewId: string;
  patternCount: number;
  evaluationRecommendation: 'promote' | 'hold';
  experimentId: string;
}

export class FinanceCoreLoopService {
  private readonly claimExtractor = new ClaimExtractor();
  private readonly reviewEngine = new ReviewEngine();
  private readonly errorUtilization = new ErrorUtilizationEngine();
  private readonly evaluationEngine = new EvaluationEngine();
  private readonly experimentEngine = new ExperimentEngine();

  async run(input: FinanceCoreLoopInput): Promise<FinanceCoreLoopResult> {
    const extraction = this.claimExtractor.extract({
      artifactId: input.artifactId,
      taskType: input.taskType,
      content: input.artifactContent
    });
    if (!extraction.ok || extraction.claims.length === 0) {
      throw new Error(extraction.error ?? 'claim extraction failed');
    }

    const claim = extraction.claims[0];
    const review = this.reviewEngine.review(claim, input.outcome);
    const patterns = this.errorUtilization.aggregate([review]);

    const evaluation = this.evaluationEngine.evaluateCandidateAgainstBaseline({
      candidateId: claim.claim_id,
      baselineId: 'baseline-default',
      candidateScore: review.result_label === 'confirmed' ? 1 : 0,
      baselineScore: 0,
      supportCount: patterns.length
    });

    await this.experimentEngine.registerCandidate(claim.claim_id);
    await this.experimentEngine.markCandidateEvaluated(claim.claim_id, evaluation.rationale);
    const experiment = await this.experimentEngine.startExperimentGuarded(claim.claim_id);

    return {
      claimId: claim.claim_id,
      reviewId: review.review_id,
      patternCount: patterns.length,
      evaluationRecommendation: evaluation.recommendation,
      experimentId: experiment.id
    };
  }
}
