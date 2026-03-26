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
  - `docs/monorepo-dependency-audit.md`
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

## 2026-03-26 Phase F — Persistence Hook-up & App Guarded Adoption

- 当前阶段名称：Phase F / Governance Landing
- 完成内容：
  - 在 `@stratos/infrastructure` 新增 `StrategyLifecycleStore` 抽象与 `InMemoryStrategyLifecycleStore`，为 lifecycle 快照持久化预留统一入口。
  - `StrategyLifecycleGuard` 改为依赖 `StrategyLifecycleStore`（默认内存实现），从“纯内存私有 map”升级为“可替换存储后端”模式。
  - 在 `@stratos/experiment-engine` 补充 `@stratos/infrastructure` 依赖，使 guard 可通过基础设施层扩展到 DB/对象存储。
  - 在 `apps/finance` 新增 `FinanceStrategyLifecycleService`，仅使用 guarded API（register/evaluate/startExperimentGuarded/finalize），避免 app 继续依赖 legacy shortcut。
- 修改文件：
  - `packages/infrastructure/src/database/StrategyLifecycleStore.ts`
  - `packages/infrastructure/src/index.ts`
  - `packages/experiment-engine/src/lifecycle/StrategyLifecycleGuard.ts`
  - `packages/experiment-engine/package.json`
  - `apps/finance/src/application/services/FinanceStrategyLifecycleService.ts`
  - `apps/finance/src/application/index.ts`
  - `apps/finance/src/application/phase7/index.ts`
  - `docs/development-memory.md`
- 当前系统是否可运行：待 typecheck 验证（受环境 pnpm 拉取限制）。
- 当前遗留风险：
  - lifecycle store 当前默认仍是内存版，尚未连接真实数据库实现。
  - app 内现有调用链尚未全面迁移到 `FinanceStrategyLifecycleService`。

### 最初重构目标回顾（防偏离检查）
- 目标1：**通用能力上提到 packages** —— 已将生命周期治理与执行契约持续放在 `packages/*`，未把通用逻辑落入 finance app。
- 目标2：**finance 逻辑收敛到 apps/finance** —— 新增的是 finance-specific facade（`FinanceStrategyLifecycleService`），仅做领域调用编排。
- 目标3：**依赖方向 apps → packages → infrastructure** —— 本阶段新增依赖保持该方向：`apps/finance -> experiment-engine -> infrastructure`。
- 目标4：**兼容优先、避免大爆炸** —— 保留 legacy API，并新增 guarded 路径逐步迁移。
- 结论：Phase F 的下一阶段计划未偏离初始目标。

- 下一阶段计划（Phase G 候选）：
  - 提供 `DatabaseStrategyLifecycleStore`（真实持久化实现）并通过配置注入 guard。
  - 在 finance workflow 中替换 legacy experiment 调用点，统一走 guarded 服务。
  - 增加回归测试，覆盖非法生命周期迁移与 rollback 路径。
- 变更原因：将 lifecycle 治理从“内存原型”推进到“基础设施可落地”的可演进架构。
- 影响范围：基础设施抽象、实验生命周期守卫、finance 应用编排入口。

## 2026-03-26 Phase G — Monorepo TS Boundary & Build Graph Normalization

- 当前阶段名称：Phase G / TS Workspace Engineering Hardening
- 完成内容：
  - 全仓统一为基于 **TypeScript project references** 的编译/类型检查链路，根级新增 `tsconfig.json` 引用图，覆盖 `packages/*` 与 `apps/finance`。
  - 全部 `packages/*` 与 `apps/finance` 的 `tsconfig.json` 启用 composite 工程参数：`composite` / `declaration` / `declarationMap` / `incremental` / `tsBuildInfoFile`。
  - 按内部依赖自动补全 `references`，使跨包类型解析走拓扑构建，不再依赖“裸跑 tsc --noEmit + NodeNext 包解析碰运气”。
  - 统一各包 `package.json` 规范：补齐 `main`/`types`/`exports`、`scripts.build`/`scripts.typecheck`/`scripts.clean`，内部依赖统一 `workspace:*`。
  - 根级脚本改为拓扑驱动：`build`/`typecheck`/`clean` 均走 `tsc -b` 模式。
  - 修复 `StrategyRuntimeKernel` 泛型约束过严问题（`Record<string, unknown>` -> `object`），消除 build graph 下的真实类型错误。
