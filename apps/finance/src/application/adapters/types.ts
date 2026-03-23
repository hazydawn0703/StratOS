export interface FinanceTaskRequest {
  thesisType: string;
  riskLevel: 'low' | 'medium' | 'high';
  ticker?: string;
  metadata?: Record<string, unknown>;
}

export interface FinanceTaskResponse {
  taskType: string;
  provider: string;
  model: string;
  promptCount: number;
  ruleLogCount: number;
  hasError: boolean;
}
