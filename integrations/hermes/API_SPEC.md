# API SPEC

HTTP API between Hermes bridge and StratOS backend.

## Base URL

`{strat_os_endpoint}` (configured in `CONFIG.example.yaml`)

## Auth

- Header: `Authorization: Bearer <api_key>`
- Content-Type: `application/json`

## Endpoints

### POST /v1/bridge/events

Ingests bridge lifecycle events.

#### Request body

- single event envelope from `EVENT_SCHEMA.md`

#### Responses

- `202 Accepted` event queued
- `400 Bad Request` validation failure
- `401 Unauthorized` invalid/expired token
- `429 Too Many Requests` throttled
- `5xx` upstream/transient error

### GET /v1/bridge/strategy-hints

Returns active hints for an eligible task.

#### Query params

- `task_type` (required)
- `tenant_id` (required)
- `task_id` (optional)

#### Example response

```json
{
  "hints": [
    {
      "hint_id": "hint_abc",
      "priority": 10,
      "content": "For risk assessments, always include downside scenario ranges.",
      "expires_at": "2026-05-01T00:00:00Z"
    }
  ]
}
```

## Idempotency

- Clients should send unique `event_id`.
- Server deduplicates by `(tenant_id, event_id)`.

## Retry guidance

- Retry on `429` and `5xx` with exponential backoff.
- Do not retry on `400` or `401` without correction.
