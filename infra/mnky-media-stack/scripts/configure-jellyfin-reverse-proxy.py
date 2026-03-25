#!/usr/bin/env python3
"""
Patch Jellyfin network.xml for HTTPS reverse proxy access (e.g. Traefik at 10.0.0.25).

Sets:
  - KnownProxies: trust X-Forwarded-* from the proxy LAN IP
  - EnablePublishedServerUriByRequest: use Host / forwarded host for published URLs

Does not set BaseUrl (Jellyfin stays at site root https://media.example.com/).

Restart Jellyfin after changes (optional --restart).

  python3 scripts/configure-jellyfin-reverse-proxy.py --proxy-ip 10.0.0.25 --restart
"""
from __future__ import annotations

import argparse
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

STACK = Path("/opt/mnky-media-stack")


def _find_or_create(parent: ET.Element, tag: str) -> ET.Element:
    el = parent.find(tag)
    if el is None:
        el = ET.SubElement(parent, tag)
    return el


def patch_network_xml(path: Path, proxy_ips: list[str], published_by_request: bool) -> bool:
    tree = ET.parse(path)
    root = tree.getroot()

    kp = _find_or_create(root, "KnownProxies")
    existing = {(c.text or "").strip() for c in kp.findall("string")}
    changed = False
    for ip in proxy_ips:
        ip = ip.strip()
        if not ip or ip in existing:
            continue
        s = ET.SubElement(kp, "string")
        s.text = ip
        existing.add(ip)
        changed = True

    pub = root.find("EnablePublishedServerUriByRequest")
    if pub is None:
        pub = ET.SubElement(root, "EnablePublishedServerUriByRequest")
    want = "true" if published_by_request else "false"
    if (pub.text or "").lower() != want:
        pub.text = want
        changed = True

    if changed:
        tree.write(path, encoding="utf-8", xml_declaration=True)
    return changed


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--proxy-ip",
        action="append",
        default=[],
        help="Reverse proxy IP (repeatable). Default: 10.0.0.25",
    )
    ap.add_argument(
        "--stack",
        type=Path,
        default=STACK,
        help="Media stack directory",
    )
    ap.add_argument(
        "--no-published-by-request",
        action="store_true",
        help="Do not set EnablePublishedServerUriByRequest=true",
    )
    ap.add_argument("--restart", action="store_true", help="docker compose restart jellyfin")
    args = ap.parse_args()

    ips = args.proxy_ip if args.proxy_ip else ["10.0.0.25"]
    net = args.stack / "config/jellyfin/network.xml"
    if not net.is_file():
        print(f"Missing {net}", file=sys.stderr)
        return 1

    changed = patch_network_xml(
        net,
        ips,
        published_by_request=not args.no_published_by_request,
    )
    if changed:
        print(f"Jellyfin: updated {net} (KnownProxies + published URI by request)")
    else:
        print(f"Jellyfin: {net} already matched; no write")

    if args.restart:
        subprocess.run(
            ["docker", "compose", "-f", str(args.stack / "docker-compose.yml"), "restart", "jellyfin"],
            cwd=args.stack,
            check=True,
        )
        print("Jellyfin: container restarted")
    elif changed:
        print("Restart Jellyfin for changes to apply: docker compose restart jellyfin", file=sys.stderr)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
