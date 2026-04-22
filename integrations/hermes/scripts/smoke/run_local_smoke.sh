#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
EVENT_FILE="$ROOT_DIR/testdata/sample-events/task_completed.json"
BASE_URL="${STRATOS_BASE:-http://localhost:8080}"
API_KEY="${STRATOS_API_KEY:-replace-with-real-key}"

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required" >&2
  exit 1
fi

echo "[1/2] POST /v1/bridge/events"
curl -sS -o /tmp/hermes_event_resp.json -w "%{http_code}" \
  -X POST "$BASE_URL/v1/bridge/events" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  --data-binary "@$EVENT_FILE" > /tmp/hermes_event_code.txt
EVENT_CODE="$(cat /tmp/hermes_event_code.txt)"
echo "status=$EVENT_CODE"

echo "[2/2] GET /v1/bridge/strategy-hints"
curl -sS -o /tmp/hermes_hint_resp.json -w "%{http_code}" \
  "$BASE_URL/v1/bridge/strategy-hints?tenant_id=demo&task_type=analysis" \
  -H "Authorization: Bearer $API_KEY" > /tmp/hermes_hint_code.txt
HINT_CODE="$(cat /tmp/hermes_hint_code.txt)"
echo "status=$HINT_CODE"

if [[ "$EVENT_CODE" != "202" || "$HINT_CODE" != "200" ]]; then
  echo "Smoke test failed: expected event=202 and hints=200" >&2
  exit 2
fi

echo "Smoke test passed."
