# EVENT SCHEMA

Canonical event envelopes emitted from Hermes to StratOS.

## Shared envelope

```json
{
  "event_id": "uuid",
  "event_type": "task.started",
  "occurred_at": "2026-04-22T12:00:00Z",
  "source": "hermes.bridge",
  "tenant_id": "demo",
  "task_id": "task_123",
  "session_id": "sess_456",
  "payload": {}
}
```

## Event types

- `task.started`
- `task.completed`
- `task.feedback`
- `outcome.available`

## Payload requirements

### task.started

- `task_type` (string)
- `input_summary` (string)
- `lineage` (object, optional)

### task.completed

- `status` (`success` | `failed`)
- `output` (string/object)
- `metadata` (object)

### task.feedback

- `feedback_type` (`user` | `operator` | `automated`)
- `signal` (`positive` | `negative` | `neutral`)
- `notes` (string, optional)

### outcome.available

- `outcome_type` (string)
- `outcome_value` (string/number/object)
- `recorded_at` (ISO8601)
