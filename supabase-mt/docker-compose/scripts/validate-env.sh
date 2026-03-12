#!/usr/bin/env bash
# =============================================================================
# validate-env.sh — Check required env vars before docker compose up
# =============================================================================
# Run from docker-compose/ or repo root.
# Usage: ./scripts/validate-env.sh
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$COMPOSE_DIR/.env"

ERRORS=0

check_var() {
  local name="$1"
  local optional="${2:-0}"
  local val
  if [[ -f "$ENV_FILE" ]]; then
    val=$(grep -E "^${name}=" "$ENV_FILE" 2>/dev/null | cut -d= -f2- | tr -d '"' | xargs || true)
  fi
  if [[ -z "$val" ]]; then
    val="${!name}"
  fi
  if [[ -z "$val" ]]; then
    if [[ "$optional" -eq 1 ]]; then
      return 0
    fi
    echo "Missing required: $name"
    ERRORS=$((ERRORS + 1))
    return 1
  fi
  return 0
}

cd "$COMPOSE_DIR"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: .env not found. Copy from .env.example: cp .env.example .env"
  exit 1
fi

echo "Validating .env..."

# Core (compose services)
check_var "POSTGRES_PASSWORD"
check_var "POSTGRES_USER"
check_var "FLOWISE_PASSWORD"
check_var "N8N_BASIC_AUTH_PASSWORD"

# Supabase mode
check_var "SUPABASE_MODE"
# When local, prefer having URL/key (warn only)
if grep -qE "^SUPABASE_MODE=local" "$ENV_FILE" 2>/dev/null; then
  check_var "NEXT_PUBLIC_SUPABASE_MT_URL" 1 || true
  if ! grep -qE "^NEXT_PUBLIC_SUPABASE_MT_URL=" "$ENV_FILE" 2>/dev/null; then
    echo "Note: For SUPABASE_MODE=local, run: supabase start --workdir supabase-mt && ./scripts/start-local.sh"
  fi
fi

# Optional: when using S3 storage, MinIO vars should be set
if grep -qE "^FLOWISE_STORAGE_TYPE=s3" "$ENV_FILE" 2>/dev/null || grep -qE "^BINARYDATA_STORAGE_TYPE=s3" "$ENV_FILE" 2>/dev/null; then
  if ! grep -qE "^MINIO_ROOT_USER=" "$ENV_FILE" 2>/dev/null || ! grep -qE "^MINIO_ROOT_PASSWORD=" "$ENV_FILE" 2>/dev/null; then
    echo "Note: Using S3 storage; ensure MINIO_ROOT_USER and MINIO_ROOT_PASSWORD are set in .env"
  fi
fi

if [[ $ERRORS -gt 0 ]]; then
  echo ""
  echo "Validation failed: $ERRORS missing required variable(s)."
  echo "See .env.example for reference."
  exit 1
fi

echo "Validation passed."
