/**
 * Finance app shell intentionally keeps only package-consumption wiring.
 * Domain pages, API handlers, and business logic are deferred.
 */
export const financeAppBootstrap = (): string => 'finance-shell-ready';
