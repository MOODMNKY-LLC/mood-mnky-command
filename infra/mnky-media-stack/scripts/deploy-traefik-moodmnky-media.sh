#!/usr/bin/env bash
# Copy moodmnky-media Traefik dynamic config to the proxy host (run from your admin machine with SSH keys).
#
# Usage:
#   export TRAEFIK_SSH=root@10.0.0.25
#   export TRAEFIK_REMOTE_PATH=/etc/traefik/dynamic/moodmnky-media.yml   # optional
#   ./scripts/deploy-traefik-moodmnky-media.sh
#
# Or full destination in one var:
#   TRAEFIK_DEPLOY=root@10.0.0.25:/etc/traefik/dynamic/moodmnky-media.yml ./scripts/deploy-traefik-moodmnky-media.sh
#
# Then reload Traefik on the host (systemctl reload traefik, or docker kill -s HUP <container>).
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STACK_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SRC="${TRAEFIK_SRC:-$STACK_DIR/traefik-dynamic/moodmnky-media.example.yml}"
REMOTE_PATH="${TRAEFIK_REMOTE_PATH:-/etc/traefik/dynamic/moodmnky-media.yml}"
if [[ -n "${TRAEFIK_DEPLOY:-}" ]]; then
  DEST="$TRAEFIK_DEPLOY"
else
  DEST="${TRAEFIK_SSH:?set TRAEFIK_SSH e.g. root@10.0.0.25}:$REMOTE_PATH"
fi
test -f "$SRC" || { echo "missing $SRC" >&2; exit 1; }
scp "$SRC" "$DEST"
echo "Deployed to $DEST — edit entryPoints/certResolver on the host if needed, then reload Traefik."
