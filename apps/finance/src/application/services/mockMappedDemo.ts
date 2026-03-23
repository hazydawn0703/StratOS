import { FinanceTaskServiceMapped } from './FinanceTaskServiceMapped.js';

export const runFinanceTaskServiceMappedDemo = async (): Promise<string> => {
  const service = new FinanceTaskServiceMapped();
  const result = await service.runReportGenerationMapped({
    thesisType: 'scenario',
    riskLevel: 'medium',
    ticker: 'DEMO'
  });

  return `${result.taskType}:${result.provider}`;
};
