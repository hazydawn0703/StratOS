# CHANGELOG

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
