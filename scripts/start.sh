#!/bin/sh
# Production entrypoint:
#  1) If LITESTREAM_REPLICA_URL is set and an existing backup is available,
#     restore the SQLite db before booting (only when local file is missing).
#  2) Boot Next.js standalone server.
#  3) When LITESTREAM_REPLICA_URL is set, stream WAL segments to S3 in the
#     background so we always have a near-zero-RPO backup.

set -e

DB_PATH="${DB_PATH:-/data/app.db}"

if [ -n "${LITESTREAM_REPLICA_URL:-}" ]; then
  if [ ! -f "$DB_PATH" ]; then
    echo "[start] no local db; attempting litestream restore"
    litestream restore -if-replica-exists -config /etc/litestream.yml "$DB_PATH" || \
      echo "[start] no replica to restore from; starting fresh"
  fi
  echo "[start] launching litestream replica in background"
  litestream replicate -config /etc/litestream.yml &
fi

exec node server.js
