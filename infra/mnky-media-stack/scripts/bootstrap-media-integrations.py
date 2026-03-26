#!/usr/bin/env python3
"""
Wire Prowlarr ↔ Sonarr/Radarr/Lidarr and configure Jellyseerr (Jellyfin + *arr).

Secrets (never commit):
  Load order: /opt/mnky-media-stack/.env.secrets → .env → environment variables.

Required in those files:
  JELLYFIN_API_KEY
  JELLYFIN_URL          Public https URL for Jellyfin (e.g. https://media.moodmnky.com) for Jellyseerr → Jellyfin
  JELLYSEERR_PUBLIC_URL Public https URL for Jellyseerr itself (e.g. https://mediarequest.moodmnky.com).
                        Sets settings.json main.applicationUrl (links, OAuth). Default: https://mediarequest.moodmnky.com
  Optional internal URL for Docker-to-Docker (default):
  JELLYFIN_INTERNAL_HOST=jellyfin
  JELLYFIN_INTERNAL_PORT=8096

Jellyseerr local admin (created if no users exist):
  JELLYSEERR_ADMIN_EMAIL   default: simeon.bowman@moodmnky.com
  JELLYSEERR_ADMIN_USERNAME default: admin
  JELLYSEERR_ADMIN_PASSWORD default: JELLYFIN_PASSWORD if set, else required

Idempotent where possible: skips Prowlarr apps that already exist; skips Jellyseerr user insert if users exist.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

STACK = Path("/opt/mnky-media-stack")


def load_env_files() -> dict[str, str]:
    out: dict[str, str] = {}
    for name in (".env.secrets", ".env"):
        path = STACK / name
        if not path.is_file():
            continue
        for line in path.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, _, v = line.partition("=")
            k, v = k.strip(), v.strip().strip('"').strip("'")
            if k:
                out[k] = v
    # datacenter typo: JELLYSEER_* (one R) → JELLYSEERR_*
    for bad, good in (
        ("JELLYSEER_ADMIN_EMAIL", "JELLYSEERR_ADMIN_EMAIL"),
        ("JELLYSEER_ADMIN_PASSWORD", "JELLYSEERR_ADMIN_PASSWORD"),
        ("JELLYSEER_USERNAME", "JELLYSEERR_ADMIN_USERNAME"),
        ("JELLYSEERR_USERNAME", "JELLYSEERR_ADMIN_USERNAME"),
        ("JELLYSEER_PUBLIC_URL", "JELLYSEERR_PUBLIC_URL"),
    ):
        if bad in out and good not in out:
            out[good] = out[bad]
    for k, v in os.environ.items():
        if k.startswith("JELLYFIN_") or k.startswith("JELLYSEERR_") or k.startswith("JELLYSEER_") or k.startswith("QB_"):
            if v:
                out[k] = v
    return out


def api_key_xml(app: str) -> str:
    xml = (STACK / "config" / app / "config.xml").read_text()
    m = re.search(r"<ApiKey>([^<]+)</ApiKey>", xml)
    if not m:
        raise SystemExit(f"Missing ApiKey in {app}/config.xml")
    return m.group(1)


def http_json(
    method: str,
    url: str,
    headers: dict[str, str],
    body: dict | None = None,
    timeout: int = 120,
) -> dict | list:
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
    except urllib.error.HTTPError as e:
        err = e.read().decode()[:6000]
        raise SystemExit(f"HTTP {e.code} {url}: {err}") from e
    if not raw:
        return {}
    return json.loads(raw.decode())


def prowlarr_request(method: str, path: str, pkey: str, body: dict | None = None) -> dict | list:
    return http_json(
        method,
        f"http://127.0.0.1:9696/api/v1{path}",
        {"X-Api-Key": pkey, "Content-Type": "application/json"},
        body,
    )


def ensure_prowlarr_app(
    pkey: str,
    implementation: str,
    name: str,
    base_url: str,
    app_api_key: str,
) -> None:
    apps = prowlarr_request("GET", "/applications", pkey)
    if not isinstance(apps, list):
        raise SystemExit("Prowlarr /applications unexpected")
    if any(a.get("name") == name for a in apps):
        print(f"Prowlarr: application '{name}' already exists")
        return
    schemas = prowlarr_request("GET", "/applications/schema", pkey)
    if not isinstance(schemas, list):
        raise SystemExit("Prowlarr schema unexpected")
    tmpl = next((x for x in schemas if x.get("implementation") == implementation), None)
    if not tmpl:
        raise SystemExit(f"No schema for {implementation}")
    body = json.loads(json.dumps(tmpl))
    body.pop("presets", None)
    body["name"] = name
    body["syncLevel"] = "fullSync"
    body["enable"] = True
    for f in body["fields"]:
        n = f["name"]
        if n == "prowlarrUrl":
            f["value"] = "http://prowlarr:9696"
        elif n == "baseUrl":
            f["value"] = base_url
        elif n == "apiKey":
            f["value"] = app_api_key
    prowlarr_request("POST", "/applications", pkey, body)
    print(f"Prowlarr: added application '{name}'")


def prowlarr_sync_apps(pkey: str) -> None:
    prowlarr_request(
        "POST",
        "/command",
        pkey,
        {"name": "ApplicationIndexerSync"},
    )
    print("Prowlarr: ApplicationIndexerSync dispatched")


def bcrypt_hash(password: str) -> str:
    out = subprocess.check_output(
        [
            "docker",
            "exec",
            "jellyseerr",
            "node",
            "-e",
            f"require('bcrypt').hash(process.argv[1],10).then(console.log)",
            password,
        ],
        text=True,
    ).strip()
    if not out.startswith("$2"):
        raise SystemExit("bcrypt hash failed")
    return out


def jellyseerr_user_count() -> int:
    import sqlite3

    db = STACK / "config/jellyseerr/db/db.sqlite3"
    con = sqlite3.connect(str(db))
    try:
        n = con.execute("SELECT COUNT(*) FROM user").fetchone()[0]
    finally:
        con.close()
    return int(n)


def jellyseerr_compose(*args: str) -> None:
    subprocess.run(
        ["docker", "compose", "-f", str(STACK / "docker-compose.yml"), *args],
        cwd=STACK,
        check=True,
    )


def jellyseerr_insert_admin_row(email: str, username: str, password_hash: str) -> None:
    import sqlite3

    db = STACK / "config/jellyseerr/db/db.sqlite3"
    con = sqlite3.connect(str(db))
    try:
        con.execute(
            """
            INSERT INTO user (email, username, permissions, password, userType, avatar, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, 1, '', datetime('now'), datetime('now'))
            """,
            (email, username, 1610612734, password_hash),
        )
        con.commit()
    finally:
        con.close()
    print(f"Jellyseerr: created local admin user {email} (username={username!r})")


def jellyfin_docker_api(path: str, jf_api_key: str) -> dict:
    out = subprocess.check_output(
        [
            "docker",
            "exec",
            "jellyfin",
            "curl",
            "-sS",
            f"http://127.0.0.1:8096{path}",
            "-H",
            f"X-Emby-Token: {jf_api_key}",
        ],
        text=True,
    )
    return json.loads(out)


def jellyseerr_patch_settings_json(
    *,
    env: dict[str, str],
    jf_key: str,
    jf_url: str,
    seerr_public_url: str,
    internal_host: str,
    internal_port: int,
    rkey: str,
    skey: str,
) -> None:
    """Merge Jellyfin / *arr into settings.json (API /settings/* returns 403 without CSRF)."""
    path = STACK / "config/jellyseerr/settings.json"
    data = json.loads(path.read_text())
    pub = jellyfin_docker_api("/System/Info/Public", jf_key)
    folders = jellyfin_docker_api("/Library/MediaFolders", jf_key)
    libs: list[dict] = []
    for item in folders.get("Items", []):
        iid = item.get("Id") or item.get("ItemId")
        if iid:
            libs.append({"id": str(iid), "name": item.get("Name", "Library"), "enabled": True})

    data["jellyfin"] = {
        "name": pub.get("ServerName", "Jellyfin"),
        "ip": internal_host,
        "port": internal_port,
        "useSsl": False,
        "urlBase": "",
        "externalHostname": jf_url.rstrip("/"),
        "jellyfinForgotPasswordUrl": "",
        "libraries": libs,
        "serverId": pub.get("Id", ""),
        "apiKey": jf_key,
    }
    data["radarr"] = [
        {
            "name": "Radarr",
            "hostname": "radarr",
            "port": 7878,
            "apiKey": rkey,
            "useSsl": False,
            "baseUrl": "",
            "activeProfileId": 4,
            "activeProfileName": "HD-1080p",
            "activeDirectory": "/movies",
            "minimumAvailability": "released",
            "is4k": False,
            "isDefault": True,
        }
    ]
    data["sonarr"] = [
        {
            "name": "Sonarr",
            "hostname": "sonarr",
            "port": 8989,
            "apiKey": skey,
            "useSsl": False,
            "baseUrl": "",
            "activeProfileId": 4,
            "activeProfileName": "HD-1080p",
            "activeLanguageProfileId": 1,
            "activeDirectory": "/tv",
            "is4k": False,
            "enableSeasonFolders": True,
            "isDefault": True,
        }
    ]
    data.setdefault("public", {})["initialized"] = True
    # Jellyseerr's own public base URL (not Jellyfin — used for invites, redirects, OAuth).
    data.setdefault("main", {})["applicationUrl"] = seerr_public_url.rstrip("/")

    path.write_text(json.dumps(data, indent=1) + "\n")
    print(
        "Jellyseerr: wrote settings.json (Jellyfin + Radarr + Sonarr + initialized; applicationUrl="
        + seerr_public_url.rstrip("/")
        + ")",
    )


def main() -> int:
    env = load_env_files()
    jf_key = env.get("JELLYFIN_API_KEY")
    jf_url = env.get("JELLYFIN_URL", "").strip()
    if not jf_key or not jf_url:
        print(
            "Set JELLYFIN_API_KEY and JELLYFIN_URL in .env.secrets or .env (copy from datacenter.env).",
            file=sys.stderr,
        )
        return 1

    internal_host = env.get("JELLYFIN_INTERNAL_HOST", "jellyfin")
    internal_port = int(env.get("JELLYFIN_INTERNAL_PORT", "8096"))

    admin_email = env.get("JELLYSEERR_ADMIN_EMAIL", "simeon.bowman@moodmnky.com")
    admin_user = env.get("JELLYSEERR_ADMIN_USERNAME", "admin")
    admin_pass = env.get("JELLYSEERR_ADMIN_PASSWORD") or env.get("JELLYFIN_PASSWORD")
    if not admin_pass:
        print("Set JELLYSEERR_ADMIN_PASSWORD or JELLYFIN_PASSWORD for Jellyseerr admin.", file=sys.stderr)
        return 1

    seerr_public = (
        env.get("JELLYSEERR_PUBLIC_URL")
        or env.get("JELLYSEERR_URL_PUBLIC")
        or ""
    ).strip()
    if not seerr_public:
        seerr_public = "https://mediarequest.moodmnky.com"

    # --- Prowlarr ---
    pkey = api_key_xml("prowlarr")
    skey = api_key_xml("sonarr")
    rkey = api_key_xml("radarr")
    lkey = api_key_xml("lidarr")

    ensure_prowlarr_app(pkey, "Sonarr", "Sonarr", "http://sonarr:8989", skey)
    ensure_prowlarr_app(pkey, "Radarr", "Radarr", "http://radarr:7878", rkey)
    ensure_prowlarr_app(pkey, "Lidarr", "Lidarr", "http://lidarr:8686", lkey)
    prowlarr_sync_apps(pkey)

    # --- Jellyseerr (settings API uses CSRF; we merge settings.json + optional SQLite admin) ---
    jellyseerr_compose("stop", "jellyseerr")
    time.sleep(2)
    if jellyseerr_user_count() == 0:
        jellyseerr_compose("start", "jellyseerr")
        time.sleep(8)
        pw_hash = bcrypt_hash(admin_pass)
        jellyseerr_compose("stop", "jellyseerr")
        time.sleep(2)
        jellyseerr_insert_admin_row(admin_email, admin_user, pw_hash)
    else:
        print("Jellyseerr: users already exist — skipping admin insert")

    jellyseerr_patch_settings_json(
        env=env,
        jf_key=jf_key,
        jf_url=jf_url,
        seerr_public_url=seerr_public,
        internal_host=internal_host,
        internal_port=internal_port,
        rkey=rkey,
        skey=skey,
    )
    jellyseerr_compose("start", "jellyseerr")
    time.sleep(6)

    print("Done. Log in to Jellyseerr with email:", admin_email, "| username:", admin_user)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
