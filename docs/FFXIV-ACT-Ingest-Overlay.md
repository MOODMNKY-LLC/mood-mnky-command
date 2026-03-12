# FFXIV ACT Ingest Overlay (Hydaelyn)

This document describes how to use the **ACT ingest overlay** with the Hydaelyn app to send live combat data from Advanced Combat Tracker (ACT) and OverlayPlugin to your stream session.

## Overview

The ingest overlay is a small HTML/JS page that:

1. Runs inside ACT’s OverlayPlugin (or in a browser with OverlayPlugin’s WebSocket server).
2. Listens for OverlayPlugin’s `CombatData` events.
3. Throttles and POSTs encounter and combatant data to the Hydaelyn app’s ingest API.
4. Uses an **overlay token** so the backend can associate data with your stream session.

Your **OBS overlay** and **dashboard** can then show pull count, best pull, and last encounter stats from this data.

## Prerequisites

- **ACT** with **OverlayPlugin** installed and the WebSocket server enabled (WSServer tab).
- A **Hydaelyn** stream session and its **overlay token** (from the Hydaelyn dashboard).

## Getting the overlay token

1. Sign in to the Hydaelyn app (same Supabase project as the main site).
2. Open the **Dashboard**.
3. Create a stream session (or use an existing one).
4. Copy the **overlay token** (UUID) or the full **ACT ingest overlay URL** that already includes the token.

## Adding the overlay in OverlayPlugin

1. In ACT, open **Plugins** → **OverlayPlugin** (or the overlay plugin you use).
2. Add a **new overlay** / **new tab**.
3. Set the **URL** to your Hydaelyn ingest overlay URL, for example:
   - **Production:** `https://<your-hydaelyn-host>/overlays/act-ingest/?token=YOUR_OVERLAY_TOKEN`
   - **Local dev:** `http://localhost:3012/overlays/act-ingest/?token=YOUR_OVERLAY_TOKEN`
4. Replace `YOUR_OVERLAY_TOKEN` with the token from the Hydaelyn dashboard.
5. Ensure OverlayPlugin’s **WebSocket server** is enabled (WSServer tab, typically `ws://127.0.0.1:10501/ws`).

