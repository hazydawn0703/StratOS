import { FinanceStrategyRuntime } from './composition/FinanceStrategyRuntime.js';
import { createFinanceMockSTU } from './composition/mockSTU.js';

/**
 * Keep this legacy shell signal stable so merges with branches expecting
 * a string bootstrap remain conflict-free.
 */
export const financeAppBootstrap = (): string => 'finance-shell-ready';

/**
 * Runtime bootstrap used by phase-continuation work.
 * No page/API/business implementation is introduced here.
 */
export const financeRuntimeBootstrap = (): FinanceStrategyRuntime => {
  const runtime = new FinanceStrategyRuntime();
  runtime.registerSTU(createFinanceMockSTU());
  return runtime;
};

export * from './application/types.js';
export * from './composition/FinanceStrategyRuntime.js';
