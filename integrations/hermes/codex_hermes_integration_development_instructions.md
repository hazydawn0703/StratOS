# Codex Hermes Integration Development Instructions

## 0. 文档目的

本文档用于指导 Codex 在当前 StratOS monorepo 中继续完成 `integrations/hermes/` 的第一阶段到第三阶段开发。

目标不是把 Hermes 深度并入 StratOS 核心，也不是改造 Hermes 成为 StratOS 原生运行时。

目标是：

> 让 Hermes 能通过一个低侵入、可选启用、可失败开放（fail-open）的桥接方式，把部分高价值任务接入 StratOS 的策略治理闭环。

本次开发严格围绕以下四个子模块展开：

1. Hermes ingest adapter
2. Hermes artifact adapter
3. Hermes claim extractor preset
4. Hermes hint serving endpoint

同时需要补齐完整的 integration kit 文档、示例、测试数据和 smoke test 脚本，使得 Hermes 可以在受控环境中依据 `integrations/hermes/` 中的内容自行完成最小桥接接入。

---

## 1. 总体原则

### 1.1 架构定位

Hermes 是宿主运行时。

Hermes 继续负责：
- agent execution
- tools / skills / memory
- sessions / channels / cron
- runtime UX and orchestration

StratOS 是策略治理运行时。

StratOS 继续负责：
- TaskContext
- StrategyArtifact
- StrategyClaim
- OutcomeRecord
- OutcomeReview
- ErrorPattern
- STU
- Evaluation / Experiment / Promotion / Rollback

`integrations/hermes/` 的职责只是桥接，不负责重新定义 Hermes，也不负责把 Hermes 的 learning loop 替换成 StratOS。

### 1.2 必须遵守的边界

Codex 在本次开发中必须遵守以下边界：

1. 不得修改 `packages/*` 中 StratOS 核心协议的语义。
2. 不得把 Hermes 的概念（skills / session / gateway）硬编码进 StratOS core schema。
3. 不得在 `apps/*` 中实现 Hermes 桥接逻辑。
4. Hermes 适配逻辑必须全部留在 `integrations/hermes/`。
5. 不得把 PromotionPolicy / EvaluationPolicy / BiasAlertPolicy 等治理逻辑迁入 Hermes 适配层。
6. 第一阶段不得尝试自动晋升策略，不得写任何“自动把 candidate 变成 active”的捷径。
7. 所有桥接接口必须支持 fail-open：StratOS 服务不可达时，不得阻断 Hermes 原始运行。

### 1.3 开发原则

1. 先文档、后实现。
2. 先 mock、后真实接入。
3. 先最小 task types，后扩展。
4. 先可回放、可调试，后做“智能化”。
5. 先让集成 kit 可被 Hermes 消费，再考虑 upstream-friendly 形态。

---

## 2. 本次开发范围

## 2.1 在范围内

本次开发必须覆盖：

- Hermes 事件进入 StratOS 的 ingest 适配
- Hermes 输出进入 StratOS Artifact / Claim 管线的适配
- Hermes task type 到 StratOS task type 的基础映射
- Hermes 可消费的 strategy hints endpoint
- integration kit 文档
- smoke test / mock event / testdata
- examples

## 2.2 不在范围内

本次开发不得覆盖：

- Hermes core 源码修改
- Hermes 原生 plugin 开发
- OpenClaw 适配
- 自动 promotion
- 复杂 UI 页面
- 完整生产级认证体系
- 多租户权限控制
- generalized adapter framework for all agent hosts

---

## 3. 当前目录与各部分职责

当前目录结构已由 Codex 创建，不要擅自重构为其他结构：

```text
integrations/hermes/
├─ README.md
├─ INSTALL.md
├─ CONFIG.example.yaml
├─ TASK_TYPE_GUIDE.md
├─ EVENT_SCHEMA.md
├─ API_SPEC.md
├─ SMOKE_TEST.md
├─ TROUBLESHOOTING.md
├─ CHANGELOG.md
├─ docs/
│  ├─ concept-note.md
│  ├─ bridge-architecture.md
│  ├─ security-and-sandboxing.md
│  └─ upstream-friendly-notes.md
├─ adapters/
│  ├─ ingest/
│  ├─ artifact/
│  ├─ claim-preset/
│  └─ hints/
├─ examples/
│  ├─ analysis-task/
│  ├─ planning-task/
│  └─ scheduled-report/
├─ scripts/
│  ├─ smoke/
│  ├─ mocks/
│  └─ setup/
└─ testdata/
   ├─ sample-events/
   ├─ sample-outputs/
   └─ sample-hints/
```

Codex 只允许在这个目录下新增必要文件，不要大改目录层级。

---

## 4. 分阶段开发规划

