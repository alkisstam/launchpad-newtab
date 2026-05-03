# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Loading the extension

No build step. Load directly in Chrome:
1. Go to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** → select this folder
4. Click **Reload** (↺) after any code change

To test without Chrome APIs, open `newtab.html` directly in the browser — the code falls back to `localStorage` automatically.

## Architecture

This is a **Manifest V3** Chrome extension with no background scripts, no build toolchain, and no dependencies. All logic lives in three files:

- `newtab.html` — static shell; defines all DOM IDs used by JS
- `newtab.js` — all runtime logic, split into 12 numbered sections (see section headers)
- `style.css` — all styles; Material Design 3 light theme

### newtab.js section map

| # | Section | What it does |
|---|---------|--------------|
| 1 | Dynamic Background | Picks gradient from `TIME_THEMES` array based on hour |
| 2 | Greeting | Time-of-day phrase + user name |
| 3 | Clock | 1 s interval; 12/24 h format from settings |
| 4 | Search Bar | URL detection, engine switcher, keyboard shortcut `/` |
| 5 | Weather | Geolocation → Open-Meteo API → inline SVG icons with CSS animations |
| 6 | Top Sites | `chrome.topSites` API, 12-item limit |
| 7 | Recent Downloads | `chrome.downloads` API, right-click context menu |
| 8 | Favorites | CRUD + drag-to-reorder; stored in `chrome.storage.sync` |
| 9 | Quick Notes | CRUD + drag-to-reorder + colour picker; autosave via `debounce` |
| 10 | Search Suggestions | Google Suggest API (`client=firefox`), arrow-key navigation |
| 11 | To-Do List | Add/toggle/inline-edit/delete; stored in `chrome.storage.sync` |
| 12 | Settings Panel | Name, units, toggles, export/import JSON, reset |

### Storage pattern

All persistent data uses a dual-layer pattern: `localStorage` provides instant synchronous render on page load; `chrome.storage.sync` provides cross-device persistence. Every `load*` / `save*` function pair handles both.

Storage keys: `launchpad_settings`, `launchpad_favorites`, `launchpad_notes`, `launchpad_todos`, `launchpad_engine`.

### External services (no API keys required)

- Weather: `api.open-meteo.com`
- Reverse geocoding: `nominatim.openstreetmap.org`
- Favicons: Google's `s2/favicons` service
- Search suggestions: `suggestqueries.google.com`

## Key constraints

- **Manifest V3**: no `eval`, no remote scripts, no background service workers — everything runs in the page context
- `chrome.storage.sync` has a ~100 KB total quota and per-item limits; keep stored values compact
- Weather icons are **inline SVG strings** in `WEATHER_SVG` (newtab.js:307), animated purely with CSS classes (`wi-sun`, `wi-cloud`, `wi-drop`, `wi-bolt`, `wi-fog`, `wi-flake`)
- The `escHtml()` utility must be used before inserting any user-supplied or external string into `innerHTML`
