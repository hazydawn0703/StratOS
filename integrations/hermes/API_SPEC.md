# API SPEC

Hermes bridge 与 StratOS 之间的 HTTP 接口约定（Phase H0 基线）。

## Versions

- bridge version: `hermes-bridge.v0.1`
- event schema version: `hermes.events.v0.1`
- hint response version: `hermes.hints.v0.1`

## Base URL

`{strat_os_endpoint}`（来自 `CONFIG.example.yaml`）

## Auth

- `Authorization: Bearer <api_key>`
- `Content-Type: application/json`

## Endpoints

### `POST /integrations/hermes/events`

用途：接收 Hermes 生命周期事件。

#### Request body

- 单个 event envelope，结构遵循 `EVENT_SCHEMA.md`

#### Responses

- `202 Accepted`: event accepted/queued
- `400 Bad Request`: schema validation failed
- `401 Unauthorized`: invalid or expired credential
- `429 Too Many Requests`: throttled
- `5xx`: transient server-side issue

### `GET /integrations/hermes/strategy-hints`

用途：在任务执行前拉取可选策略提示。

#### Query params

- `framework` (required, must be `hermes`)
- `actor_id` (required)
- `task_type` (required, `analysis` | `planning` | `scheduled_report`)
- `app_id` (optional)
- `domain_tag` (optional)

#### 200 Example

```json
{
  "version": "hermes.hints.v0.1",
  "hints": [
    {
      "hint_id": "hint_001",
      "priority": 10,
      "content": "For risk analysis include downside scenario ranges.",
      "expires_at": "2026-05-01T00:00:00Z"
    }
  ],
  "active_stu_refs": ["stu_2026_04_risk_range"],
  "route_flags": ["prefer_risk_checklist"]
}
```

## Idempotency and retry

- 客户端必须生成唯一 `event_id`。
- 服务端按 `(tenant_id, event_id)` 去重。
- 客户端仅对 `429` 和 `5xx` 重试（指数退避）。
- `400/401` 先修正请求后再重发。

## Fail-open requirement

StratOS endpoint 不可达时，Hermes 不得中断原任务执行；应记录桥接错误并继续主流程。
