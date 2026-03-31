import test from 'node:test';
import assert from 'node:assert/strict';
import { FinancePagesRuntime } from '../apps/finance/dist/application/ui/FinancePagesRuntime.js';

test('finance pages runtime renders all required pages', () => {
  const runtime = new FinancePagesRuntime();
  const pages = [
    'Dashboard',
    'Portfolio',
    'Watchlist',
    'Reports',
    'Predictions',
    'Reviews',
    'Error Intelligence',
    'Strategy Lab',
    'Experiment Center',
    'Thesis Timeline'
  ];

  for (const page of pages) {
    const html = runtime.render(page, { ticker: 'NVDA', portfolioId: 'p1' });
    assert.ok(html.includes(`<h1>${page}</h1>`));
  }
});