# Phase H0：文档与接口基线对齐

## 目标

先把 `integrations/hermes/` 从“空目录结构”变成一个可以指导后续实现的 integration kit 骨架。

## 必做内容

### 4.0.1 完善根文档

补全以下文件内容，使它们彼此一致：

- `README.md`
- `INSTALL.md`
- `CONFIG.example.yaml`
- `TASK_TYPE_GUIDE.md`
- `EVENT_SCHEMA.md`
- `API_SPEC.md`
- `SMOKE_TEST.md`
- `TROUBLESHOOTING.md`
- `CHANGELOG.md`

要求：
- 术语统一
- task types 命名统一
- event schema 与 API spec 不冲突
- README 与 INSTALL 不出现矛盾步骤

### 4.0.2 docs/ 说明文档完善

补全：
- `docs/concept-note.md`
- `docs/bridge-architecture.md`
- `docs/security-and-sandboxing.md`
- `docs/upstream-friendly-notes.md`

要求：
- 不写空文档
- 不是 PRD 摘要复述
- 要回答“为什么这样接”“为什么不深度合并”“为什么是 fail-open”

### 4.0.3 统一命名和协议版本

建立一个最小的命名约定并写入文档：

- bridge version：`hermes-bridge.v0.1`
- event schema version：`hermes.events.v0.1`
- hint response version：`hermes.hints.v0.1`
- artifact adaptation preset version：`hermes.artifact.v0.1`
- claim preset version：`hermes.claim-preset.v0.1`

不要发明复杂版本体系，只需保持文本一致。

## 阶段验收标准

- 一个新工程师不看源码，只看 `integrations/hermes/` 文档，就能理解目标、边界、接口和后续实现顺序。
- 所有文档中的 task types、event names、endpoint names 完全一致。

## 本阶段禁止事项

- 不要提前写复杂业务逻辑。
- 不要开始写 claim extractor 算法细节。
- 不要接数据库。

---

# Phase H1：Hermes ingest adapter 最小可运行实现

## 目标

让 StratOS 能接收 Hermes 侧发来的四类事件，并稳定落地为内部 ingest 记录，再映射成最小 `TaskContext` 输入。

## 必做内容

### 4.1.1 `adapters/ingest/` 实现内容

在 `adapters/ingest/` 下实现：

1. 事件 schema 校验层
2. 事件解析层
3. Hermes -> StratOS TaskContext 映射层
4. 原始 payload 存档层
5. 基础错误处理层

建议文件粒度：
- `schema.ts` / `schema.py`
- `types.ts` / `types.py`
- `mapper.ts` / `mapper.py`
- `service.ts` / `service.py`
- `errors.ts` / `errors.py`

具体语言遵循项目当前技术栈，不要引入与 monorepo 主体冲突的新技术栈。

### 4.1.2 支持四类事件

必须支持：
- `task.started`
- `task.completed`
- `task.feedback`
- `outcome.available`

每类事件都必须：
- 能被解析
- 能校验
- 能输出明确错误
- 能落原始 payload

### 4.1.3 TaskContext 最小映射

为 Hermes 事件映射出最小 TaskContext 输入字段：

- external_task_id
- framework = hermes
- session_id
- actor_id
- channel
- task_type
- raw_input_summary
- raw_output_ref 或 raw_output_inline
- model_metadata
- timestamps

注意：
- 这里不要重写 StratOS 核心 TaskContext schema，只做 integration-layer mapping。
- 允许保留 `integration_metadata` / `source_payload` 等外层字段。

### 4.1.4 testdata/sample-events 填充

至少提供：
- started 示例 x2
- completed 示例 x3（analysis/planning/scheduled_report）
- feedback 示例 x2
- outcome 示例 x2
- 非法示例 x2

### 4.1.5 scripts/mocks/

提供 mock 事件发送脚本：
- send_task_started
- send_task_completed
- send_task_feedback
- send_outcome_available

支持：
- 本地 endpoint
- 自定义 base_url
- 打印响应结果

## 阶段验收标准

- 使用 mock 脚本可成功向 ingest endpoint 发送四类事件。
- 非法事件会返回可读错误。
- ingest adapter 能产出最小可追踪的 Hermes task ingest record。

## 本阶段禁止事项

- 不要开始写 Artifact 组装。
- 不要开始做 hints。
- 不要把 feedback / outcome 直接解释成 review 结果。

---

# Phase H2：Hermes artifact adapter 实现

## 目标

让 Hermes 的原始输出变成 StratOS 可消费的 `StrategyArtifact`。

## 必做内容

### 4.2.1 `adapters/artifact/` 实现内容

在 `adapters/artifact/` 下实现：

1. 原始输出格式识别
2. task_type -> artifact_type 映射
3. artifact schema builder
4. artifact metadata builder
5. adaptation failure fallback

