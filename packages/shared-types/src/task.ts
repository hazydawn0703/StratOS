export interface TaskContext {
  taskType: string;
  thesisType: string;
  riskLevel: 'low' | 'medium' | 'high';
  ticker?: string;
  metadata?: Record<string, unknown>;
}
