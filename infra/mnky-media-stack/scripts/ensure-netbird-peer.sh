#!/usr/bin/env bash
# Idempotent: bring NetBird up with setup key + management URL from env files.
# On the MOOD-MNKY media LXC, place NETBIRD_SETUP_TOKEN and NETBIRD_MANAGEMENT_URL
# in /opt/mnky-media-stack/.env.secrets (copy from private datacenter.env).
#
# Docs: https://docs.netbird.io/get-started/install/linux
# Example:
#   netbird up --setup-key "<token>" --management-url "https://netbird.example.com"
set -euo pipefail
STACK="${STACK:-/opt/mnky-media-stack}"
TOKEN=""
MGMT=""
for f in "$STACK/.env.secrets" "$STACK/.env"; do
  [[ -f "$f" ]] || continue
  # shellcheck disable=SC1090
  set +u
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ "$line" == *"="* ]] || continue
    k="${line%%=*}"
    v="${line#*=}"
    k="${k// /}"
    v="${v//\"/}"
    v="${v//\'/}"
    case "$k" in
      NETBIRD_SETUP_TOKEN) [[ -z "$TOKEN" && -n "$v" ]] && TOKEN="$v" ;;
      NETBIRD_MANAGEMENT_URL) [[ -z "$MGMT" && -n "$v" ]] && MGMT="$v" ;;
    esac
  done <"$f"
  set -u
done

if ! command -v netbird >/dev/null 2>&1; then
  echo "netbird not installed. Install with: curl -fsSL https://pkgs.netbird.io/install.sh | sh" >&2
  exit 1
fi

if [[ -z "$TOKEN" ]]; then
  echo "NETBIRD_SETUP_TOKEN not set in .env.secrets or .env; skipping netbird up." >&2
  netbird status 2>&1 || true
  exit 0
fi

args=(up --setup-key "$TOKEN")
if [[ -n "$MGMT" ]]; then
  args+=(--management-url "$MGMT")
fi

echo "Running: netbird up --setup-key <redacted>${MGMT:+ --management-url $MGMT}"
netbird "${args[@]}"
netbird status
