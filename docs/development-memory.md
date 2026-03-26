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

## 2026-03-26 Phase D — Runtime Typing Hardening & App Facade De-dup

- 当前阶段名称：Phase D / Refactor Implementation Continuation
- 完成内容：
  - 强化 `StrategyRuntimeKernel` 泛型签名，去掉 app 层类型断言依赖，保留行为不变。
  - 为 kernel 增加可配置路由默认值入口（默认仍为 `default`/`mock`），避免硬编码扩散。
  - 将 `FinanceTaskServiceMapped` 收敛为兼容 facade，仅代理到 `FinanceTaskService`，消除重复实现。
- 修改文件：
  - `packages/core/src/runtime/StrategyRuntimeKernel.ts`
  - `apps/finance/src/composition/FinanceStrategyRuntime.ts`
  - `apps/finance/src/application/services/FinanceTaskServiceMapped.ts`
  - `docs/development-memory.md`
- 当前系统是否可运行：待 typecheck 验证（受环境拉取 pnpm 限制）。
- 当前遗留风险：
  - `TaskContext` finance 字段仍在 shared-types 中作为主结构；尚未完成 context facet 抽离。
  - experiment/evaluation 生命周期守卫仍需在更高层 orchestration 明确串联。
- 下一阶段计划：
  - 在 packages 层补充策略候选生命周期 guard 接口（candidate→evaluation→experiment→active/rollback）。
  - 为 Prompt/Rule/Routing 三层增加更明确的编排输入契约。
- 变更原因：在不改外部行为前提下，先降低类型与实现重复带来的维护风险。
- 影响范围：app service 兼容入口与 runtime 泛型约束，无外部 API 变更。

## 2026-03-26 Phase E — Lifecycle Guard & Prompt/Rule/Routing Contract

- 当前阶段名称：Phase E / Runtime Governance Continuation
- 完成内容：
  - 在 `@stratos/experiment-engine` 增加 `StrategyLifecycleGuard`，显式限制候选策略状态流转：
    `candidate -> evaluated -> experimenting -> active/rolled_back`。
  - 在 `ExperimentEngine` 中接入 guard，并新增受控 API：
    `registerCandidate`、`markCandidateEvaluated`、`startExperimentGuarded`；
    同时保留 `startExperiment` 作为兼容桥接入口。
  - 在 `@stratos/strategy-compiler` 增加 `StrategyExecutionContract`，明确 Prompt/Rule/Routing 三层的统一执行输入契约。
  - 在 `@stratos/core` `StrategyRuntimeKernel` 增加 `createExecutionContext`，并将 routing provider 与 runtime route 选择串联，减少 routing layer 被忽略的风险。
- 修改文件：
  - `packages/experiment-engine/src/lifecycle/StrategyLifecycleGuard.ts`
  - `packages/experiment-engine/src/ExperimentEngine.ts`
  - `packages/experiment-engine/src/index.ts`
  - `packages/strategy-compiler/src/execution/StrategyExecutionContract.ts`
  - `packages/strategy-compiler/src/index.ts`
  - `packages/core/src/runtime/StrategyRuntimeKernel.ts`
  - `docs/development-memory.md`
- 当前系统是否可运行：待 typecheck 验证（环境无法拉取 pnpm 依赖）。
- 当前遗留风险：
  - lifecycle guard 当前为内存实现，尚未落盘持久化。
  - legacy `startExperiment` 仍做自动评估桥接，后续需逐步下线。
- 下一阶段计划：
  - 引入 infrastructure 层存储接口以持久化 lifecycle snapshot。
  - 在 app 层显式改造调用链到 guarded API（去除 legacy shortcut）。
- 变更原因：落实“candidate 不可直接上线”和“Prompt/Rule/Routing 三层统一执行上下文”要求。
- 影响范围：实验生命周期与 runtime 合约，兼容路径保留。
