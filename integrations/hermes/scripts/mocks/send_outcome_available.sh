#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-${STRATOS_BASE:-http://localhost:8080}}"
API_KEY="${STRATOS_API_KEY:-replace-with-real-key}"

read -r -d '' PAYLOAD <<'JSON' || true
{
  "schema_version": "hermes.events.v0.1",
  "event_id": "evt_outcome_mock_001",
  "event_type": "outcome.available",
  "occurred_at": "2026-04-24T09:00:00Z",
  "framework": "hermes",
  "tenant_id": "demo",
  "task_id": "task_mock_001",
  "session_id": "sess_mock_001",
  "actor_id": "agent_mock_001",
  "channel": "default",
  "payload": {
    "task_type": "analysis",
    "outcome_type": "kpi_movement",
    "outcome_value": {
      "metric": "conversion_rate",
      "delta": 0.012
    },
    "recorded_at": "2026-04-24T09:00:00Z"
  }
}
JSON

curl -sS -X POST "$BASE_URL/integrations/hermes/events" \
  -H "Authorization: Bearer $API_KEY" \
  -H 'Content-Type: application/json' \
  -d "$PAYLOAD"
echo
