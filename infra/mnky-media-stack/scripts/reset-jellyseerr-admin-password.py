#!/usr/bin/env python3
"""
Sync the Jellyseerr local admin row in SQLite: email, username, bcrypt password.

Use when login fails, you changed Jellyfin password, or you need a new email/username.

Loads .env.secrets then .env (same as bootstrap-media-integrations).

  JELLYSEERR_ADMIN_EMAIL     default simeon.bowman@moodmnky.com
  JELLYSEERR_ADMIN_USERNAME  default admin
  JELLYSEERR_ADMIN_PASSWORD  or JELLYFIN_PASSWORD (required)

Stops jellyseerr briefly to write the DB safely. Updates the first user row (lowest id),
which is the usual single local admin.
"""
from __future__ import annotations

import os
import subprocess
import sys
import time
from pathlib import Path

STACK = Path("/opt/mnky-media-stack")

DEFAULT_EMAIL = "simeon.bowman@moodmnky.com"
DEFAULT_USERNAME = "admin"


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
    aliases = (
        ("JELLYSEER_ADMIN_EMAIL", "JELLYSEERR_ADMIN_EMAIL"),
        ("JELLYSEER_ADMIN_PASSWORD", "JELLYSEERR_ADMIN_PASSWORD"),
        ("JELLYSEER_USERNAME", "JELLYSEERR_ADMIN_USERNAME"),
        ("JELLYSEERR_USERNAME", "JELLYSEERR_ADMIN_USERNAME"),
    )
    for bad, good in aliases:
        if bad in out and good not in out:
            out[good] = out[bad]
    for k, v in os.environ.items():
        if k.startswith("JELLYFIN_") or k.startswith("JELLYSEERR_") or k.startswith("JELLYSEER_"):
            if v:
                out[k] = v
    return out


def bcrypt_hash(password: str) -> str:
    out = subprocess.check_output(
        [
            "docker",
            "exec",
            "jellyseerr",
            "node",
            "-e",
            "require('bcrypt').hash(process.argv[1],10).then(console.log)",
            password,
        ],
        text=True,
    ).strip()
    if not out.startswith("$2"):
        raise SystemExit("bcrypt hash failed (is jellyseerr container running?)")
    return out


def jellyseerr_compose(*args: str) -> None:
    subprocess.run(
        ["docker", "compose", "-f", str(STACK / "docker-compose.yml"), *args],
        cwd=STACK,
        check=True,
    )


def main() -> int:
    env = load_env_files()
    email = env.get("JELLYSEERR_ADMIN_EMAIL", DEFAULT_EMAIL)
    username = env.get("JELLYSEERR_ADMIN_USERNAME", DEFAULT_USERNAME)
    pw = env.get("JELLYSEERR_ADMIN_PASSWORD") or env.get("JELLYFIN_PASSWORD")
    if not pw:
        print(
            "Set JELLYSEERR_ADMIN_PASSWORD or JELLYFIN_PASSWORD in .env.secrets / .env.",
            file=sys.stderr,
        )
        return 1

    import sqlite3

    db_path = STACK / "config/jellyseerr/db/db.sqlite3"
    if not db_path.is_file():
        print(f"Missing {db_path}; run bootstrap-media-integrations.py first.", file=sys.stderr)
        return 1

    jellyseerr_compose("start", "jellyseerr")
    time.sleep(6)
    try:
        h = bcrypt_hash(pw)
    finally:
        jellyseerr_compose("stop", "jellyseerr")
        time.sleep(2)

    con = sqlite3.connect(str(db_path))
    try:
        row = con.execute("SELECT id FROM user ORDER BY id ASC LIMIT 1").fetchone()
        if not row:
            print("No rows in user table; run bootstrap-media-integrations.py first.", file=sys.stderr)
            jellyseerr_compose("start", "jellyseerr")
            return 1
        uid = row[0]
        con.execute(
            """
            UPDATE user
            SET email = ?, username = ?, password = ?, updatedAt = datetime('now')
            WHERE id = ?
            """,
            (email, username, h, uid),
        )
        con.commit()
    finally:
        con.close()

    jellyseerr_compose("start", "jellyseerr")
    print(f"Jellyseerr: synced local user id={uid} email={email!r} username={username!r}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
