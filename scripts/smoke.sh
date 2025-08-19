
#!/usr/bin/env bash
set -euo pipefail
BASE_URL=${BASE_URL:-http://localhost:8080}
API_URL=${API_URL:-$BASE_URL/api}
RETRIES=${RETRIES:-60}
SLEEP=${SLEEP:-2}

say() { echo "[smoke] $*"; }
check() {
  local url="$1"; shift
  say "GET $url"
  http_code=$(curl -s -o /tmp/out.txt -w "%{http_code}" "$url" || true)
  cat /tmp/out.txt
  [[ "$http_code" =~ ^2 ]] || { echo "Non-2xx from $url: $http_code" >&2; return 1; }
}

wait_http() {
  local url="$1"
  for i in $(seq 1 "$RETRIES"); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      say "Ready: $url"; return 0; fi
    say "Waiting for $url ($i/$RETRIES)"; sleep "$SLEEP"
  done
  echo "Timed out waiting for $url" >&2; return 1
}

say "Smoke start: BASE=$BASE_URL API=$API_URL"
wait_http "$BASE_URL/"
check "$BASE_URL/"

# Prefer an explicit health endpoint if present
if curl -fsS "$API_URL/health" >/dev/null 2>&1; then
  check "$API_URL/health"
fi

# OpenAPI should be available if FastAPI is used
check "$API_URL/docs"

# Minimal create project → start scan flow (best-effort; tolerate 404/405 by skipping)
if curl -s -o /dev/null -w "%{http_code}" "$API_URL/projects" | grep -qE '^(200|404)$'; then
  say "Attempting project create"
  CREATE=$(curl -fsS -H 'Content-Type: application/json' -d '{"name":"ci-smoke","description":"CI smoke"}' "$API_URL/projects" || true)
  echo "$CREATE"
  PROJ_ID=$(echo "$CREATE" | jq -r '.id // .project_id // empty')
  if [[ -n "${PROJ_ID:-}" ]]; then
    say "Project id: $PROJ_ID"
    if curl -s -o /dev/null -w "%{http_code}" "$API_URL/scans/start" | grep -qE '^(200|404|405)$'; then
      say "Attempting scan start"
      START=$(curl -fsS -H 'Content-Type: application/json' -d '{"project_id":'\"$PROJ_ID\"',\"targets\":[\"127.0.0.1\"],\"profile\":\"quick\"}' "$API_URL/scans/start" || true)
      echo "$START"
    fi
  fi
fi

say "Smoke OK"
