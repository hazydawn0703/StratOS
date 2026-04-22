#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-${STRATOS_BASE:-http://localhost:8080}}"
API_KEY="${STRATOS_API_KEY:-replace-with-real-key}"

EVENT_FILE="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/testdata/sample-events/task_completed_analysis_001.json"

curl -sS -X POST "$BASE_URL/integrations/hermes/events" \
  -H "Authorization: Bearer $API_KEY" \
  -H 'Content-Type: application/json' \
  --data-binary "@$EVENT_FILE"
echo
