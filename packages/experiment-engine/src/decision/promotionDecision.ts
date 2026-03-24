import type { ExperimentRecord } from '../types.js';

export const decidePromotionState = (record: ExperimentRecord): 'promoted' | 'rolled_back' => {
  const latest = record.metrics.at(-1);
  if (!latest) return 'rolled_back';
  return (latest.actionableScore ?? 0) >= 0.6 ? 'promoted' : 'rolled_back';
};
