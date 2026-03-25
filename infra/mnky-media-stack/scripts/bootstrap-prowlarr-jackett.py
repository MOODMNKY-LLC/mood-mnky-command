#!/usr/bin/env python3
"""
Add Prowlarr "Generic Torznab" indexer pointing at the local Jackett "all" feed.

Requires:
  - Jackett running with config at ./config/jackett/Jackett/ServerConfig.json (API key present)
  - Prowlarr running; reads API key from ./config/prowlarr/config.xml

Idempotent: skips if an indexer named "Jackett (all)" already exists.
"""
from __future__ import annotations

import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

STACK = Path("/opt/mnky-media-stack")


def api_key_prowlarr() -> str:
    xml = (STACK / "config/prowlarr/config.xml").read_text()
    m = re.search(r"<ApiKey>([^<]+)</ApiKey>", xml)
    if not m:
        raise SystemExit("Prowlarr ApiKey missing")
    return m.group(1)


def jackett_api_key() -> str:
    p = STACK / "config/jackett/Jackett/ServerConfig.json"
    if not p.is_file():
        raise SystemExit(f"Missing {p} — start Jackett once or run apply-truenas-jackett-config.sh")
    data = json.loads(p.read_text())
    key = data.get("APIKey")
    if not key:
        raise SystemExit("Jackett ServerConfig.json has no APIKey")
    return key


def request_json(method: str, url: str, key: str, body: dict | None = None) -> dict | list:
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={"X-Api-Key": key, "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            raw = resp.read()
    except urllib.error.HTTPError as e:
        err = e.read().decode()[:4000]
        raise SystemExit(f"Prowlarr API HTTP {e.code}: {err}") from e
    if not raw:
        return {}
    return json.loads(raw.decode())


def main() -> int:
    pkey = api_key_prowlarr()
    base = "http://127.0.0.1:9696/api/v1"

    existing = request_json("GET", f"{base}/indexer", pkey)
    if not isinstance(existing, list):
        raise SystemExit("Unexpected /indexer response")
    if any(x.get("name") == "Jackett (all)" for x in existing):
        print("Prowlarr: indexer 'Jackett (all)' already exists — nothing to do.")
        return 0

    jkey = jackett_api_key()
    schemas = request_json("GET", f"{base}/indexer/schema", pkey)
    if not isinstance(schemas, list):
        raise SystemExit("Unexpected schema response")
    tmpl = next((x for x in schemas if x.get("name") == "Generic Torznab"), None)
    if not tmpl:
        raise SystemExit("Generic Torznab schema not found")

    body = json.loads(json.dumps(tmpl))
    body.pop("presets", None)
    body["name"] = "Jackett (all)"
    body["enable"] = True
    body["appProfileId"] = 1
    body["priority"] = 15
    for f in body["fields"]:
        n = f["name"]
        if n == "baseUrl":
            f["value"] = "http://jackett:9117"
        elif n == "apiPath":
            f["value"] = "/api/v2.0/indexers/all/results/torznab/"
        elif n == "apiKey":
            f["value"] = jkey
        elif n == "torrentBaseSettings.preferMagnetUrl":
            f["value"] = True

    request_json("POST", f"{base}/indexer", pkey, body)
    print("Prowlarr: added Torznab indexer 'Jackett (all)' → http://jackett:9117 (sync apps when ready).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