The overlay shows **"Awaiting encounter data…"** until ACT sends combat data, then **"Sending…"** / **"Sent to Hydaelyn"**. You can minimize the overlay window; it just needs to receive CombatData and POST to Hydaelyn. (Previously described as: the overlay page will show a short status (“Listening for combat data…”, “Sent to Hydaelyn”, or an error). You can minimize or hide the overlay window; the important part is that it receives CombatData and POSTs to Hydaelyn.

### Using the ingest overlay in OBS (like Ember)

To have the **same** ingest overlay URL receive data when loaded in OBS (or any browser), use OverlayPlugin's **WebSocket server**:

1. In ACT, open **Plugins** → **OverlayPlugin WSServer**, set port (e.g. **10501**), click **Start**.
2. In OBS (or a browser), use the ingest URL **with** the WebSocket param:  
   `http://localhost:3012/overlays/act-ingest/index.html?token=YOUR_TOKEN&OVERLAY_WS=ws://127.0.0.1:10501/ws`
3. The overlay will connect to ACT via WebSocket and receive CombatData, then POST to Hydaelyn.

(Some OverlayPlugin variants use `HOST_PORT` instead of `OVERLAY_WS`; the overlay supports both.)

### Full React overlay (Ember-style parity)

Hydaelyn provides a **React SPA overlay** at `/overlay/act?token=YOUR_TOKEN` that aims for **Ember-style feature parity** (reference only; no source copy). It includes:

- **Parse** — Live DPS table (Name, Job, DPS, Dmg %) from OverlayPlugin CombatData.
- **Healing / Tanking / Raiding / Aggro** — Metric tabs when ACT provides the data.
- **Spell timers** — Placeholder (planned; will use LogLine events).
- **Encounter history** — Last 5 encounters, Clear, and Load sample data for testing.
- **Ingest** — Status and “last sent” for the Hydaelyn ingest.
- **Settings** — Theme (minimal/light/classic), collapse panel, blur names, token copy, OBS/WebSocket hint.
- **Minimize** — Collapse overlay to a strip on the left or right edge.

Use the same token and (for OBS) the same `&OVERLAY_WS=ws://127.0.0.1:10501/ws` query. The dashboard shows both the simple ingest URL and the “ACT overlay (full)” URL. For a comprehensive feature baseline and mapping, see [FFXIV-Overlay-Ember-Baseline.md](FFXIV-Overlay-Ember-Baseline.md).

### Why am I not receiving encounter data? (localhost vs production)

**Deploying to production will not fix "no encounter data".** Ember works because of *how* the overlay is loaded, not because it’s hosted.

You get CombatData in exactly two ways:

1. **Inside ACT (OverlayPlugin)**  
   Add this overlay as a **new overlay tab** in OverlayPlugin and point its URL to your overlay (localhost or production). ACT’s embedded browser receives data from the plugin automatically. No WebSocket param needed.

2. **In OBS or a normal browser**  
   ACT is not hosting the page, so the page must connect to ACT via the **WebSocket server**. You must:
   - In ACT: **Plugins → OverlayPlugin → WSServer** tab → start the server (e.g. port 10501).
   - In the overlay URL add: **`&OVERLAY_WS=ws://127.0.0.1:10501/ws`** (or your WSServer URL).

If you open the overlay in Chrome/Edge without adding it to OverlayPlugin and without `OVERLAY_WS`, you will never get data. Use the overlay’s **connection status** (e.g. “No encounter data yet” / “Receiving encounter data”) to confirm.

A **production URL** is still useful for: a stable OBS Browser Source URL, avoiding mixed content when your app is HTTPS, and sharing the same URL across machines. It does not change whether the overlay receives data.

The overlay loads **ngld's** `common.min.js` by default for compatibility with ngld's OverlayPlugin (used by Ember and many users). If you use the original OverlayPlugin only, replace the script src in the overlay HTML with `https://overlayplugin.github.io/OverlayPlugin/assets/shared/common.min.js`.

## API base URL

The overlay uses the same origin as the page by default. So if you load:

- `https://hydaelyn.example.com/overlays/act-ingest/?token=xxx`

it will POST to:

- `https://hydaelyn.example.com/api/ingest/combat`

For local development, open the overlay at `http://localhost:3012/overlays/act-ingest/?token=xxx` so it posts to `http://localhost:3012/api/ingest/combat`.

You can override the ingest base URL by defining `window.HYDAELYN_INGEST_URL` before the script runs (e.g. in a custom HTML wrapper).

## OBS overlay URL

To show pull stats in OBS:

1. In OBS, add a **Browser** source.
2. Set the URL to: `https://<your-hydaelyn-host>/overlay/stream?token=YOUR_OVERLAY_TOKEN`
3. Use the same overlay token as for the ACT ingest overlay.
4. Resize and position as needed. Optional: add `&theme=light` or `&theme=dark` for appearance.

The overlay page polls the Hydaelyn session stats API and displays pull count, best pull duration, best DPS, and current encounter info.

## Security and rate limiting

- The ingest API validates the **overlay token** and rejects unknown tokens (401).
- Ingest requests are **rate limited** per token to avoid abuse.
- Use **HTTPS** in production so the token is not sent in the clear.

## Troubleshooting

- **“Missing token”** — Add `?token=YOUR_OVERLAY_TOKEN` to the overlay URL.
- **“Invalid overlay token”** — Token not found. Create a stream session in the dashboard and use the token shown there.
- **“Network error”** — The overlay cannot reach the Hydaelyn app. Check URL, CORS (the API allows `*`), and that the app is running.
- **No data in OBS overlay** — Ensure ACT is parsing and the ingest overlay has sent at least one CombatData payload; the OBS overlay polls the stats API every 12 seconds.

## References

- Hydaelyn app: `apps/hydaelyn` in the mood-mnky-command repo.
- Overlay source: `resources/ffxiv/overlays/act-ingest/` (copied to `apps/hydaelyn/public/overlays/` by `tools/ffxiv/copy-overlays.mjs`).
- Ingest API: `POST /api/ingest/combat` (see [Hydaelyn Implementation Plan](Hydaelyn-Implementation-Plan-Revised.md)).
- OverlayPlugin: [OverlayPlugin](https://overlayplugin.github.io/OverlayPlugin/).
