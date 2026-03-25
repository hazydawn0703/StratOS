export interface BiasSummary {
  avgConfidenceScore: number;
}

export const BiasSummaryCard = (snapshot: BiasSummary): string =>
  `BiasSummary:${snapshot.avgConfidenceScore.toFixed(2)}`;
