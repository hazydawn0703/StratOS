import { FinanceStrategyRuntime } from '../composition/FinanceStrategyRuntime.js';
import { createFinanceMockSTU } from '../composition/mockSTU.js';

/**
 * Phase runtime bootstrap kept outside index.ts to avoid merge hotspot with main branch.
 */
export const financeRuntimeBootstrap = (): FinanceStrategyRuntime => {
  const runtime = new FinanceStrategyRuntime();
  runtime.registerSTU(createFinanceMockSTU());
  return runtime;
};
