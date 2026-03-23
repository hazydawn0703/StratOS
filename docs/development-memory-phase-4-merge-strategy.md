# Development Memory — Phase 4 Merge Strategy

To avoid recurring merge hotspots in:
- `apps/finance/src/application/index.ts`
- `apps/finance/src/application/services/FinanceTaskService.ts`
- `apps/finance/src/application/services/mockDemo.ts`

Phase-4 mapped APIs are moved to standalone files:
- `apps/finance/src/application/services/FinanceTaskServiceMapped.ts`
- `apps/finance/src/application/services/mockMappedDemo.ts`
- `apps/finance/src/application/phase4/index.ts`

This keeps phase-3 files stable for branch merges while preserving phase-4 functionality.
