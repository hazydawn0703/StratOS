# Migration Notes (2026-03-25)

## Runtime orchestration extraction
- **Change**: Strategy chain orchestration moved behind `@stratos/core` `StrategyRuntimeKernel`.
- **Impact**: `apps/finance` keeps same runtime output contract; internal composition now delegates to kernel.
- **Action for other apps**: Reuse `StrategyRuntimeKernel` with app-specific bootstrapping of STUs and adapters.

## Naming migration path
- **Change**: Added neutral aliases (`StrategyClaim`, `OutcomeReview`, `StrategyArtifact`) in shared types.
- **Impact**: Existing imports (`Prediction`, `Review`) still work.
- **Recommended gradual migration**:
  1. Use neutral names in new package-level modules.
  2. Keep finance-facing UI/API wording unchanged.
  3. Migrate internal package modules first, then app surfaces only when needed.
