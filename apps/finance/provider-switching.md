# Finance Provider Switching (Current Stage)

Current stage is **local-first**:
- default mode: `FINANCE_PROVIDER_MODE=mock`
- all provider calls use mock implementations
- no external API key is required

## Interfaces
- `MarketDataProvider`
- `NewsProvider`
- `EventProvider`

## Registry
Use `createFinanceProviderRegistry()` to obtain current providers.

## Future deploy-prep stage (not now)
- bind real provider SDKs
- credential management
- retries/rate limits/circuit-breakers
- production observability
