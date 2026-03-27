import type {
  FinanceArtifact,
  FinancePrediction,
  FinanceErrorPattern,
  FinanceSTUCandidateProposal,
  Holding,
  Portfolio,
  PredictionOutcome,
  PredictionReview,
  WatchlistItem
} from './models.js';

class InMemoryStore {
  portfolios = new Map<string, Portfolio>();
  holdings = new Map<string, Holding>();
  watchlist = new Map<string, WatchlistItem>();
  artifacts = new Map<string, FinanceArtifact>();
  predictions = new Map<string, FinancePrediction>();
  outcomes = new Map<string, PredictionOutcome>();
  reviews = new Map<string, PredictionReview>();
  patterns = new Map<string, FinanceErrorPattern>();
  stuProposals = new Map<string, FinanceSTUCandidateProposal>();
}

const store = new InMemoryStore();

export class FinanceRepository {
  listPortfolios(): Portfolio[] {
    return [...store.portfolios.values()];
  }

  upsertPortfolio(portfolio: Portfolio): Portfolio {
    store.portfolios.set(portfolio.id, portfolio);
    return portfolio;
  }

  listHoldings(portfolioId: string): Holding[] {
    return [...store.holdings.values()].filter((h) => h.portfolioId === portfolioId);
  }

  upsertHolding(holding: Holding): Holding {
    store.holdings.set(holding.id, holding);
    return holding;
  }

  listWatchlist(): WatchlistItem[] {
    return [...store.watchlist.values()];
  }

  upsertWatchlistItem(item: WatchlistItem): WatchlistItem {
    store.watchlist.set(item.id, item);
    return item;
  }

  saveArtifact(artifact: FinanceArtifact): FinanceArtifact {
    store.artifacts.set(artifact.id, artifact);
    return artifact;
  }

  listArtifacts(): FinanceArtifact[] {
    return [...store.artifacts.values()];
  }

  savePrediction(prediction: FinancePrediction): FinancePrediction {
    store.predictions.set(prediction.id, prediction);
    return prediction;
  }

  listPredictions(): FinancePrediction[] {
    return [...store.predictions.values()];
  }

  saveOutcome(outcome: PredictionOutcome): PredictionOutcome {
    store.outcomes.set(outcome.id, outcome);
    return outcome;
  }

  saveReview(review: PredictionReview): PredictionReview {
    store.reviews.set(review.id, review);
    return review;
  }

  listReviews(): PredictionReview[] {
    return [...store.reviews.values()];
  }

  savePattern(pattern: FinanceErrorPattern): FinanceErrorPattern {
    store.patterns.set(pattern.id, pattern);
    return pattern;
  }

  listPatterns(): FinanceErrorPattern[] {
    return [...store.patterns.values()];
  }

  saveSTUProposal(proposal: FinanceSTUCandidateProposal): FinanceSTUCandidateProposal {
    store.stuProposals.set(proposal.id, proposal);
    return proposal;
  }

  listSTUProposals(): FinanceSTUCandidateProposal[] {
    return [...store.stuProposals.values()];
  }
}
