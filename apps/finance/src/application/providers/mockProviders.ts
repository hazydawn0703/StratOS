import type { EventProvider, MarketDataProvider, NewsProvider } from './types.js';
import { recordProviderCall } from './providerStats.js';

export class MockMarketDataProvider implements MarketDataProvider {
  async getQuote(ticker: string): Promise<{ ticker: string; price: number; asOf: string }> {
    recordProviderCall('market_calls');
    return { ticker, price: 100, asOf: new Date().toISOString() };
  }
}

export class MockNewsProvider implements NewsProvider {
  async listHeadlines(ticker: string): Promise<Array<{ id: string; title: string; publishedAt: string }>> {
    recordProviderCall('news_calls');
    return [{ id: `news-${ticker}-1`, title: `${ticker} mock headline`, publishedAt: new Date().toISOString() }];
  }
}

export class MockEventProvider implements EventProvider {
  async listEvents(ticker: string): Promise<Array<{ id: string; eventType: string; eventAt: string }>> {
    recordProviderCall('event_calls');
    return [{ id: `event-${ticker}-earnings`, eventType: 'earnings', eventAt: new Date().toISOString() }];
  }
}
