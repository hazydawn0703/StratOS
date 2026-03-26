# Staged Refactor Plan (Abstraction Leakage Correction)

Date: 2026-03-25

## Refactor principles
1. Preserve behavior first.
2. No big-bang rewrite.
3. Compatibility first (facade/adapter/type alias/mapper).
4. Framework extraction over finance domain rewrite.
5. Strategy runtime unification path:
   `STU Registry → Strategy Compiler → Rule Execution Engine → Model Gateway/Router`.

## Stage 1 — Audit Baseline (this delivery)
- Produce leakage matrix and risk grading.
- Freeze required invariants:
  - no external API behavior changes,
  - app remains runnable,
  - finance semantics still available.

## Stage 2 — Framework extraction (minimal runnable slice)
- Add a package-level runtime kernel in `@stratos/core` to host unified strategy chain orchestration.
- Rewire `apps/finance` runtime composition to call that kernel instead of owning orchestration logic.
- Keep output contract identical to current finance service shape.

## Stage 3 — Naming compatibility layer
- Add cross-domain type aliases in shared types:
  - `StrategyArtifact`, `StrategyClaim`, `OutcomeReview`.
- Keep legacy exports (`Prediction`, `Review`) as compatibility names.
- Add migration notes; no forced renames in app code yet.

## Stage 4 — Progressive app cleanup (deferred)
- Reduce duplicated mapped service logic (`FinanceTaskServiceMapped` vs `FinanceTaskService`) via facade delegation.
- Keep transport contract stable.

## Stage 5 — Hardening + regression guardrails
- Typecheck all packages/apps.
- Add lint/test checks later for forbidden finance terms in framework core modules.
- Add architectural checks for dependency direction.

## Non-goals in this refactor batch
- No DB schema rewrite.
- No endpoint signature rewrite.
- No mass rename across all files.
