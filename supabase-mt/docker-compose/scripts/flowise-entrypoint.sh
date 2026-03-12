#!/bin/sh
# Flowise entrypoint: use Postgres when reachable, else fall back to SQLite.
# Requires scripts/ mounted at /scripts (e.g. ./scripts:/scripts:ro).
# Pass-through: exec's the image CMD (e.g. pnpm start).

set -e

DB_HOST="${DATABASE_HOST:-postgres}"
DB_PORT="${DATABASE_PORT:-5432}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_PASS="${POSTGRES_PASSWORD:-postgres_password}"
DB_NAME="${FLOWISE_DB_NAME:-flowise}"

# Try TCP connect to Postgres (Node available in Flowise image; no pg_isready needed)
if DB_HOST="$DB_HOST" DB_PORT="$DB_PORT" node -e "
const net = require('net');
const port = parseInt(process.env.DB_PORT, 10) || 5432;
const host = process.env.DB_HOST || 'postgres';
const s = net.createConnection(port, host);
const t = setTimeout(function() { s.destroy(); process.exit(1); }, 5000);
s.on('connect', function() { clearTimeout(t); s.destroy(); process.exit(0); });
s.on('error', function() { clearTimeout(t); process.exit(1); });
" 2>/dev/null; then
  export DATABASE_TYPE=postgres
  export DATABASE_HOST="$DB_HOST"
  export DATABASE_PORT="$DB_PORT"
  export DATABASE_NAME="$DB_NAME"
  export DATABASE_USER="$DB_USER"
  export DATABASE_PASSWORD="$DB_PASS"
  export DATABASE_SSL="${DATABASE_SSL:-false}"
  echo "[flowise-entrypoint] Using Postgres at $DB_HOST:$DB_PORT"
else
  export DATABASE_TYPE=sqlite
  export DATABASE_PATH="${DATABASE_PATH:-/root/.flowise}"
  echo "[flowise-entrypoint] Postgres unreachable; using SQLite at $DATABASE_PATH"
fi

exec "$@"
