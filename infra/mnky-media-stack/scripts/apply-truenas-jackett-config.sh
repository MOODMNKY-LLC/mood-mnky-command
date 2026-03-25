#!/usr/bin/env bash
# Merge Jackett data from a TrueNAS rsync export into ./config/jackett (linuxserver image).
# Run from /opt/mnky-media-stack after:
#   docker compose up -d jackett   # creates /config skeleton
#
# Expects export at: ./ _truenas-export/jackett/ (gitignored; rsync from TrueNAS)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${ROOT}/_truenas-export/jackett"
DEST="${ROOT}/config/jackett"

if [[ ! -d "${SRC}/Indexers" ]]; then
  echo "Missing ${SRC}/Indexers — copy TrueNAS Jackett/Jackett here first (see README)." >&2
  exit 1
fi

mkdir -p "${DEST}/Jackett"
echo "Copying indexer definitions..."
rm -rf "${DEST}/Jackett/Indexers"
cp -a "${SRC}/Indexers" "${DEST}/Jackett/"

if [[ -f "${SRC}/ServerConfig.json" ]]; then
  echo "Patching ServerConfig.json (port 9117, bind all interfaces)..."
  export ROOT
  python3 - << 'PY'
import json, os, pathlib
root = pathlib.Path(os.environ["ROOT"])
src = root / "_truenas-export/jackett/ServerConfig.json"
dst = root / "config/jackett/Jackett/ServerConfig.json"
data = json.loads(src.read_text())
data["Port"] = 9117
# Listen on all interfaces inside the container (TrueNAS used 127.0.0.1 + custom port).
data.pop("LocalBindAddress", None)
dst.parent.mkdir(parents=True, exist_ok=True)
dst.write_text(json.dumps(data, indent=4) + "\n")
print(f"Wrote {dst}")
PY
fi

echo "Done. Restart Jackett: docker compose restart jackett"
echo "Then open http://<host>:9117 — use existing API key from ServerConfig or reset in UI."
echo "Update Prowlarr Torznab URL for 'Jackett - All Indexers' to match this instance."
