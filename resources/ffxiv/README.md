# FFXIV resources

Reference data and overlay source for ACT, FFLogs, Cactbot, and overlays. When an FFXIV app exists in the monorepo, overlays can be copied into its `public/overlays/` for serving.

## Structure

- **`overlays/`** — Source for ACT/OverlayPlugin overlays (HTML, CSS, JS). Each overlay lives in its own subfolder (e.g. `miniparse/`, `current-pull/`, `act-connection-test/`). Use `tools/ffxiv/copy-overlays.mjs` to copy into an app’s `public/overlays/` when that app is present.
- **`references/`** — Encounter IDs, job IDs, and zone IDs aligned with Cactbot and FFLogs. Used by overlays and any FFXIV app for consistent naming and filters.

## Overlay development

- Overlays are single-page HTML (optionally with linked CSS/JS). They must load OverlayPlugin’s [common.min.js](https://overlayplugin.github.io/OverlayPlugin/assets/shared/common.min.js) and use `addOverlayListener()` and `startOverlayEvents()`.
- See [OverlayPlugin developer docs](https://overlayplugin.github.io/OverlayPlugin/devs/) and [event types](https://overlayplugin.github.io/OverlayPlugin/devs/event_types.html).
- Use with **OverlayPlugin (hibiyasleep)** when using Cactbot.

## References

- [OverlayPlugin](https://overlayplugin.github.io/OverlayPlugin/) (ngld/hibiyasleep)
- [Cactbot](https://ezsoftware.github.io/cactbot/) — raid timelines, triggers, job gauges
- [Cactbot Advanced Usage](https://ezsoftware.github.io/cactbot/AdvancedCactbot.html) — user directory, custom triggers
- [cactbot-user-template](https://github.com/MaikoTan/cactbot-user-template), [quisquous/cactbot-user](https://github.com/quisquous/cactbot-user) — custom overlay examples
- [act-overlays](https://github.com/cking/act-overlays) — overlay collection reference

## Testing connection to ACT

To verify ACT and OverlayPlugin are sending data:

1. **In OverlayPlugin:** Open the **WSServer** tab and start the WebSocket server (default port **10501**).
2. **In a browser:** Open the **act-connection-test** overlay with the overlay WebSocket URL as a query parameter:
   - If you serve the overlay from a local server (e.g. from an app’s `public/overlays/` or any static server), open:
     `http://localhost:PORT/overlays/act-connection-test/?OVERLAY_WS=ws://127.0.0.1:10501/ws`
   - Or open the file directly and add the query string (some browsers allow `file:///.../act-connection-test/index.html?OVERLAY_WS=ws://127.0.0.1:10501/ws`; if that fails, use a local HTTP server).
3. **Quick local server (from repo root):** Run `npx serve resources/ffxiv/overlays -p 3456` then open [http://localhost:3456/act-connection-test/?OVERLAY_WS=ws://127.0.0.1:10501/ws](http://localhost:3456/act-connection-test/?OVERLAY_WS=ws://127.0.0.1:10501/ws).
4. The test page will show **Connected** and encounter/combatant data once ACT is in combat and sending MiniParse data. If you see **No data yet** after a few seconds, confirm ACT is parsing (FFXIV plugin, “Parse from network”) and that the overlay URL in OverlayPlugin points at the same overlay when using it inside ACT.
