#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-${STRATOS_BASE:-http://localhost:8080}}"
API_KEY="${STRATOS_API_KEY:-replace-with-real-key}"

read -r -d '' PAYLOAD <<'JSON' || true
{
  "schema_version": "hermes.events.v0.1",
  "event_id": "evt_feedback_mock_001",
  "event_type": "task.feedback",
  "occurred_at": "2026-04-22T12:10:00Z",
  "framework": "hermes",
  "tenant_id": "demo",
  "task_id": "task_mock_001",
  "session_id": "sess_mock_001",
  "actor_id": "agent_mock_001",
  "channel": "default",
  "payload": {
    "task_type": "analysis",
    "feedback_type": "user",
    "signal": "positive",
    "notes": "The scenario section was actionable."
  }
}
JSON

curl -sS -X POST "$BASE_URL/integrations/hermes/events" \
  -H "Authorization: Bearer $API_KEY" \
  -H 'Content-Type: application/json' \
  -d "$PAYLOAD"
echo
