import { MockEventProvider, MockMarketDataProvider, MockNewsProvider } from './mockProviders.js';
import type { FinanceProviderRegistry } from './types.js';

export const createFinanceProviderRegistry = (): FinanceProviderRegistry => {
  return {
    market: new MockMarketDataProvider(),
    news: new MockNewsProvider(),
    events: new MockEventProvider()
  };
};
