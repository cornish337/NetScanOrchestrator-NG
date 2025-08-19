#!/usr/bin/env bash
set -euo pipefail

CONF=ops/nginx.conf
DOC=docs/install.md

if [ ! -f "$CONF" ]; then
  echo "No nginx.conf found" >&2; exit 1
fi
if [ ! -f "$DOC" ]; then
  echo "No docs/install.md found" >&2; exit 1
fi

# Extract proxy_pass targets from nginx.conf
PROXIES=$(grep -E 'proxy_pass' "$CONF" | sed -E 's/.*proxy_pass +([^;]+);/\1/' | sort -u)
echo "Proxy targets in nginx.conf: $PROXIES"

for p in $PROXIES; do
  if ! grep -q "$p" "$DOC"; then
    echo "Docs missing proxy target $p" >&2
    exit 1
  fi
done

echo "Drift guard: docs mention all proxy targets."
