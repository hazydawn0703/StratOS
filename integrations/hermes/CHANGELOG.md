# CHANGELOG

## v0.1.1 - 2026-04-22

### Added

- 新增 `adapters/ingest/` 最小可运行实现：schema 校验、错误模型、Hermes->TaskContext 映射、原始 payload 存档与 ingest service。
- 新增 mock 事件发送脚本：
  - `scripts/mocks/send_task_started.sh`
  - `scripts/mocks/send_task_completed.sh`
  - `scripts/mocks/send_task_feedback.sh`
  - `scripts/mocks/send_outcome_available.sh`
- 扩充 `testdata/sample-events/`：
  - started x2
  - completed x3（analysis / planning / scheduled_report）
  - feedback x2
  - outcome x2
  - 非法示例 x2
- 新增 ingest 适配器单元测试：`tests/hermes-ingest-adapter.test.mjs`。

### Known limitations

- ingest 记录当前为文件归档示例实现，尚未接入持久化数据库。
- artifact/claim/hints 适配器仍在后续 Phase。

## v0.1.0 - 2026-04-22

### Added

- 完成 Phase H0 文档基线统一。
- 补齐 bridge/event/hints/artifact/claim 五个版本标识。
- 统一 task types：`analysis` / `planning` / `scheduled_report`。
- 统一 event types：`task.started` / `task.completed` / `task.feedback` / `outcome.available`。
- 对齐 ingest endpoint 与 hints endpoint 命名：
  - `POST /integrations/hermes/events`
  - `GET /integrations/hermes/strategy-hints`

### Supported in this release

- task types: `analysis`, `planning`, `scheduled_report`
- event types: `task.started`, `task.completed`, `task.feedback`, `outcome.available`

### Known limitations

- adapters 仍处于后续 Phase（H1+）开发阶段。
- 目前以文档与样例约定为主，尚未完成完整运行时实现。
