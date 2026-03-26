# Compatibility Layer Notes

## Purpose
This refactor introduces framework-level abstractions without breaking finance app behavior.

## Added compatibility surfaces
1. `@stratos/shared-types`
   - Added neutral aliases:
     - `StrategyClaim` (alias of existing `Prediction`)
     - `OutcomeReview` (alias of existing `Review`)
     - `StrategyArtifact` (wrapper interface with `claim` + optional `review`)
   - Existing `Prediction` and `Review` are unchanged.

2. `@stratos/core`
   - Added `StrategyRuntimeKernel` as the package-owned strategy orchestration facade.
   - `apps/finance` now delegates orchestration to this kernel, preserving run result shape.

## Why this is safe
- No external finance endpoint contract changes.
- No DB schema changes.
- Existing finance naming remains valid while neutral names are introduced for future domains.
