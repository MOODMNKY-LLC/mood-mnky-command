# Why Ember Overlay Has So Much Complexity (and It’s Not “Just One HTML Page”)

## Short answer

**No — Ember is not “just one HTML page.”** The URL loads a single `index.html`, but that page bootstraps a **full React single-page application (SPA)**. All the menus, toggles, tabs, and logic live in that app, which is built from many source files into one or more JavaScript bundles.

## How Ember is built

- **Stack:** React, Redux, React Router, Semantic UI React, Chart.js, etc. (see [ffxiv-ember-overlay package.json](https://github.com/GoldenChrysus/ffxiv-ember-overlay)).
- **Build:** Create React App (CRA) with craco. `npm run build` produces static assets: `index.html`, `static/js/main.*.js`, chunks, CSS.
- **What you see at the URL:** One `index.html` that loads the compiled JS/CSS. The “one page” is the shell; the real app (components, state, routing) is in the bundle(s).
- **Where the complexity lives:** `src/components`, `src/redux`, `src/services`, `src/helpers`, etc. — menus, toggles, settings, and OverlayPlugin integration are all inside that React app.

So the complexity comes from it being a **full React SPA**, not from the HTML file itself.

## How this compares to Hydaelyn’s ingest overlay

- **Hydaelyn act-ingest:** A single HTML file + one small script. No framework; it only loads OverlayPlugin’s `common.min.js`, registers `CombatData` and `startOverlayEvents()`, and POSTs to the ingest API. No menus or toggles.
- **Ember:** Same OverlayPlugin API (`addOverlayListener`, `startOverlayEvents()`), but wrapped in a large React app that adds UI, state, and features.

For **only** sending combat data to Hydaelyn, the minimal overlay is enough. If you want an Ember-like experience (menus, toggles, multiple views), you’d need a similar SPA (e.g. React) and build step; the overlay URL would still be “one HTML page” that loads that built app.
