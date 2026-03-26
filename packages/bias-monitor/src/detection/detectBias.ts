import type { BiasAlert, BiasSnapshot } from '../metrics/types.js';

export const detectBiasFromSnapshot = (snapshot: BiasSnapshot): BiasAlert => {
  const reasons: string[] = [];
  if (snapshot.behavior.confidenceDistributionSkew > 0.25) reasons.push('confidence_skew_high');
  if (snapshot.behavior.rejectionRate > 0.4) reasons.push('rejection_rate_high');
  if (snapshot.outcome.severeErrorRatio > 0.2) reasons.push('severe_error_ratio_high');
  if (snapshot.outcome.rollbackRate > 0.15) reasons.push('rollback_rate_high');

  const severity: BiasAlert['severity'] =
    reasons.length >= 3 ? 'high' : reasons.length >= 1 ? 'medium' : 'low';

  return {
    hasBiasRisk: reasons.length > 0,
    reasons,
    severity
  };
};