- 修改文件：
  - `package.json`
  - `tsconfig.json`（新增）
  - `apps/finance/package.json`, `apps/finance/tsconfig.json`
  - 所有 `packages/*/package.json`, `packages/*/tsconfig.json`
  - `packages/core/src/runtime/StrategyRuntimeKernel.ts`
  - `docs/monorepo-dependency-audit.md`
  - `docs/development-memory.md`
- 当前系统是否可运行：
  - `pnpm install` ✅
  - `pnpm typecheck` ✅（根级 `tsc -b`）
  - `pnpm build` ✅（根级 `tsc -b`）
- 当前遗留风险：
  - 目前采用单入口 exports（`.`），若未来需要 subpath export，应按稳定 API 再增量开放。
  - 构建产物统一输出到 `dist`，后续可再补充包级发布策略（如果从 private 变为可发布）。

### 对初始重构目标的再次复核（防偏离）
- `packages/*` 仍承载框架能力，`apps/finance` 仍是领域接入层；本阶段仅修复工程边界与编译拓扑，不上移 finance 业务语义。
- 依赖方向仍为 `apps -> packages -> infrastructure`，未引入 app 反向依赖。
- 未通过删除导入/放宽类型来“假通过”；而是通过正规 monorepo 工程化（references + exports + workspace deps + tsc -b）修复。
- 结论：Phase G 的结构化修复与 Framework PRD 初始目标保持一致。



## 2026-03-26 Phase H — Governance Completion & Regression Hardening

- 当前阶段名称：Phase H / Governance Completion
- 完成内容：
  - 完成 `DatabaseStrategyLifecycleStore`，并将 `StrategyLifecycleGuard` 默认持久化路径切到 database-backed store（不再默认纯内存路径）。
  - finance workflow 增加 `FinanceStrategyLifecycleService` 的全异步 guarded 调用链，统一通过 `registerCandidate -> markCandidateEvaluated -> startExperimentGuarded -> decidePromotion`。
  - 清理 experiment engine 的 legacy shortcut（移除 `startExperiment` 快捷入口），只保留 guarded API。
  - 建立治理链路测试矩阵（Node test）：
    - 单测：`StrategyLifecycleGuard`、`StrategyRuntimeKernel`
    - 回归：非法生命周期迁移、rollback 路径
    - smoke：finance guarded workflow 最小闭环
  - CI merge gate 落地到 workflow：
    `pnpm install --frozen-lockfile && pnpm clean && pnpm build && pnpm typecheck && pnpm test`
- 修改文件：
  - `packages/infrastructure/src/database/StrategyLifecycleStore.ts`
  - `packages/experiment-engine/src/lifecycle/StrategyLifecycleGuard.ts`
  - `packages/experiment-engine/src/ExperimentEngine.ts`
  - `apps/finance/src/application/services/FinanceStrategyLifecycleService.ts`
  - `tests/strategy-lifecycle-guard.test.mjs`
  - `tests/strategy-runtime-kernel.test.mjs`
  - `tests/finance-guarded-workflow.smoke.test.mjs`
  - `.github/workflows/ci.yml`
  - `package.json`
  - `docs/development-memory.md`
- 当前系统是否可运行：`pnpm install` / `pnpm build` / `pnpm typecheck` / `pnpm test` 均通过。
- 当前遗留风险：
  - `DatabaseStrategyLifecycleStore` 当前仍是 DB 事务边界 + cache bridge 实现，后续可替换为真实 SQL/NoSQL adapter。
- 下一阶段计划：
  - 将 lifecycle persistence bridge 替换为真实数据库仓储实现。
  - 增加 model-router 与 replay-debug 的治理链路测试覆盖。
- 变更原因：完成治理链路闭环并把质量门禁固化到 CI merge gate。
- 影响范围：实验治理路径、finance 受控流程、测试与 CI。

## 2026-03-26 Phase I — Adapter Concretization, Replay Governance & Public API Clarification

