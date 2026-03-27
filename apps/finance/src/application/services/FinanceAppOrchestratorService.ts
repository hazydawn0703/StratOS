import { FinanceArtifactService } from '../artifacts/FinanceArtifactService.js';
import { FinanceEvaluationService } from '../evaluation/FinanceEvaluationService.js';
import { FinanceErrorIntelligenceService } from '../error-intelligence/FinanceErrorIntelligenceService.js';
import { financeAppConfig } from '../config/financeAppConfig.js';
import { FinancePredictionService } from '../predictions/FinancePredictionService.js';
import { FinanceReviewService } from '../reviews/FinanceReviewService.js';
import type { ArtifactType, FinanceSTUCandidateProposal } from '../../domain/models.js';

export interface FinanceEndToEndInput {
  artifactType: ArtifactType;
  title: string;
  body: string;
  ticker?: string;
  riskLevel: 'low' | 'medium' | 'high';
  activeSTUContext?: string[];
}

export interface FinanceEndToEndResult {
  artifactId: string;
  admittedPredictionIds: string[];
  reviewIds: string[];
  proposalIds: string[];
  experimentIds: string[];
}

export class FinanceAppOrchestratorService {
  private readonly artifactService = new FinanceArtifactService();
  private readonly predictionService = new FinancePredictionService();
  private readonly reviewService = new FinanceReviewService();
  private readonly errorIntel = new FinanceErrorIntelligenceService();
  private readonly evaluationService = new FinanceEvaluationService();

  async runMockTask(input: FinanceEndToEndInput): Promise<FinanceEndToEndResult> {
    const optimizedBody = [input.body, ...(input.activeSTUContext ?? []).map((x) => `STU_HINT:${x}`)].join('\n');
    const artifact = this.artifactService.generate({
      taskType:
        input.artifactType === 'daily_brief'
          ? 'daily_brief_generation'
          : input.artifactType === 'weekly_review'
            ? 'weekly_portfolio_review'
            : input.artifactType === 'stock_deep_dive'
              ? 'stock_deep_dive'
              : 'risk_alert_generation',
      artifactType: input.artifactType,
      title: input.title,
      body: optimizedBody,
      ticker: input.ticker,
      evidence: ['mock_market_data', `route=${financeAppConfig.defaultTaskRoute.daily_brief_generation}`]
    });

    const extracted = this.predictionService.extractFromArtifact(artifact);
    const reviewIds: string[] = [];

    for (const prediction of extracted.admitted) {
      const outcome = this.reviewService.registerOutcome({
        predictionId: prediction.id,
        outcomeLabel: 'partial',
        evidence: 'Mock outcome evidence for loop closure'
      });
      const review = this.reviewService.reviewPrediction(prediction, outcome);
      reviewIds.push(review.id);
    }

    const reviews = this.reviewService.listReviews();
    const patterns = this.errorIntel.aggregatePatterns(reviews);
    const proposals = await this.errorIntel.proposeSTUCandidates(patterns);

    const experimentIds: string[] = [];
    for (const proposal of proposals) {
      const result = await this.evaluationService.run(proposal, reviews, input.riskLevel);
      experimentIds.push(result.experimentId);
    }

    return {
      artifactId: artifact.id,
      admittedPredictionIds: extracted.admitted.map((p) => p.id),
      reviewIds,
      proposalIds: proposals.map((p) => p.id),
      experimentIds
    };
  }
}
