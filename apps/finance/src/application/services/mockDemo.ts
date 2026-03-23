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
