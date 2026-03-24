import { FinanceTaskTransportFacade } from './FinanceTaskTransportFacade.js';

export const runFinanceTaskTransportDemo = async (): Promise<string> => {
  const facade = new FinanceTaskTransportFacade();
  const result = await facade.report({ thesisType: '', riskLevel: 'medium', ticker: 'INVALID*' });
  return `${result.statusCode}:${result.ok ? 'ok' : result.error.code}`;
};
