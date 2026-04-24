#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-${STRATOS_BASE:-http://localhost:8080}}"
API_KEY="${STRATOS_API_KEY:-replace-with-real-key}"

curl -sS "$BASE_URL/integrations/hermes/strategy-hints?framework=hermes&actor_id=agent_002&task_type=planning" \
  -H "Authorization: Bearer $API_KEY"
echo
