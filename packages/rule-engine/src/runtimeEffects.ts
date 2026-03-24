export interface RuntimeEffects {
  confidenceCap?: number;
  confidencePenalty?: number;
  requiredFields?: string[];
  requiredNotes?: string[];
  retryPolicy?: { maxRetries: number };
  abortReason?: string;
  routingHints?: string[];
}

export interface RuleExecutionLog {
  ruleId: string;
  applied: boolean;
  message: string;
}
