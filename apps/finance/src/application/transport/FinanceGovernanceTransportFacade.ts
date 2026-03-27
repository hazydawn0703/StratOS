import { FinancePromotionService } from '../services/FinancePromotionService.js';

export interface GovernanceRunSummaryRequest {
  runId: string;
}

export interface GovernanceRunSummaryListRequest {
  from?: string;
  to?: string;
}

export interface GovernanceRequeueRequest {
  messageId: string;
}

export class FinanceGovernanceTransportFacade {
  constructor(private readonly service = new FinancePromotionService()) {}

  async getRunSummary(
    request: GovernanceRunSummaryRequest
  ): Promise<{ statusCode: 200 | 404; runId: string; summary: string | null }> {
    const summary = this.service.getRunSummary(request.runId);
    if (!summary) {
      return { statusCode: 404, runId: request.runId, summary: null };
    }
    return { statusCode: 200, runId: request.runId, summary };
  }

  async listRunSummaries(
    request?: GovernanceRunSummaryListRequest
  ): Promise<{ statusCode: 200; items: Array<{ run_id: string; summary: string; indexed_at: string }> }> {
    return {
      statusCode: 200,
      items: this.service.listRunSummaries(request)
    };
  }

  async listDeadLetterAlerts(): Promise<{
    statusCode: 200;
    items: Array<{ alert_id: string; run_id: string; candidate_id: string }>;
  }> {
    return {
      statusCode: 200,
      items: this.service.listDeadLetterAlerts()
    };
  }

  async requeueDeadLetterAlert(
    request: GovernanceRequeueRequest
  ): Promise<{ statusCode: 200 | 404; messageId: string; requeued: boolean }> {
    const requeued = this.service.requeueDeadLetterAlert(request.messageId);
    return {
      statusCode: requeued ? 200 : 404,
      messageId: request.messageId,
      requeued
    };
  }
}
