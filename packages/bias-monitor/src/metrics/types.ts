export interface BiasSnapshot {
  bullishRatio: number;
  cautiousRatio: number;
  riskAlertRatio: number;
  avgConfidenceScore: number;
  confidenceStd: number;
  bullishAccuracy?: number;
  cautiousAccuracy?: number;
  riskAlertAccuracy?: number;
}

export interface BiasAnalysisResult {
  hasBiasRisk: boolean;
  reasons: string[];
  snapshotDiff: Record<string, number>;
}
