#!/usr/bin/env bash
# Read .env.production.local (gitignored — your real values) and push every
# variable into Fly's secret store with one batched `fly secrets set` call.
# Re-run any time you change a secret.
#
# Setup:
#   cp .env.production.example .env.production.local
#   # Fill in real values
#   ./scripts/fly-set-secrets.sh

set -euo pipefail

ENV_FILE="${1:-.env.production.local}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE. Copy .env.production.example and fill in values."
  exit 1
fi

if ! command -v fly >/dev/null 2>&1; then
  echo "fly CLI not on PATH — install from https://fly.io/docs/flyctl/"
  exit 1
fi

# Build a single `fly secrets set KEY=VAL KEY=VAL ...` invocation so Fly only
# triggers one machine restart instead of one per key.
declare -a kvs=()
while IFS= read -r line; do
  # Skip comments and blank lines.
  [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
  # Skip mock toggles — they must not be set in prod.
  [[ "$line" =~ ^USE_MOCK_DATA= || "$line" =~ ^USE_MOCK_SMS= ]] && continue
  # Skip lines without a value.
  [[ ! "$line" =~ ^[A-Z_][A-Z0-9_]*= ]] && continue
  key="${line%%=*}"
  val="${line#*=}"
  if [ -z "$val" ] || [[ "$val" == *"__REPLACE_ME__"* ]]; then
    echo "skip: $key has placeholder/empty value"
    continue
  fi
  kvs+=("$key=$val")
done < "$ENV_FILE"

if [ ${#kvs[@]} -eq 0 ]; then
  echo "Nothing to push — every var is empty or still a placeholder."
  exit 1
fi

echo "Pushing ${#kvs[@]} secrets to Fly…"
fly secrets set "${kvs[@]}"
echo "Done. Run \`fly deploy\` to ship a new image with these in scope."
