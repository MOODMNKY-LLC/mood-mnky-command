#!/usr/bin/env python3
"""
Smoke-test APIs from the LXC host (127.0.0.1) using keys from .env.secrets / .env
or falling back to *arr config.xml.

Exits 0 only if every check passes.

Optional env (override config.xml):
  JELLYFIN_API_KEY, SONARR_API_KEY, RADARR_API_KEY, LIDARR_API_KEY
  QB_WEBUI_USERNAME, QB_WEBUI_PASSWORD (qBittorrent Web UI on host port 8081)
"""
from __future__ import annotations

import http.cookiejar
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

STACK = Path("/opt/mnky-media-stack")
QBIT_HOST_PORT = 8081


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
    for bad, good in (
        ("JELLYSEER_ADMIN_EMAIL", "JELLYSEERR_ADMIN_EMAIL"),
        ("JELLYSEER_ADMIN_PASSWORD", "JELLYSEERR_ADMIN_PASSWORD"),
    ):
        if bad in out and good not in out:
            out[good] = out[bad]
    for k, v in os.environ.items():
        if v and (
            k.startswith("JELLYFIN_")
            or k.startswith("SONARR_")
            or k.startswith("RADARR_")
            or k.startswith("LIDARR_")
            or k.startswith("QB_")
        ):
            out[k] = v
    return out


def api_key_xml(app: str) -> str:
    xml = (STACK / "config" / app / "config.xml").read_text()
    m = re.search(r"<ApiKey>([^<]+)</ApiKey>", xml)
    if not m:
        raise ValueError(f"Missing ApiKey in {app}/config.xml")
    return m.group(1)


def get(url: str, headers: dict[str, str] | None = None, timeout: int = 30) -> tuple[int, str]:
    req = urllib.request.Request(url, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read().decode()[:4000]
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:4000]


def main() -> int:
    env = load_env_files()
    failures: list[str] = []

    def ok(name: str, cond: bool, detail: str) -> None:
        status = "ok" if cond else "FAIL"
        print(f"[{status}] {name}: {detail}")
        if not cond:
            failures.append(name)

    # Jellyfin
    jf = env.get("JELLYFIN_API_KEY")
    if not jf:
        ok("jellyfin", False, "JELLYFIN_API_KEY missing in .env.secrets / .env")
    else:
        code, body = get(
            "http://127.0.0.1:8096/System/Info/Public",
            {"X-Emby-Token": jf},
        )
        pub = {}
        if code == 200:
            try:
                pub = json.loads(body)
            except json.JSONDecodeError:
                pass
        ok(
            "jellyfin",
            code == 200 and bool(pub.get("Id") or pub.get("ServerName")),
            f"HTTP {code} ServerName={pub.get('ServerName', '?')!r}",
        )

    # Sonarr
    try:
        sk = env.get("SONARR_API_KEY") or api_key_xml("sonarr")
    except ValueError as e:
        sk = ""
        ok("sonarr", False, str(e))
    else:
        code, body = get(f"http://127.0.0.1:8989/api/v3/system/status?apikey={urllib.parse.quote(sk)}")
        ok("sonarr", code == 200 and "version" in body.lower(), f"HTTP {code}")

    # Radarr
    try:
        rk = env.get("RADARR_API_KEY") or api_key_xml("radarr")
    except ValueError as e:
        rk = ""
        ok("radarr", False, str(e))
    else:
        code, body = get(f"http://127.0.0.1:7878/api/v3/system/status?apikey={urllib.parse.quote(rk)}")
        ok("radarr", code == 200 and "version" in body.lower(), f"HTTP {code}")

    # Lidarr
    try:
        lk = env.get("LIDARR_API_KEY") or api_key_xml("lidarr")
    except ValueError as e:
        lk = ""
        ok("lidarr", False, str(e))
    else:
        code, body = get(f"http://127.0.0.1:8686/api/v1/system/status?apikey={urllib.parse.quote(lk)}")
        ok("lidarr", code == 200, f"HTTP {code}")

    # Prowlarr (xml only)
    try:
        pk = api_key_xml("prowlarr")
    except ValueError as e:
        ok("prowlarr", False, str(e))
    else:
        code, body = get(f"http://127.0.0.1:9696/api/v1/system/status?apikey={urllib.parse.quote(pk)}")
        ok("prowlarr", code == 200, f"HTTP {code}")

    # Jellyseerr (public status)
    code, body = get("http://127.0.0.1:5055/api/v1/status")
    ok("jellyseerr", code == 200, f"HTTP {code}")

    # qBittorrent (host maps 8081 -> container 8080)
    qu = env.get("QB_WEBUI_USERNAME", "admin")
    qp = env.get("QB_WEBUI_PASSWORD")
    if not qp:
        ok("qbittorrent", False, "QB_WEBUI_PASSWORD missing in .env / .env.secrets")
    else:
        cj = http.cookiejar.CookieJar()
        opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
        login_url = f"http://127.0.0.1:{QBIT_HOST_PORT}/api/v2/auth/login"
        body = urllib.parse.urlencode({"username": qu, "password": qp}).encode()
        req = urllib.request.Request(
            login_url,
            data=body,
            method="POST",
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        try:
            with opener.open(req, timeout=30) as resp:
                c1 = resp.status
                b1 = resp.read().decode()[:500]
        except urllib.error.HTTPError as e:
            c1, b1 = e.code, e.read().decode()[:500]
        ok("qbittorrent-login", c1 == 200, f"HTTP {c1} {b1.strip()[:80]}")
        try:
            with opener.open(
                f"http://127.0.0.1:{QBIT_HOST_PORT}/api/v2/app/version",
                timeout=30,
            ) as resp:
                c2 = resp.status
                b2 = resp.read().decode()[:400]
        except urllib.error.HTTPError as e:
            c2, b2 = e.code, e.read().decode()[:400]
        ok("qbittorrent-api", c2 == 200 and len(b2) > 0, f"HTTP {c2} version={b2.strip()[:40]!r}")

    # *arr → qBittorrent client present
    if sk:
        code, body = get(f"http://127.0.0.1:8989/api/v3/downloadclient?apikey={urllib.parse.quote(sk)}")
        has_qb = code == 200 and "qbittorrent" in body.lower()
        ok("sonarr-qbittorrent-client", has_qb, f"HTTP {code} qBittorrent in list={has_qb}")
    if rk:
        code, body = get(f"http://127.0.0.1:7878/api/v3/downloadclient?apikey={urllib.parse.quote(rk)}")
        has_qb = code == 200 and "qbittorrent" in body.lower()
        ok("radarr-qbittorrent-client", has_qb, f"HTTP {code} qBittorrent in list={has_qb}")
    if lk:
        code, body = get(f"http://127.0.0.1:8686/api/v1/downloadclient?apikey={urllib.parse.quote(lk)}")
        has_qb = code == 200 and "qbittorrent" in body.lower()
        ok("lidarr-qbittorrent-client", has_qb, f"HTTP {code} qBittorrent in list={has_qb}")

    if failures:
        print(f"\nFailed: {', '.join(failures)}", file=sys.stderr)
        return 1
    print("\nAll checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
