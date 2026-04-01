export interface MarketDataProvider {
  getQuote(ticker: string): Promise<{ ticker: string; price: number; asOf: string }>;
}

export interface NewsProvider {
  listHeadlines(ticker: string): Promise<Array<{ id: string; title: string; publishedAt: string }>>;
}

export interface EventProvider {
  listEvents(ticker: string): Promise<Array<{ id: string; eventType: string; eventAt: string }>>;
}

export interface FinanceProviderRegistry {
  market: MarketDataProvider;
  news: NewsProvider;
  events: EventProvider;
}
