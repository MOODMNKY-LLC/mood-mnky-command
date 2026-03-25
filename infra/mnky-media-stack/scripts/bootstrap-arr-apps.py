#!/usr/bin/env python3
"""
Add root folders and qBittorrent download clients to Sonarr, Radarr, and Lidarr via API.

Requires:
  - Stack running on the same host (127.0.0.1 ports).
  - /opt/mnky-media-stack/.env with QB_WEBUI_USERNAME and QB_WEBUI_PASSWORD
    (same credentials as scripts/setup-qbittorrent-webui.sh).

Paths match docker-compose volume mounts: /tv, /movies, /music.
Idempotent: skips root folders and QBittorrent clients that already exist.
"""
from __future__ import annotations

import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

STACK = Path("/opt/mnky-media-stack")


def load_env(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    if not path.is_file():
        return out
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        k = k.strip()
        v = v.strip().strip('"').strip("'")
        out[k] = v
    return out


def api_key(app: str) -> str:
    xml = (STACK / "config" / app / "config.xml").read_text()
    m = re.search(r"<ApiKey>([^<]+)</ApiKey>", xml)
    if not m:
        raise SystemExit(f"Missing ApiKey in {app}/config.xml")
    return m.group(1)


def request_json(
    method: str,
    url: str,
    key: str,
    body: dict | None = None,
) -> dict | list:
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={"X-Api-Key": key, "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        raw = resp.read()
    if not raw:
        return {}
    return json.loads(raw.decode())


def merge_qbit_schema(
    schema: dict,
    *,
    name: str,
    host: str,
    port: int,
    username: str,
    password: str,
    field_updates: dict[str, str | int | bool],
) -> dict:
    out = json.loads(json.dumps(schema))
    out.pop("presets", None)
    out["enable"] = True
    out["name"] = name
    for f in out["fields"]:
        if f["name"] in field_updates:
            f["value"] = field_updates[f["name"]]
    field_updates2 = {
        "host": host,
        "port": port,
        "username": username,
        "password": password,
        **field_updates,
    }
    for f in out["fields"]:
        if f["name"] in field_updates2:
            f["value"] = field_updates2[f["name"]]
    return out


def ensure_root(
    base: str,
    key: str,
    path: str,
    label: str,
    *,
    lidarr: bool = False,
) -> None:
    existing = request_json("GET", f"{base}/rootfolder", key)
    if not isinstance(existing, list):
        raise SystemExit(f"{label}: unexpected rootfolder response")
    if any(r.get("path") == path for r in existing):
        print(f"{label}: root folder {path} already present")
        return
    if lidarr:
        body = {
            "name": "Music",
            "path": path,
            "defaultMetadataProfileId": 1,
            "defaultQualityProfileId": 1,
        }
    else:
        body = {"path": path}
    request_json("POST", f"{base}/rootfolder", key, body)
    print(f"{label}: added root folder {path}")


def ensure_qbit(
    base: str,
    key: str,
    label: str,
    user: str,
    password: str,
    extra_fields: dict[str, str | int | bool],
) -> None:
    clients = request_json("GET", f"{base}/downloadclient", key)
    if not isinstance(clients, list):
        raise SystemExit(f"{label}: unexpected downloadclient list")
    if any(c.get("implementation") == "QBittorrent" for c in clients):
        print(f"{label}: qBittorrent download client already present")
        return
    schemas = request_json("GET", f"{base}/downloadclient/schema", key)
    if not isinstance(schemas, list):
        raise SystemExit(f"{label}: unexpected schema")
    qbit = next((x for x in schemas if x.get("implementation") == "QBittorrent"), None)
    if not qbit:
        raise SystemExit(f"{label}: QBittorrent schema not found")
    body = merge_qbit_schema(
        qbit,
        name="qBittorrent",
        host="qbittorrent",
        port=8080,
        username=user,
        password=password,
        field_updates=extra_fields,
    )
    try:
        request_json("POST", f"{base}/downloadclient", key, body)
    except urllib.error.HTTPError as e:
        err = e.read().decode()[:2000]
        raise SystemExit(f"{label}: POST downloadclient failed {e.code}: {err}") from e
    print(f"{label}: added qBittorrent download client (host qbittorrent:8080)")


def main() -> int:
    env = load_env(STACK / ".env")
    user = env.get("QB_WEBUI_USERNAME", "admin")
    password = env.get("QB_WEBUI_PASSWORD")
    if not password:
        print("QB_WEBUI_PASSWORD missing in .env next to docker-compose.yml", file=sys.stderr)
        return 1

    # Sonarr
    sk = api_key("sonarr")
    ensure_root("http://127.0.0.1:8989/api/v3", sk, "/tv", "Sonarr")
    ensure_qbit(
        "http://127.0.0.1:8989/api/v3",
        sk,
        "Sonarr",
        user,
        password,
        {"tvCategory": "tv-sonarr"},
    )

    # Radarr
    rk = api_key("radarr")
    ensure_root("http://127.0.0.1:7878/api/v3", rk, "/movies", "Radarr")
    ensure_qbit(
        "http://127.0.0.1:7878/api/v3",
        rk,
        "Radarr",
        user,
        password,
        {"movieCategory": "radarr"},
    )

    # Lidarr
    lk = api_key("lidarr")
    ensure_root("http://127.0.0.1:8686/api/v1", lk, "/music", "Lidarr", lidarr=True)
    ensure_qbit(
        "http://127.0.0.1:8686/api/v1",
        lk,
        "Lidarr",
        user,
        password,
        {"musicCategory": "lidarr"},
    )

    print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
