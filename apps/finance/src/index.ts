import { FinanceStrategyRuntime } from './composition/FinanceStrategyRuntime.js';
import { createFinanceMockSTU } from './composition/mockSTU.js';

/**
 * Finance app shell bootstrap for phase-based development.
 * No page/API/business implementation is introduced here.
 */
export const financeAppBootstrap = (): FinanceStrategyRuntime => {
  const runtime = new FinanceStrategyRuntime();
  runtime.registerSTU(createFinanceMockSTU());
  return runtime;
};

/**
 * Compatibility helper retained for branch-merge conflict resolution when
 * previous branches still expect a string bootstrap signal.
 */
export const financeAppBootstrapStatus = (): string => 'finance-shell-ready';

export * from './application/types.js';
export * from './composition/FinanceStrategyRuntime.js';
