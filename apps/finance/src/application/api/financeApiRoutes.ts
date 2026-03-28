export interface FinanceApiRoute {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH';
  path: string;
  purpose: string;
}

export const financeApiRoutes: FinanceApiRoute[] = [
  { method: 'GET', path: '/api/finance/portfolios', purpose: 'list portfolios + detail' },
  { method: 'POST', path: '/api/finance/portfolios', purpose: 'create or update portfolio' },
  { method: 'GET', path: '/api/finance/holdings', purpose: 'list holdings by portfolio' },
  { method: 'POST', path: '/api/finance/holdings', purpose: 'create or update holding' },
  { method: 'GET', path: '/api/finance/watchlist', purpose: 'list watchlist items' },
  { method: 'POST', path: '/api/finance/watchlist', purpose: 'create or update watchlist item' },
  { method: 'GET', path: '/api/finance/reports', purpose: 'list report artifacts' },
  { method: 'POST', path: '/api/finance/reports', purpose: 'create report artifact' },
  { method: 'GET', path: '/api/finance/predictions', purpose: 'list predictions' },
  { method: 'POST', path: '/api/finance/predictions', purpose: 'extract predictions from artifact' },
  { method: 'GET', path: '/api/finance/reviews', purpose: 'list reviews' },
  { method: 'GET', path: '/api/finance/errors/*', purpose: 'list error patterns' },
  { method: 'GET', path: '/api/finance/candidates/*', purpose: 'list candidate proposals' },
  { method: 'GET', path: '/api/finance/bias/*', purpose: 'list bias snapshots' },
  { method: 'GET', path: '/api/finance/timeline', purpose: 'timeline query with filters and paging' },
  { method: 'GET', path: '/api/finance/strategy-lab', purpose: 'baseline/candidate comparison and benchmark views' },
  { method: 'GET', path: '/api/finance/experiments', purpose: 'experiment center summary and recommendations' },
  { method: 'GET', path: '/api/finance/metrics', purpose: 'local observability metrics' },
  { method: 'POST', path: '/api/finance/replay/stu-effect/run', purpose: 'run active STU replay proof' },
  { method: 'GET', path: '/api/finance/replay/stu-effect', purpose: 'list replay proof entries' }
];
