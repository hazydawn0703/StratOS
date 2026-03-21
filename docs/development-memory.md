# Development Memory

## 2026-03-21 Initialization Snapshot

### Created packages (in required order)
1. `packages/shared-types`: global interfaces and neutral schemas.
2. `packages/core`: runtime context abstractions, pipeline stages, orchestrator protocols.
3. `packages/infrastructure`: config/database/storage/queue/logger interfaces with local mocks.
4. `packages/model-gateway`: provider-agnostic model entry points plus mock + placeholder adapters.
5. `packages/stu-registry`: in-memory STU register/list/activate/deprecate/version resolve.
6. `packages/strategy-compiler`: STU filtering, conservative merges, conflict detection, bundle compile.
7. `packages/rule-engine`: rule validation and pre/in/post execution with runtime effects + logs.
8. `packages/evaluation-engine`: structured candidate evaluation and baseline comparison using mock scorer.
9. `packages/experiment-engine`: deterministic rollout and promotion lifecycle for experiments.
10. `packages/bias-monitor`: snapshot computation, window comparison, bias detection output.
11. `packages/ui`: reusable generic UI component contracts without finance-specific page logic.

### Dependency health check
- Implemented dependency direction is healthy and follows:
  `apps/* -> packages/* -> infrastructure-adjacent abstractions`.
- `shared-types` has no package dependencies.
- No package depends on `apps/finance`.
- No circular dependencies introduced in package manifests.

### Next initialization step
- Keep `apps/finance` in shell mode only (already bootstrapped).
- Next phase can wire app composition using package APIs while still avoiding domain-heavy finance logic until interfaces stabilize.

## 2026-03-21 Phase Continuation (apps/finance shell wiring)

### Completed in this phase
- Added `FinanceStrategyRuntime` composition root in `apps/finance` to consume package APIs only.
- Added app-level task input/result contracts for runtime orchestration output.
- Added mock STU registration helper and bootstrap wiring.
- Kept app layer free of pages/API handlers/domain-heavy portfolio logic.

### Why this aligns with package-first constraints
- Runtime only orchestrates `core`, `stu-registry`, `strategy-compiler`, `rule-engine`, and `model-gateway`.
- No framework logic copied into `apps/finance`; all reusable behavior stays in packages.
- Uses mock provider and mock STU for testability and deterministic bootstrapping.

### Next step
- Add lightweight application service boundaries for report-generation/review/evaluation task entrypoints while continuing to consume package interfaces.