### 4.2.2 支持的最小 artifact types

第一阶段只允许以下映射：

- Hermes `analysis` -> `strategy_analysis_artifact`
- Hermes `planning` -> `strategy_plan_artifact`
- Hermes `scheduled_report` -> `strategy_report_artifact`

命名可以根据项目现有 schema 规范微调，但必须在文档中一致。

### 4.2.3 Artifact 最小字段

必须至少包含：
- artifact_id
- source_framework = hermes
- source_task_id
- artifact_type
- schema_version
- title（若无法生成可退化）
- summary
- body / sections
- source_refs（可为空）
- runtime_metadata
- integration_metadata

### 4.2.4 adaptation fallback

当 Hermes 输出无法稳定转为结构化 artifact 时：
- 不允许直接丢弃
- 必须保留 raw output
- 必须产出 adaptation failure record
- 必须可在 troubleshooting 中追踪

### 4.2.5 testdata/sample-outputs 填充

至少提供：
- analysis 原始输出 x3
- planning 原始输出 x3
- scheduled report 原始输出 x3
- 模糊输出 x2
- 不可适配输出 x2

## 阶段验收标准

- 至少三类 Hermes 输出都能稳定映射到 artifact。
- adaptation 失败时可回放原始输出，不造成静默丢失。
- examples/ 中能看到 artifact 样例。

## 本阶段禁止事项

- 不要在 artifact adapter 中硬编码具体领域业务（finance / ads 等）。
- 不要让 Hermes 输出必须“完美结构化”才能接入。

---

# Phase H3：Hermes claim extractor preset 实现

## 目标

基于 Hermes artifact，为 analysis / planning / scheduled report 三类任务提供最小可用的 Claim 抽取预设。

## 必做内容

### 4.3.1 `adapters/claim-preset/` 实现内容

实现：
- task-type-aware claim extraction preset
- claim type classification
- minimal admission rules
- review_due_at default generation
- extractor fallback

### 4.3.2 最小支持的 claim 类型

第一阶段至少支持：
- judgment_claim
- recommendation_claim
- risk_claim
- prioritization_claim

### 4.3.3 claim 最小字段

至少包含：
- claim_id
- artifact_id
- claim_type
- statement
- confidence（可缺省但需规则处理）
- reviewability
- review_due_at 或 review_window_hint
- evidence_refs（可为空）
- tags
- extraction_metadata

### 4.3.4 admission 最小规则

只做基础规则，不要做完整 Policy Engine：
- statement 不得为空
- statement 不能只是闲聊句
- task_type 必须在可追踪白名单中
- reviewability 必须可判定为 reviewable / weakly_reviewable / not_reviewable

### 4.3.5 examples/ 填充

每个 example 目录下补齐：
- 原始 Hermes 输出
- 适配后的 artifact
- 抽出的 claims
- 说明为什么这些 claims 可追踪

## 阶段验收标准

- analysis / planning / scheduled report 至少各有 1 个 example 能完成 claim 抽取。
- claim 能进入后续 review 流程，不只是静态文本。
- 不可追踪输出不会被误当成高质量 claim。

## 本阶段禁止事项

- 不要把完整 ClaimAdmissionPolicy 硬编码到 integration 层。
- 不要做过度复杂的模型级抽取工作流。

---

# Phase H4：Hermes hint serving endpoint 实现

## 目标

让 Hermes 在任务执行前可选地向 StratOS 拉取 strategy hints，实现最轻量的“受控回流”。

## 必做内容

### 4.4.1 `adapters/hints/` 实现内容

实现：
- hint request parser
- task_type / actor / domain filter
- active hints resolver
- response builder
- empty result handling

### 4.4.2 endpoint 设计

提供：
- `GET /integrations/hermes/strategy-hints`

请求最小参数：
- framework = hermes
- actor_id
- task_type
- optional app_id
- optional domain_tag

返回最小字段：
- `version`
- `hints[]`
- `active_stu_refs[]`
- `route_flags[]`

### 4.4.3 testdata/sample-hints 填充

至少提供：
- empty hints
- single hint
- multi hints
- hints + active_stu_refs
- hints + route_flags

### 4.4.4 scripts/smoke/

提供 hint 拉取 smoke 脚本：
- 请求 analysis hints
- 请求 planning hints
- 请求 empty hints

## 阶段验收标准

- endpoint 能稳定返回空结构，而不是 500。
- Hermes 或 mock client 可以根据 task_type 拉取 hints。
- hints 的返回格式固定并与 API_SPEC 一致。

## 本阶段禁止事项

- 不要在 hint serving endpoint 中实现完整 Strategy Compiler。
- 不要把 STU 全对象返回给 Hermes。
- 不要让 Hermes 理解 PromotionDecision。

