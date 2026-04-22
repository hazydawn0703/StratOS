# CHANGELOG

## v0.1.2 - 2026-04-22

### Added

- 新增 `adapters/artifact/` 最小可运行实现：
  - 输出格式识别（text/markdown/object/json-string）
  - `task_type -> artifact_type` 映射
  - artifact schema/metadata 构建
  - adaptation failure fallback（保留 raw output + failure record）
- 新增 artifact adapter 单元测试：`tests/hermes-artifact-adapter.test.mjs`。
- 扩充 `testdata/sample-outputs/`：
  - analysis x3
  - planning x3
  - scheduled_report x3
  - 模糊输出 x2
  - 不可适配输出 x2
- 在 `examples/analysis-task/`、`examples/planning-task/`、`examples/scheduled-report/` 中补充 raw output 与 artifact 示例。

### Known limitations

- 目前 fallback record 为适配层输出，尚未接入统一持久化故障队列。
- claim preset 与 hints endpoint 在后续 Phase 继续实现。

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
