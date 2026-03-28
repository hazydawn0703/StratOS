import { createServer } from 'node:http';
import { URL } from 'node:url';
import { FinancePagesRuntime } from '../application/ui/FinancePagesRuntime.js';
import { FinanceRouteHandlers } from '../application/http/FinanceRouteHandlers.js';

export class FinanceWebRuntime {
  private readonly pages = new FinancePagesRuntime();
  private readonly api = new FinanceRouteHandlers();

  start(port = 4310): { close: () => void } {
    const server = createServer(async (req, res) => {
      const method = (req.method ?? 'GET') as 'GET' | 'POST';
      const parsed = new URL(req.url ?? '/', 'http://localhost');
      if (parsed.pathname.startsWith('/api/finance')) {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', async () => {
          const response = await this.api.handle({
            method,
            path: parsed.pathname,
            query: Object.fromEntries(parsed.searchParams.entries()),
            body: body ? (JSON.parse(body) as Record<string, unknown>) : undefined
          });
          res.statusCode = response.status;
          res.setHeader('content-type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(response.body));
        });
        return;
      }

      const viewMap: Record<string, Parameters<FinancePagesRuntime['render']>[0]> = {
        '/finance/dashboard': 'Dashboard',
        '/finance/portfolio': 'Portfolio',
        '/finance/watchlist': 'Watchlist',
        '/finance/reports': 'Reports',
        '/finance/predictions': 'Predictions',
        '/finance/reviews': 'Reviews',
        '/finance/errors': 'Error Intelligence',
        '/finance/strategy-lab': 'Strategy Lab',
        '/finance/experiments': 'Experiment Center',
        '/finance/timeline': 'Thesis Timeline'
      };
      const page = viewMap[parsed.pathname];
      if (!page) {
        res.statusCode = 404;
        res.end('not found');
        return;
      }
      res.statusCode = 200;
      res.setHeader('content-type', 'text/html; charset=utf-8');
      res.end(this.pages.render(page, Object.fromEntries(parsed.searchParams.entries())));
    });

    server.listen(port, '0.0.0.0');
    return { close: () => server.close() };
  }
}

if (process.env.FINANCE_WEB_AUTOSTART === '1') {
  new FinanceWebRuntime().start(Number(process.env.FINANCE_WEB_PORT ?? 4310));
}
