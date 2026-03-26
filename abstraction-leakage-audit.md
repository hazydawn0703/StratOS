# Abstraction Leakage Audit

Date: 2026-03-25  
Scope: `apps/finance`, `packages/*`, `infrastructure/*`

## A. Leakage Matrix

| ID | Leakage type | Current location | Evidence | Why leakage | Correction direction |
|---|---|---|---|---|---|
| L1 | Finance semantics inside framework package | `packages/shared-types/src/prediction.ts`, `packages/shared-types/src/review.ts` | Core schema uses `Prediction`, `Review`, and finance-like fields (`bullishCase`, `cautiousCase`, `missedCounterevidence`). | These are app-domain artifacts, not neutral runtime schema. | Keep compatibility; add framework aliases (`StrategyClaim`, `OutcomeReview`, `StrategyArtifact`) and progressively migrate package internals to neutral naming. |
| L2 | Finance fields embedded in generic task context | `packages/shared-types/src/task.ts`, `packages/core/src/context/TaskRuntime.ts` | `TaskContext` and `MockTaskRuntime` hardcode `thesisType`, `riskLevel`, `ticker`. | Makes runtime less reusable for content/ads/sales/ops. | Introduce neutral runtime facade/interface first; keep finance facets optional in app mappers for staged migration. |
| L3 | App layer re-implements framework runtime composition | `apps/finance/src/composition/FinanceStrategyRuntime.ts` | Directly wires registry/compiler/rule-engine/model-gateway flow in app code. | Strategy runtime chain should be unified in packages. | Extract a package-level runtime kernel and keep finance app as bootstrap + domain adapter. |
| L4 | Duplicated app service mapping logic | `apps/finance/src/application/services/FinanceTaskService.ts`, `FinanceTaskServiceMapped.ts` | Same request/response mapping and safe wrappers are duplicated. | Not cross-domain leakage, but maintenance duplication and drift risk. | Keep behavior now; collapse in later phase via facade composition. |
| L5 | Naming lock-in at transport boundary | `apps/finance/src/application/transport/endpointContracts.ts`, `types.ts` | endpoint/stage names fixed to `report/review/evaluation`. | Acceptable in app, but currently mirrored in shared-type semantics, causing confusion. | Keep app naming; avoid propagating those names into new package APIs. |
| L6 | Potential direct-connect risk (currently low) | whole repo scan | No direct DB/object storage/queue/model SDK calls from app; model calls go through `@stratos/model-gateway`. | Direction mostly healthy. | Preserve this constraint; codify in plan as regression check. |

### Violations by required categories

1. **Should be packages but mixed with finance semantics**
   - `packages/shared-types/src/prediction.ts`
   - `packages/shared-types/src/review.ts`
   - `packages/core/src/context/TaskRuntime.ts` (finance-shaped defaults)

2. **Should stay apps/finance but currently replicate framework capability**
   - `apps/finance/src/composition/FinanceStrategyRuntime.ts` (runtime orchestration)

3. **Dependency direction checks (`apps → packages → infrastructure`)**
   - No hard violation detected in imports/package manifests.
   - Structural smell: app owns orchestration that should be package responsibility (L3).

4. **Finance-bound naming that blocks generalization**
   - `Prediction`, `Review` as package-level canonical entities.
   - `TaskContext.thesisType/riskLevel/ticker` as assumed universal task attributes.

---

## B. Framework/App Boundary Reclassification

### Move/Extract to `packages/*`
- Unified strategy runtime chain orchestration (`STU Registry → Strategy Compiler → Rule Engine → Model Gateway`) as a reusable runtime kernel.
- Cross-domain alias schema for strategy outputs (`StrategyClaim`, `OutcomeReview`, `StrategyArtifact`) with backward-compatible mapping.

### Keep in `apps/finance/*`
- Finance request validation (`ticker` format), finance endpoints, and finance transport contract.
- Finance bootstrap and mock STU content.
- Finance-specific API/UI wording (`report/review/evaluation`).

### Add adapter/facade layer
- `@stratos/core` runtime facade that accepts injected registry/compiler/rule/gateway/task-runtime implementations.
- Shared-types compatibility aliases so old finance names continue to work during migration.

### Temporarily keep unchanged (defer)
- `FinanceTaskService` and `FinanceTaskServiceMapped` duplication (not abstraction-layer blocking).
- Existing UI components referencing `Prediction`/`Review`; defer until aliases are adopted in package UI surface.

---

## C. Risk Grading

### High
- Changing `TaskContext` shape directly (can break runtime compilation and request mapping).
- Replacing app runtime orchestration without preserving current output object shape.

### Medium
- Introducing new package runtime kernel and rewiring app runtime composition.
- Adding new shared-type aliases and updating exports (risk of import ambiguity).

### Low
- Adding docs (`audit`, `plan`, compatibility notes, migration notes).
- Naming compatibility layers via new types without deleting existing types.
- Non-breaking re-export additions.
