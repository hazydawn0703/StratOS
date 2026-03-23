# Development Memory — Phase 4 Merge Strategy

## 2026-03-23 update

User chose option 2: keep Phase-4 mapper consumption directly in `FinanceTaskService`.

### Current strategy
- `FinanceTaskService` now contains both:
  - phase-3 stable methods (`runReportGeneration`, `runReviewGeneration`, `runExperimentEvaluation`)
  - phase-4 mapped methods (`runReportGenerationMapped`, `runReviewGenerationMapped`, `runExperimentEvaluationMapped`)
- `mockDemo.ts` exposes both legacy and mapped demo paths.
- Standalone mapped files are retained for transition compatibility:
  - `FinanceTaskServiceMapped.ts`
  - `mockMappedDemo.ts`
  - `application/phase4/index.ts`
