# StratOS × Hermes Integration Kit

`integrations/hermes/` 提供一个**可选启用、低侵入、fail-open** 的桥接层，让 Hermes 的部分高价值任务进入 StratOS 治理闭环。

## Integration baseline (Phase H0)

- bridge version: `hermes-bridge.v0.1`
- event schema version: `hermes.events.v0.1`
- hint response version: `hermes.hints.v0.1`
- artifact adaptation preset version: `hermes.artifact.v0.1`
- claim preset version: `hermes.claim-preset.v0.1`

## 目标与边界

### Hermes 继续负责

- agent execution
- tools / skills / memory
- sessions / channels / cron
- runtime UX and orchestration

### StratOS 继续负责

- TaskContext / StrategyArtifact / StrategyClaim
- OutcomeReview / ErrorPattern / STU lifecycle
- Evaluation / Experiment / Promotion / Rollback

### 本集成目录负责

- Hermes ingest adapter（事件接入）
- Hermes artifact adapter（输出到 artifact）
- Hermes claim extractor preset（最小 claim 抽取预设）
- Hermes hint serving endpoint（任务前策略提示）

> 本目录不改 Hermes core，不改 StratOS core schema 语义，不在 `apps/*` 放置 Hermes 逻辑。

## v0 task types（统一命名）

- `analysis`
- `planning`
- `scheduled_report`

详见 [`TASK_TYPE_GUIDE.md`](./TASK_TYPE_GUIDE.md)。

## v0 event types（统一命名）

- `task.started`
- `task.completed`
- `task.feedback`
- `outcome.available`

详见 [`EVENT_SCHEMA.md`](./EVENT_SCHEMA.md)。

## API 概览

- ingest endpoint: `POST /integrations/hermes/events`
- hints endpoint: `GET /integrations/hermes/strategy-hints`

详见 [`API_SPEC.md`](./API_SPEC.md)。

## 快速开始

1. 复制配置模板：
   - `cp integrations/hermes/CONFIG.example.yaml /tmp/hermes-stratos.yaml`
2. 按 [`INSTALL.md`](./INSTALL.md) 配置 endpoint / api key。
3. 按 [`SMOKE_TEST.md`](./SMOKE_TEST.md) 运行 smoke 脚本。

## 当前状态

- ✅ Phase H0 文档与接口基线已统一
- ✅ Phase H1 ingest adapter 最小实现已落地
- ⏳ Phase H2-H6 持续推进

更新记录见 [`CHANGELOG.md`](./CHANGELOG.md)。
