const providerCallStats: Record<string, number> = {
  market_calls: 0,
  news_calls: 0,
  event_calls: 0
};

export const recordProviderCall = (key: keyof typeof providerCallStats): void => {
  providerCallStats[key] += 1;
};

export const getProviderCallStats = (): Record<string, number> => ({ ...providerCallStats });
