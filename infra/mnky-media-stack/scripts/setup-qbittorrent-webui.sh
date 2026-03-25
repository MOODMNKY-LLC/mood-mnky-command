#!/usr/bin/env bash
# Run on the LXC host (or any machine with docker access to the stack) after:
#   docker compose up -d
#
# linuxserver/qbittorrent does NOT honor WEBUI_USERNAME/PASSWORD env vars. This script:
# 1) Logs in with the one-time password from container logs (or existing QB_WEBUI_PASSWORD)
# 2) Sets web_ui_password, disables web_ui_host_header_validation (fixes 401 from LAN IP),
#    and enables bypass_local_auth (required for Gluetun port-forward API).
#
# Load secrets from the same .env as docker compose (e.g. /opt/mnky-media-stack/.env).
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -f .env ]]; then
  set -a
  # shellcheck source=/dev/null
  source .env
  set +a
fi

: "${QB_WEBUI_USERNAME:=admin}"
: "${QB_WEBUI_PASSWORD:?Set QB_WEBUI_PASSWORD in .env}"

TMP=$(docker logs qbittorrent 2>&1 | sed -n 's/.*temporary password is provided for this session: \(.*\)/\1/p' | tail -1)
if [[ -n "${TMP}" ]]; then
  PASS="${TMP}"
else
  PASS="${QB_WEBUI_PASSWORD}"
fi

docker exec qbittorrent curl -fsS -c /tmp/qbt-setup.cookies -b /tmp/qbt-setup.cookies \
  -d "username=${QB_WEBUI_USERNAME}&password=${PASS}" \
  "http://127.0.0.1:8080/api/v2/auth/login" >/dev/null

docker exec qbittorrent curl -fsS -b /tmp/qbt-setup.cookies \
  -d "json={\"web_ui_password\":\"${QB_WEBUI_PASSWORD}\",\"web_ui_host_header_validation_enabled\":false,\"bypass_local_auth\":true}" \
  "http://127.0.0.1:8080/api/v2/app/setPreferences" >/dev/null

echo "qBittorrent Web UI: set password, host-header validation off, bypass_local_auth on for Gluetun."

# Gluetun may have run VPN_PORT_FORWARDING_UP_COMMAND before bypass_local_auth existed (API returned 403).
# Restart VPN so the hook runs again, then sync listen_port from /tmp/gluetun/forwarded_port.
echo "Restarting Gluetun to re-run Proton port-forward hook against qBittorrent..."
docker restart gluetun >/dev/null
echo "Waiting for WireGuard and forwarded port..."
for _ in $(seq 1 45); do
  sleep 2
  FP=$(docker exec gluetun cat /tmp/gluetun/forwarded_port 2>/dev/null | tr -d '\n\r' || true)
  if [[ -n "${FP}" && "${FP}" != "0" ]]; then
    docker exec qbittorrent curl -fsS \
      -d "json={\"listen_port\":${FP},\"current_network_interface\":\"tun0\",\"random_port\":false,\"upnp\":false}" \
      "http://127.0.0.1:8080/api/v2/app/setPreferences" >/dev/null
    echo "qBittorrent listen_port synced to Proton forwarded port: ${FP} (interface tun0)."
    exit 0
  fi
done
echo "Warning: forwarded port not ready within ~90s; check Gluetun logs. You can sync manually later:" >&2
echo "  FP=\$(docker exec gluetun cat /tmp/gluetun/forwarded_port) && docker exec qbittorrent curl -fsS -d \"json={\\\"listen_port\\\":\${FP},\\\"current_network_interface\\\":\\\"tun0\\\"}\" http://127.0.0.1:8080/api/v2/app/setPreferences" >&2
exit 0
