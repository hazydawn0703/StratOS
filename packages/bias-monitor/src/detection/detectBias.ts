import type { BiasAnalysisResult } from '../metrics/types.js';

export const detectBiasFromDiff = (snapshotDiff: Record<string, number>): BiasAnalysisResult => {
  const reasons: string[] = [];
  if ((snapshotDiff.bullishRatio ?? 0) > 0.2) reasons.push('bullish_ratio_jump');
  if ((snapshotDiff.avgConfidenceScore ?? 0) > 0.15) reasons.push('confidence_jump');
  return {
    hasBiasRisk: reasons.length > 0,
    reasons,
    snapshotDiff
  };
};
