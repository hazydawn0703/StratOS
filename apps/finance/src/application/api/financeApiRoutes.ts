export interface FinanceApiRoute {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH';
  path: string;
  purpose: string;
}

export const financeApiRoutes: FinanceApiRoute[] = [
  { method: 'GET', path: '/api/finance/portfolio', purpose: 'list portfolio + holdings' },
  { method: 'POST', path: '/api/finance/portfolio', purpose: 'create or update portfolio' },
  { method: 'GET', path: '/api/finance/watchlist', purpose: 'list watchlist items' },
  { method: 'POST', path: '/api/finance/watchlist', purpose: 'create or update watchlist item' },
  { method: 'GET', path: '/api/finance/reports', purpose: 'list artifacts and report summaries' },
  { method: 'POST', path: '/api/finance/reports', purpose: 'generate report artifact' },
  { method: 'GET', path: '/api/finance/predictions', purpose: 'list admitted predictions' },
  { method: 'POST', path: '/api/finance/predictions/extract', purpose: 'extract + admit predictions from artifact' },
  { method: 'POST', path: '/api/finance/reviews/trigger', purpose: 'trigger time/event review' },
  { method: 'GET', path: '/api/finance/reviews', purpose: 'list prediction reviews' },
  { method: 'GET', path: '/api/finance/error-intelligence', purpose: 'list error patterns and candidate proposals' },
  { method: 'POST', path: '/api/finance/strategy-lab/evaluate', purpose: 'run evaluation policy' },
  { method: 'POST', path: '/api/finance/experiment-center/promote', purpose: 'run experiment and promotion gate' },
  { method: 'GET', path: '/api/finance/thesis-timeline', purpose: 'timeline of artifact -> prediction -> review' }
];
