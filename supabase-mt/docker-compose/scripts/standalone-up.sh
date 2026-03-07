#!/usr/bin/env bash
# =============================================================================
# standalone-up.sh — Start self-hosted Supabase (from temp) then this compose
# =============================================================================
# Prerequisites:
#   - Docker and Docker Compose
#   - In temp/supabase/docker: .env present (copy from .env.example, run ./utils/generate-keys.sh)
#   - In this directory (docker-compose): .env with SUPABASE_MODE=self_hosted and
#     NEXT_PUBLIC_SUPABASE_MT_URL set to your Kong URL (e.g. https://supabase.yourdomain.com)
# Usage: run from docker-compose/ or repo root: ./scripts/standalone-up.sh
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$COMPOSE_DIR/.." && pwd)"
SUPABASE_DOCKER_DIR="$REPO_ROOT/temp/supabase/docker"

cd "$COMPOSE_DIR"

if [[ ! -f "$COMPOSE_DIR/.env" ]]; then
  echo "Error: $COMPOSE_DIR/.env not found. Copy .env.example to .env and set SUPABASE_MODE=self_hosted and NEXT_PUBLIC_SUPABASE_MT_URL." >&2
  exit 1
fi

if ! grep -q 'SUPABASE_MODE=self_hosted' "$COMPOSE_DIR/.env" 2>/dev/null; then
  echo "Warning: SUPABASE_MODE is not self_hosted in .env. Standalone expects self_hosted." >&2
fi

if ! grep -q 'NEXT_PUBLIC_SUPABASE_MT_URL=' "$COMPOSE_DIR/.env" 2>/dev/null || [[ -z "$(grep 'NEXT_PUBLIC_SUPABASE_MT_URL=' "$COMPOSE_DIR/.env" | cut -d= -f2- | xargs)" ]]; then
  echo "Error: Set NEXT_PUBLIC_SUPABASE_MT_URL in .env (e.g. https://supabase.yourdomain.com)." >&2
  exit 1
fi

if [[ ! -d "$SUPABASE_DOCKER_DIR" ]]; then
  echo "Error: Supabase docker dir not found: $SUPABASE_DOCKER_DIR" >&2
  exit 1
fi

if [[ ! -f "$SUPABASE_DOCKER_DIR/.env" ]]; then
  echo "Error: $SUPABASE_DOCKER_DIR/.env not found. Copy .env.example to .env there and run ./utils/generate-keys.sh." >&2
  exit 1
fi

echo "Starting Supabase stack (temp/supabase/docker)..."
cd "$SUPABASE_DOCKER_DIR"
docker compose -f docker-compose.yml -f docker-compose.s3.yml up -d

echo "Starting MOOD MNKY compose (Flowise, n8n, Postgres, Redis, MinIO)..."
cd "$COMPOSE_DIR"
docker compose up -d

echo "Done. Supabase (Kong) and this stack are running. Ensure Portal .env uses the same NEXT_PUBLIC_SUPABASE_MT_URL and anon/service keys."
