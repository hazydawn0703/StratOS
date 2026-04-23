# EVENT SCHEMA

Hermes 发送到 StratOS ingest 的标准事件协议。

- schema version: `hermes.events.v0.1`
- supported framework: `hermes`

## Shared envelope

```json
{
  "schema_version": "hermes.events.v0.1",
  "event_id": "evt_123",
  "event_type": "task.started",
  "occurred_at": "2026-04-22T12:00:00Z",
  "framework": "hermes",
  "tenant_id": "demo",
  "task_id": "task_123",
  "session_id": "sess_456",
  "actor_id": "agent_001",
  "channel": "default",
  "payload": {}
}
```

## Event types（固定四类）

- `task.started`
- `task.completed`
- `task.feedback`
- `outcome.available`

## Payload requirements

### `task.started`

- `task_type` (`analysis` | `planning` | `scheduled_report`)
- `raw_input_summary` (string)
- `model_metadata` (object, optional)
- `timestamps` (object, optional)

### `task.completed`

- `task_type` (`analysis` | `planning` | `scheduled_report`)
- `status` (`success` | `failed`)
- `raw_output_inline` (string/object, optional)
- `raw_output_ref` (string, optional)
- `model_metadata` (object, optional)
- `timestamps` (object, optional)

> `raw_output_inline` 与 `raw_output_ref` 至少提供一个。

### `task.feedback`

- `task_type` (`analysis` | `planning` | `scheduled_report`)
- `feedback_type` (`user` | `operator` | `automated`)
- `signal` (`positive` | `negative` | `neutral`)
- `notes` (string, optional)

### `outcome.available`

- `task_type` (`analysis` | `planning` | `scheduled_report`)
- `outcome_type` (string)
- `outcome_value` (string | number | object)
- `recorded_at` (ISO8601)

## Validation expectation

- 缺失字段 -> `400 invalid_payload`
- 未支持 event type -> `400 unsupported_event_type`
- 未支持 task type -> `400 unsupported_task_type`
