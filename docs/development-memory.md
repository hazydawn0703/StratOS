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

## 2026-03-25 Phase A — Abstraction Leakage Audit

- 当前阶段名称：Phase A / Audit
- 完成内容：完成全仓分层审计，输出 leakage matrix、边界重分类、风险分级。
- 修改文件：`abstraction-leakage-audit.md`。
- 当前系统是否可运行：未改代码逻辑前，运行状态不变（预计可运行）。
- 当前遗留风险：`shared-types` 仍以 finance 命名为主；app 仍持有 runtime 编排职责。
- 下一阶段计划：先做 staged refactor plan，再做最小可运行抽取。
- 变更原因：新增 Framework PRD 要求修正 abstraction leakage。
- 影响范围：文档层，无运行时影响。

## 2026-03-25 Phase B — Staged Refactor Planning

- 当前阶段名称：Phase B / Plan
- 完成内容：制定分阶段重构路径与 non-goals，明确兼容优先策略。
- 修改文件：`refactor-plan.md`。
- 当前系统是否可运行：可运行（仅文档变更）。
- 当前遗留风险：尚未落地 runtime 抽取与命名兼容层。
- 下一阶段计划：落地 `StrategyRuntimeKernel` 与 shared-types neutral alias。
- 变更原因：避免 big-bang rewrite，确保可分阶段交付。
- 影响范围：文档层，无 API/数据结构影响。

## 2026-03-25 Phase C — Minimal Behavior-Preserving Refactor

- 当前阶段名称：Phase C / Code Refactor
- 完成内容：
  - 在 `@stratos/core` 提取 `StrategyRuntimeKernel` 统一编排链路。
  - `apps/finance` runtime 改为调用 kernel（保留原返回结构）。
  - 在 shared-types 增加 `StrategyClaim` / `OutcomeReview` / `StrategyArtifact` 兼容层。
  - 增加兼容层说明与迁移说明文档。
- 修改文件：
  - `packages/core/src/runtime/StrategyRuntimeKernel.ts`
  - `packages/core/src/index.ts`
  - `apps/finance/src/composition/FinanceStrategyRuntime.ts`
  - `packages/shared-types/src/strategyArtifacts.ts`
  - `packages/shared-types/src/index.ts`
  - `docs/compatibility-layer.md`
  - `docs/migration-notes.md`
- 当前系统是否可运行：待 typecheck 验证。
- 当前遗留风险：
  - kernel 当前仍使用默认 modelLayer/provider，后续需 router 化。
  - `TaskContext` 仍包含 finance 字段，后续需通过 context facet 逐步拆分。
- 下一阶段计划：
  - 清理 `FinanceTaskService*` 重复实现。
  - 将更多 package 内部消费迁移到 neutral alias。
- 变更原因：优先抽取框架能力并保留 finance 功能。
- 影响范围：运行时编排入口与类型导出，外部 API 预期不变。
