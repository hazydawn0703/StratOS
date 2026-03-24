import type { FinanceTaskRequest, AdapterValidationIssue } from './types.js';

export const validateTaskRequest = (request: FinanceTaskRequest): AdapterValidationIssue[] => {
  const issues: AdapterValidationIssue[] = [];

  if (!request.thesisType || request.thesisType.trim().length === 0) {
    issues.push({ field: 'thesisType', code: 'required', message: 'thesisType is required.' });
  }

  if (request.ticker && !/^[A-Z0-9.-]{1,10}$/.test(request.ticker)) {
    issues.push({ field: 'ticker', code: 'format', message: 'ticker format is invalid.' });
  }

  return issues;
};

export interface ValidationResult {
  ok: boolean;
  issues: AdapterValidationIssue[];
}

export const validateTaskRequestResult = (request: FinanceTaskRequest): ValidationResult => {
  const issues = validateTaskRequest(request);
  return { ok: issues.length === 0, issues };
};

export const assertValidTaskRequest = (request: FinanceTaskRequest): void => {
  const { issues } = validateTaskRequestResult(request);
  if (issues.length > 0) {
    const detail = issues.map((issue) => `${issue.field}:${issue.code}`).join(',');
    throw new Error(`Invalid FinanceTaskRequest (${detail})`);
  }
};