---

# Phase H5：integration kit 文档、脚本与样例补齐

## 目标

把 `integrations/hermes/` 做成一个真正可被 Hermes 消费的接入包，而不是只有代码。

## 必做内容

### 4.5.1 README / INSTALL / SMOKE_TEST 打通

必须确保：
- 按文档顺序可以跑通
- 文档步骤和脚本命令一致
- 示例路径存在
- 配置字段真实可用

### 4.5.2 examples/ 三套示例补齐

必须完整交付：
- `examples/analysis-task/`
- `examples/planning-task/`
- `examples/scheduled-report/`

每套 example 至少包含：
- task description
- sample Hermes input
- sample event payloads
- sample artifact
- sample claims
- sample hint request / response

### 4.5.3 TROUBLESHOOTING 补齐

必须覆盖：
- endpoint 不可达
- invalid event payload
- task_type 未配置
- artifact adaptation fail
- no claims extracted
- empty hints
- bad config path

### 4.5.4 CHANGELOG 初始化

记录当前版本交付内容：
- v0.1.0
- 已支持 task types
- 已支持 event types
- 已知限制

## 阶段验收标准

- 不看源码，仅依赖 `integrations/hermes/` 内容，可以完成最小接入演练。
- smoke scripts 与 examples 能自洽。

## 本阶段禁止事项

- 不要引入新的大范围设计。
- 不要重构前面已经稳定的接口命名。

---

# Phase H6：受控环境自接入试点支持

## 目标

让 Hermes 能在受控测试环境中，根据 integration kit 自行实施最小桥接接入。

## 必做内容

### 4.6.1 docs/security-and-sandboxing.md 完善

明确规定：
- 受控目录
- 受控权限
- 可修改文件范围
- 不允许跨目录任意改写
- 失败时的回滚方式

### 4.6.2 self-integration checklist

在 docs 中加入一份试点执行清单，供 Hermes 自行读取：
- 先读 README / INSTALL / CONFIG.example
- 先跑 mock event
- 再接真实 analysis task
- 再接真实 planning task
- 不允许直接接所有 task

### 4.6.3 setup 脚本

在 `scripts/setup/` 中提供最小 setup 脚本：
- 初始化测试环境
- 写入样例配置
- 检查 endpoint 健康状态

## 阶段验收标准

- 一个 Hermes 实例在测试服务器上，能依据 integration kit 跑通最小接入实施。
- 整个过程不需要修改 StratOS core。
- 失败时可以按文档恢复。

## 本阶段禁止事项

- 不要把“agent 自读文档完成接入”当成生产级正式能力。
- 不要宣称 Hermes 已原生支持 StratOS。

---

## 5. 推荐开发顺序（严格执行）

Codex 必须按以下顺序开发，不要跳步：

1. Phase H0 文档与接口基线对齐
2. Phase H1 ingest adapter
3. Phase H2 artifact adapter
4. Phase H3 claim extractor preset
5. Phase H4 hint serving endpoint
6. Phase H5 文档、脚本、examples、testdata 补齐
7. Phase H6 受控环境自接入试点支持

不得先做 H4 再回头补 H1/H2。
不得先做“智能 hint”而忽略 artifact / claim 主干。

---

## 6. 每阶段的工程记忆记录要求

每完成一个阶段，必须将工程状态追加写入项目的开发记忆文档（如项目中已有 `docs/development-memory.md`，优先使用该文件）。

每次记录至少包含：
- 完成了什么
- 新增了哪些文件
- 哪些接口已稳定
- 哪些仍是 stub
- 当前未解决问题
- 下一阶段要做什么

这是强制要求，不得省略。

---

## 7. 最终交付完成定义

当以下条件全部成立时，可视为 `integrations/hermes/` 第一版 kit 开发完成：

1. 四个核心子模块全部具备最小可运行实现。
2. analysis / planning / scheduled_report 三类任务都有 example。
3. 四类事件都有合法样例和 mock 脚本。
4. hint serving endpoint 稳定可用。
5. 文档、配置、脚本和测试数据相互一致。
6. Hermes 可以在受控测试环境中，依据 integration kit 自行完成最小接入演练。
7. 全过程不依赖修改 Hermes core，不依赖修改 StratOS core schema。

---

## 8. Codex 最后提醒

本次任务不是做“漂亮架构图”，而是做一个真正可消费的 integration kit。

你的输出必须优先满足：
- 可执行
- 可验证
- 可调试
- 可回放
- 可失败开放

如果遇到抽象设计冲动，请优先选择：

> 更简单、能跑、能演示、能让 Hermes 按文档接入

而不是：

> 更大、更抽象、但短期不可落地的设计。

