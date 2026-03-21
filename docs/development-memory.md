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