- 当前阶段名称：Phase I / Governance Extension
- 完成内容：
  - lifecycle persistence bridge 落地为可替换 adapter 组合：
    - `SQLiteDatabaseAdapter`
    - `RemoteDatabaseAdapter`
    - `DatabaseStrategyLifecycleStore` 默认走 SQLite adapter 路径
  - 为 model-router 增加最小治理链路能力与测试（policy deny -> fallback）。
  - 新增 replay-debug 包并补 replay/audit 最小 fixture，验证“可回放而非只可编译”。
  - 明确公共导出策略：新增 `docs/public-api-exports.md`，并在新包 `package.json` 中把 `./internal/*` 显式置为私有。
- 修改文件：
  - `packages/infrastructure/src/database/SQLiteDatabaseAdapter.ts`
  - `packages/infrastructure/src/database/RemoteDatabaseAdapter.ts`
  - `packages/infrastructure/src/database/StrategyLifecycleStore.ts`
  - `packages/infrastructure/src/index.ts`
  - `packages/model-router/*`
  - `packages/replay-debug/*`
  - `tests/model-router-governance.test.mjs`
  - `tests/replay-debug-fixture.test.mjs`
  - `docs/public-api-exports.md`
  - `docs/development-memory.md`
  - `tsconfig.json`
- 当前系统是否可运行：`pnpm install --frozen-lockfile && pnpm clean && pnpm build && pnpm typecheck && pnpm test` 通过。
- 当前遗留风险：
  - SQLite/Remote adapter 当前为协议层实现，真实生产 driver 接入仍需基础设施团队按环境落库。
- 下一阶段计划：
  - 将 SQLite adapter 接入真实 driver（或 managed sqlite service）并增加失败注入测试。
  - 扩展 replay-debug 到跨 runId 的差异回放与审计比对。
- 变更原因：完成 Phase I 对“持久化、治理测试、回放验证、公共 API 边界”的交付要求。
- 影响范围：基础设施 adapter、模型路由治理、回放审计、公共导出治理。

## 2026-03-26 Phase J — Core Loop Deepening with Infra Validation Side Track

- 当前阶段名称：Phase J / Core Loop Deepening with Infra Validation Side Track
- 完成内容：
  - 主线：补齐最小核心闭环骨架 `Artifact -> Claim -> Outcome -> Review -> ErrorPattern -> Evaluation -> Experiment`。
    - 新增 `@stratos/claim-extractor`：实现 StrategyClaim 最小提取协议（happy/failure path、稳定 schema、唯一 claim_id）。
    - 新增 `@stratos/review-engine`：实现结构化 Review 输出最小字段集。
    - 新增 `@stratos/error-utilization`：实现 ErrorPattern 聚合与生命周期 `observed -> clustered -> named`。
    - 增强 `@stratos/evaluation-engine`：增加 candidate/baseline 最小离线评估协议与晋升建议骨架。
    - 在 finance 侧新增 `FinanceCoreLoopService`，形成单应用可运行最小闭环。
  - replay/router 深化：
    - `@stratos/replay-debug` 增加 diff 能力（stage / payload key 差异）。
    - `@stratos/model-router` 增加 route metadata（deny/fallback/policyApplied）。
  - 支线（Infra validation）：
    - `DatabaseStrategyLifecycleStore` 增加可注入 persistence driver。
    - 新增 SQLite 真实存储 smoke test（sqlite3 CLI 驱动）验证 persistence/读取路径可成立。
  - 公共导出边界：
    - 新增包统一 root public API，`./internal/*` 显式私有。
    - 文档化 public/private exports 策略。
- 修改文件：
  - `packages/claim-extractor/*`
  - `packages/review-engine/*`
  - `packages/error-utilization/*`
  - `packages/evaluation-engine/src/*`
  - `packages/model-router/src/index.ts`
  - `packages/replay-debug/src/index.ts`
  - `packages/replay-debug/fixtures/minimal-replay.json`
  - `packages/infrastructure/src/database/StrategyLifecycleStore.ts`
  - `apps/finance/src/application/services/FinanceCoreLoopService.ts`
  - `tests/*.test.mjs`, `tests/*.smoke.test.mjs`
  - `docs/core-loop-protocols.md`
  - `docs/public-api-exports.md`
  - `docs/development-memory.md`
