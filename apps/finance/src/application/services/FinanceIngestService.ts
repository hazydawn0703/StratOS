import {
  FinanceRepository,
  type FinanceIngestedOutcome,
  type FinanceReviewCorrection,
  type FinanceSourceDocument
} from '../../domain/repository.js';

export class FinanceIngestService {
  constructor(private readonly repo = new FinanceRepository()) {}

  ingestSourceDocument(input: Omit<FinanceSourceDocument, 'id' | 'createdAt'>): FinanceSourceDocument {
    const doc: FinanceSourceDocument = {
      id: `src-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      ...input
    };
    return this.repo.saveSourceDocument(doc);
  }

  ingestOutcome(input: Omit<FinanceIngestedOutcome, 'id' | 'createdAt'>): FinanceIngestedOutcome {
    const outcome: FinanceIngestedOutcome = {
      id: `ing-out-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      ...input
    };
    return this.repo.saveIngestedOutcome(outcome);
  }

  correctReview(input: Omit<FinanceReviewCorrection, 'id' | 'createdAt'>): FinanceReviewCorrection {
    const correction: FinanceReviewCorrection = {
      id: `corr-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      ...input
    };
    return this.repo.saveReviewCorrection(correction);
  }
}
