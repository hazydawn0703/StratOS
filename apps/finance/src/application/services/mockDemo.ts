import { FinanceTaskService } from './FinanceTaskService.js';

export const runFinanceTaskServiceDemo = async (): Promise<string> => {
  const service = new FinanceTaskService();
  const result = await service.runReportGeneration({
    thesisType: 'scenario',
    riskLevel: 'medium',
    ticker: 'DEMO'
  });

  return `${result.context.taskType}:${result.modelResponse.provider}`;
};

export const runFinanceTaskServiceMappedDemo = async (): Promise<string> => {
  const service = new FinanceTaskService();
  const result = await service.runReportGenerationMapped({
    thesisType: 'scenario',
    riskLevel: 'medium',
    ticker: 'DEMO'
  });

  return `${result.taskType}:${result.provider}`;
};

export const runFinanceTaskServiceMappedSafeDemo = async (): Promise<string> => {
  const service = new FinanceTaskService();
  const result = await service.runReportGenerationMappedSafe({
    thesisType: '',
    riskLevel: 'medium',
    ticker: 'INVALID*'
  });

  return result.ok ? 'ok' : `issues:${result.issues.length}`;
};
