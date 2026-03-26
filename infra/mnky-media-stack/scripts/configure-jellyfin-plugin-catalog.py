#!/usr/bin/env python3
"""
Register Jellyfin plugin repositories and optionally install a curated plugin set.

Uses the Jellyfin API (requires admin API key):
  GET/POST  /Repositories
  GET       /Packages
  POST      /Packages/Installed/{name}?assemblyGuid=...

Repository list aligns with https://jellyfin.org/docs/general/server/plugins/ (official + vetted third-party).

Run on the media LXC from /opt/mnky-media-stack (or set JELLYFIN_URL / JELLYFIN_API_KEY).

Examples:
  python3 scripts/configure-jellyfin-plugin-catalog.py --dry-run
  python3 scripts/configure-jellyfin-plugin-catalog.py
  python3 scripts/configure-jellyfin-plugin-catalog.py --with-extras
  python3 scripts/configure-jellyfin-plugin-catalog.py --repositories-only
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

STACK = Path("/opt/mnky-media-stack")

# (display name, manifest URL) — Jellyfin Stable first; rest are documented third-party repos.
DEFAULT_REPOSITORIES: list[tuple[str, str]] = [
    ("Jellyfin Stable", "https://repo.jellyfin.org/files/plugin/manifest.json"),
    (
        "9p4 SSO",
        "https://raw.githubusercontent.com/9p4/jellyfin-plugin-sso/manifest-release/manifest.json",
    ),
    (
        "danieladov Utilities",
        "https://raw.githubusercontent.com/danieladov/JellyfinPluginManifest/master/manifest.json",
    ),
    ("LizardByte", "https://app.lizardbyte.dev/jellyfin-plugin-repo/manifest.json"),
    (
        "Ani-Sync",
        "https://raw.githubusercontent.com/vosmiic/jellyfin-ani-sync/master/manifest.json",
    ),
]

# Exact catalog names from GET /Packages (after repos are registered).
DEFAULT_PLUGINS: list[str] = [
    "TMDb Box Sets",
    "Subtitle Extract",
    "Open Subtitles",
    "Playback Reporting",
    "Trakt",
    "SSO Authentication",
    "Merge Versions",
]

EXTRA_PLUGINS: list[str] = [
    "Skin Manager",
    "Themerr",
    "Ani-Sync",
]


def load_env() -> dict[str, str]:
    out: dict[str, str] = {}
    for name in (".env.secrets", ".env"):
        p = STACK / name
        if not p.is_file():
            continue
        for line in p.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, _, v = line.partition("=")
            k, v = k.strip(), v.strip().strip('"').strip("'")
            if k:
                out[k] = v
    for k, v in os.environ.items():
        if k.startswith("JELLYFIN_") and v:
            out[k] = v
    return out


def http_json(
    method: str,
    url: str,
    *,
    headers: dict[str, str],
    body: object | None = None,
    timeout: int = 300,
) -> tuple[int, object | None]:
    data = None if body is None else json.dumps(body).encode()
    h = dict(headers)
    if body is None and h.get("Content-Type") == "application/json":
        del h["Content-Type"]
    req = urllib.request.Request(url, data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
            code = resp.getcode()
    except urllib.error.HTTPError as e:
        err = e.read().decode()[:8000]
        raise SystemExit(f"HTTP {e.code} {method} {url}: {err}") from e
    if not raw:
        return code, None
    return code, json.loads(raw.decode())


def jellyfin_base(env: dict[str, str]) -> str:
    explicit = (env.get("JELLYFIN_CONFIGURE_URL") or "").strip().rstrip("/")
    if explicit:
        return explicit
    base = (env.get("JELLYFIN_URL") or "").strip().rstrip("/")
    if not base:
        base = "http://127.0.0.1:8096"
    # Public https URL may not allow API from LXC without extra routing; prefer local for this script.
    if base.startswith("https://"):
        base = (env.get("JELLYFIN_LOCAL_URL") or "http://127.0.0.1:8096").strip().rstrip("/")
    return base


def merge_repositories(
    current: list[dict], desired: list[tuple[str, str]]
) -> list[dict]:
    by_url: dict[str, dict] = {}
    for r in current:
        u = (r.get("Url") or "").rstrip("/")
        if not u:
            continue
        by_url[u] = {
            "Name": r.get("Name") or u,
            "Url": r.get("Url"),
            "Enabled": bool(r.get("Enabled", True)),
        }
    for name, url in desired:
        u = url.rstrip("/")
        by_url[u] = {"Name": name, "Url": url, "Enabled": True}
    items = list(by_url.values())
    items.sort(
        key=lambda x: (
            0 if "repo.jellyfin.org" in (x.get("Url") or "") else 1,
            (x.get("Name") or "").lower(),
        )
    )
    return items


def main() -> int:
    ap = argparse.ArgumentParser(description="Configure Jellyfin plugin repositories and optional installs.")
    ap.add_argument("--dry-run", action="store_true", help="Print actions only.")
    ap.add_argument("--repositories-only", action="store_true", help="Do not install plugins.")
    ap.add_argument(
        "--with-extras",
        action="store_true",
        help=f"Also install: {', '.join(EXTRA_PLUGINS)}",
    )
    ap.add_argument(
        "--restart",
        action="store_true",
        help="After installs, run: docker compose restart jellyfin (from stack dir).",
    )
    args = ap.parse_args()

    env = load_env()
    key = env.get("JELLYFIN_API_KEY", "").strip()
    if not key:
        print("Set JELLYFIN_API_KEY in .env.secrets or environment.", file=sys.stderr)
        return 1

    base = jellyfin_base(env)
    hdr = {"X-Emby-Token": key}
    hdr_json = {**hdr, "Content-Type": "application/json"}

    _, cur = http_json("GET", f"{base}/Repositories", headers=hdr)
    if not isinstance(cur, list):
        raise SystemExit("GET /Repositories: unexpected response")

    merged = merge_repositories(cur, DEFAULT_REPOSITORIES)
    if args.dry_run:
        print("[dry-run] POST /Repositories with", len(merged), "entries")
        for r in merged:
            print(f"  - {r['Name']}: {r['Url']}")
    else:
        http_json("POST", f"{base}/Repositories", headers=hdr_json, body=merged)
        print(f"Repositories: set {len(merged)} entries.")

    if args.repositories_only:
        return 0

    _, packages = http_json("GET", f"{base}/Packages", headers=hdr, timeout=600)
    if not isinstance(packages, list):
        raise SystemExit("GET /Packages: unexpected response")

    by_name: dict[str, dict] = {}
    for p in packages:
        n = p.get("name")
        if isinstance(n, str) and n not in by_name:
            by_name[n] = p

    targets = list(DEFAULT_PLUGINS)
    if args.with_extras:
        targets.extend(EXTRA_PLUGINS)

    _, installed = http_json("GET", f"{base}/Plugins", headers=hdr)
    installed_ids = set()
    if isinstance(installed, list):
        for pl in installed:
            i = pl.get("Id")
            if i:
                installed_ids.add(str(i).lower())

    for name in targets:
        pkg = by_name.get(name)
        if not pkg:
            print(f"Skip (not in catalog): {name}", file=sys.stderr)
            continue
        guid = str(pkg.get("guid") or "")
        if guid.lower() in installed_ids:
            print(f"Already installed: {name}")
            continue
        path = urllib.parse.quote(name, safe="")
        url = f"{base}/Packages/Installed/{path}?assemblyGuid={guid}"
        if args.dry_run:
            print(f"[dry-run] POST {url}")
            continue
        code, _ = http_json("POST", url, headers=hdr, body=None)
        if code in (200, 204):
            print(f"Installed (or triggered): {name}")
        else:
            print(f"Unexpected {code} for {name}", file=sys.stderr)

    if args.restart and not args.dry_run:
        import subprocess

        subprocess.run(
            ["docker", "compose", "-f", str(STACK / "docker-compose.yml"), "restart", "jellyfin"],
            cwd=STACK,
            check=False,
        )
        print("Jellyfin restart issued.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
