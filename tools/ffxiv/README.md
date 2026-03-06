# FFXIV tools

Scripts and tooling for the FFXIV overlay workflow and a future FFXIV app.

## Scripts

- **`copy-overlays.mjs`** — Copies overlay files from `resources/ffxiv/overlays/` to a target app’s `public/overlays/` (e.g. `apps/hydaelyn/public/overlays/` when that app exists). Run from repo root: `node tools/ffxiv/copy-overlays.mjs`. If the destination app is not present, the script exits without error.
