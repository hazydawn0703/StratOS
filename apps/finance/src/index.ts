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

export * from './application/types.js';
export * from './composition/FinanceStrategyRuntime.js';
