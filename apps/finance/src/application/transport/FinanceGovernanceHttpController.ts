import { FinanceGovernanceTransportFacade } from './FinanceGovernanceTransportFacade.js';

export type GovernanceHttpMethod = 'GET' | 'POST';

export interface GovernanceHttpRequest {
  method: GovernanceHttpMethod;
  path: string;
  query?: Record<string, string | undefined>;
  body?: Record<string, unknown>;
}

export interface GovernanceHttpResponse {
  statusCode: number;
  body: Record<string, unknown>;
}

export class FinanceGovernanceHttpController {
  constructor(private readonly facade = new FinanceGovernanceTransportFacade()) {}

  async handle(request: GovernanceHttpRequest): Promise<GovernanceHttpResponse> {
    if (request.method === 'GET' && request.path === '/governance/run-summary') {
      const runId = request.query?.runId;
      if (!runId) return { statusCode: 400, body: { error: 'runId is required' } };
      const result = await this.facade.getRunSummary({ runId });
      return { statusCode: result.statusCode, body: result };
    }

    if (request.method === 'GET' && request.path === '/governance/run-summaries') {
      const result = await this.facade.listRunSummaries({
        from: request.query?.from,
        to: request.query?.to,
        sort: request.query?.sort as 'indexed_at_asc' | 'indexed_at_desc' | undefined,
        offset: request.query?.offset ? Number(request.query.offset) : undefined,
        limit: request.query?.limit ? Number(request.query.limit) : undefined
      });
      return { statusCode: result.statusCode, body: result };
    }

    if (request.method === 'GET' && request.path === '/governance/dead-letters') {
      const result = await this.facade.listDeadLetterAlerts();
      return { statusCode: result.statusCode, body: result };
    }

    if (request.method === 'POST' && request.path === '/governance/dead-letters/requeue') {
      const messageId = String(request.body?.messageId ?? '');
      if (!messageId) return { statusCode: 400, body: { error: 'messageId is required' } };
      const result = await this.facade.requeueDeadLetterAlert({ messageId });
      return { statusCode: result.statusCode, body: result };
    }

    return { statusCode: 404, body: { error: 'not found' } };
  }
}
