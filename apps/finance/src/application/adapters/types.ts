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

export interface AdapterValidationIssue {
  field: string;
  code: 'required' | 'format' | 'range';
  message: string;
}

export interface MappedExecutionResult {
  ok: boolean;
  response?: FinanceTaskResponse;
  issues: AdapterValidationIssue[];
}