- 当前系统是否可运行：
  - `pnpm install --frozen-lockfile` ✅
  - `pnpm clean` ✅
  - `pnpm build` ✅
  - `pnpm typecheck` ✅
  - `pnpm test` ✅
- 当前遗留风险：
  - SQLite 真实验真当前通过 CLI driver PoC 证明可接入，生产 driver/迁移体系仍需基础设施团队后续补齐。
  - ErrorPattern -> STU candidate 自动生成仍未在本阶段完成（按非目标保留）。
- 下一阶段计划（Phase K 候选）：
  - 接入 bias-monitor 与 evaluation/experiment 耦合检查。
  - 推进 ErrorPattern 到 STU candidate 形成与候选晋升闭环。
  - 视基础设施资源决定是否扩展 remote DB 生产级 adapter。
- 变更原因：在不偏离框架边界的前提下，把治理闭环升级为可运行的自我训练骨架。
- 影响范围：核心协议层、finance 最小闭环、回放/路由解释能力、基础设施验真。

## 2026-03-26 Phase K — STU Candidate Formation & Bias/Evaluation Coupling

- 当前阶段名称：Phase K / STU Candidate Formation & Bias-Eval Coupling
- 完成内容：
  - 打通 `ErrorPattern -> STUCandidate -> evaluation/experiment input` 最小闭环：
    - `@stratos/error-utilization` 扩展生命周期到 `validated`、`promoted_to_stu_candidate`。
    - 增加 `STUCandidate` 协议与生成入口（稳定 schema、唯一 candidate_id、error pattern 来源、review/evidence refs、scope note、strategy summary）。
  - 增强 `@stratos/bias-monitor`：
    - 增加行为信号/结果信号聚合（confidence/rejection/riskHint/claimTilt + reviewPass/errorDirection/severeError/rollback）。
    - 增加 bias alert 与 candidate gate 协议，支持 `needs_bias_review` 标记。
  - finance 侧新增 `FinanceSTUCandidateService`，形成最小链路：
    `Claim -> Review -> ErrorPattern -> STUCandidate -> EvaluationInput -> ExperimentCandidate`。
  - replay/audit 深化：
    - 增加 STUCandidate replay fixture（pattern 来源、bias snapshot refs、gate 结论）。
    - replay-debug 维持可回放与差异解释能力。
  - 公共导出边界：
    - 新增协议继续通过 root public API 导出；internal 维持私有边界。
- 修改文件：
  - `packages/error-utilization/src/index.ts`
  - `packages/bias-monitor/src/*`
  - `apps/finance/src/application/services/FinanceSTUCandidateService.ts`
  - `apps/finance/src/application/index.ts`
  - `apps/finance/src/application/phase7/index.ts`
  - `packages/replay-debug/fixtures/stu-candidate-replay.json`
  - `tests/bias-monitor-gate.test.mjs`
  - `tests/finance-stu-candidate-flow.smoke.test.mjs`
  - `tests/stu-candidate-replay-fixture.test.mjs`
  - `docs/core-loop-protocols.md`
  - `docs/development-memory.md`
- 当前系统是否可运行：
  - `pnpm install --frozen-lockfile` ✅
  - `pnpm clean` ✅
  - `pnpm build` ✅
  - `pnpm typecheck` ✅
  - `pnpm test` ✅
- 当前遗留风险：
  - STUCandidate 自动激活仍被显式禁用，后续需在更严格 gate 下推进。
  - Bias 规则阈值当前为最小策略，后续需结合真实数据校准。
- 下一阶段计划（Phase L 候选）：
  - 将 STUCandidate 输出接入更完整 experiment promotion 评分模型。
  - 补齐 bias-monitor 与 replay/audit 跨周期窗口回溯分析。
- 变更原因：落实 Phase K 要求，将错误利用、偏差检查、候选形成耦合为可运行骨架。
- 影响范围：核心框架协议、finance 编排 facade、回放审计与测试矩阵。
