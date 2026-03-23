import type { Prediction, Review } from '@stratos/shared-types';
import { detectBiasFromDiff } from './detection/detectBias.js';
import type { BiasAnalysisResult, BiasSnapshot } from './metrics/types.js';

export class BiasMonitor {
  computeSnapshot(predictions: Prediction[], _reviews: Review[], _windowType: string): BiasSnapshot {
    const bullish = predictions.filter((item) => item.thesisType === 'bullish').length;
    const cautious = predictions.filter((item) => item.thesisType === 'cautious').length;
    const total = Math.max(predictions.length, 1);
    const avg = predictions.reduce((sum, item) => sum + item.confidenceScore, 0) / total;

    return {
      bullishRatio: bullish / total,
      cautiousRatio: cautious / total,
      riskAlertRatio: 0,
      avgConfidenceScore: avg,
      confidenceStd: 0
    };
  }

  compareWindows(current: BiasSnapshot, baseline: BiasSnapshot): Record<string, number> {
    return {
      bullishRatio: current.bullishRatio - baseline.bullishRatio,
      cautiousRatio: current.cautiousRatio - baseline.cautiousRatio,
      riskAlertRatio: current.riskAlertRatio - baseline.riskAlertRatio,
      avgConfidenceScore: current.avgConfidenceScore - baseline.avgConfidenceScore,
      confidenceStd: current.confidenceStd - baseline.confidenceStd
    };
  }

  detectBias(snapshotDiff: Record<string, number>): BiasAnalysisResult {
    return detectBiasFromDiff(snapshotDiff);
  }
}
