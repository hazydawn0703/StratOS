import { ClaimExtractor } from '@stratos/claim-extractor';
import { FinanceRepository } from '../../domain/repository.js';
import type { FinanceArtifact, FinancePrediction } from '../../domain/models.js';
import { ClaimAdmissionPolicy } from '../policies/financePolicies.js';

export interface PredictionExtractionResult {
  admitted: FinancePrediction[];
  rejected: Array<{ text: string; reasons: string[] }>;
}

export class FinancePredictionService {
  private readonly extractor = new ClaimExtractor();
  private readonly admissionPolicy = new ClaimAdmissionPolicy();

  constructor(private readonly repo = new FinanceRepository()) {}

  extractFromArtifact(artifact: FinanceArtifact): PredictionExtractionResult {
    const extraction = this.extractor.extract({
      artifactId: artifact.id,
      taskType: artifact.taskType,
      content: artifact.body
    });
    if (!extraction.ok) {
      return { admitted: [], rejected: [{ text: artifact.body, reasons: [extraction.error ?? 'extract_failed'] }] };
    }

    const admitted: FinancePrediction[] = [];
    const rejected: Array<{ text: string; reasons: string[] }> = [];

    for (const claim of extraction.claims) {
      const draft: Omit<FinancePrediction, 'id' | 'admittedAt'> = {
        artifactId: artifact.id,
        type: 'thesis',
        ticker: artifact.ticker,
        direction: this.inferDirection(claim.claim_text),
        horizonDays: 30,
        confidence: this.inferConfidence(claim.claim_text),
        thesis: claim.claim_text,
        triggerType: 'time_based',
        triggerAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        evidence: artifact.evidence.length > 0 ? artifact.evidence : ['artifact_body']
      };

      const admission = this.admissionPolicy.admit(draft);
      if (!admission.ok) {
        rejected.push({ text: claim.claim_text, reasons: admission.reasons });
        continue;
      }

      const prediction: FinancePrediction = {
        ...draft,
        id: `pred-${claim.claim_id}`,
        admittedAt: new Date().toISOString()
      };
      admitted.push(this.repo.savePrediction(prediction));
    }

    this.repo.recordMetric({ id: `m-${Date.now().toString(36)}-${Math.random()}`, metricKey: 'claim_extraction_count', metricValue: admitted.length, meta: { rejected: rejected.length }, createdAt: new Date().toISOString() });
    return { admitted, rejected };
  }


  private inferDirection(text: string): 'bullish' | 'bearish' | 'neutral' {
    const normalized = text.toLowerCase();
    if (/(drop|decline|downside|risk)/.test(normalized)) return 'bearish';
    if (/(grow|upside|accelerate|beat)/.test(normalized)) return 'bullish';
    return 'neutral';
  }

  private inferConfidence(text: string): number {
    const normalized = text.toLowerCase();
    if (/(will|must|definitely|certain)/.test(normalized)) return 0.72;
    if (/(may|might|could)/.test(normalized)) return 0.58;
    return 0.61;
  }
  listPredictions(): FinancePrediction[] {
    return this.repo.listPredictions();
  }
}
