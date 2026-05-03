# Launchpad — Chrome New Tab Extension

A polished, Material Design 3 new tab page with a dynamic time-of-day background. Three vertical panels packed with everyday utilities: search, weather, sites, downloads, notes, and tasks.

![Three panels: hero with greeting/search/clock/weather, sites with most-visited and favorites, downloads with recent files and quick notes/todo](#)

## Features

### Panel 1 — Hero (Now)
- **Personalised greeting** that adapts to the time of day (Good morning / afternoon / evening / night)
- **Search bar** with smart URL detection (typing `github.com` navigates directly; typing words searches)
  - Switchable engines: Google, DuckDuckGo, Brave, Bing
  - Live **search suggestions** dropdown powered by Google Suggest (use ↑/↓ to navigate)
  - Press `/` anywhere on the page to instantly focus the search bar
- **Live clock** with seconds, full date, 12 / 24 hour toggle
- **Current weather** with animated SVG icons (sun rays rotate, rain drops fall, lightning flashes, fog drifts…)
  - Inline summary + collapsible 5-day forecast
  - Humidity & wind chips
  - °C / °F and km/h / mph toggle in settings
- **Dynamic gradient background** that shifts through 9 stages across the day (sunrise → midday → golden hour → dusk → night)
- **Settings panel** (floating gear button, bottom-right): name, units, clock format, section visibility, data export/import, reset

### Panel 2 — Sites
- **Most Visited** — your 12 most-visited sites from Chrome's `topSites`
- **Favorites** — manually pinned sites, fully editable
  - Click `+` to add
  - Hover for ✏️ edit and ✕ delete
  - **Drag and drop to reorder**
  - Validation, autosave, syncs across devices

### Panel 3 — Downloads & Notes & Tasks
- **Recent Downloads** — 10 most recent in a 2-column grid
  - Colour-coded icons by file type (pdf, image, zip, doc, video, code…)
  - Size + relative time ("2h ago"), state dot (green/red/pulsing teal)
  - **Left-click** = show in folder
  - **Right-click** = context menu: Open file · Show in folder · Copy filename · Remove from list
- **Quick Notes** — autosaving sticky notes
  - Inline title + body, auto-resizing textarea
  - 6 colour accents (teal, indigo, green, amber, rose, purple) with edge strip
  - **Drag and drop to reorder**
  - Live timestamp updates as you type
- **To-do list** — checklist with strikethrough
  - Type a task and press Enter to add
  - Click the checkbox to toggle done (with check animation)
  - Click any task to edit inline
  - Sweep button clears all completed tasks at once

### Polish
- **Material Design 3** light theme throughout, with proper tonal surfaces, elevation, and ripple effects
- **Empty-state illustrations** in every empty section, each with a friendly hint
- All your data (favorites, notes, todos, settings) syncs across devices via `chrome.storage.sync`

## Installation

1. **Download / unzip** the folder somewhere permanent on your machine.
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **"Load unpacked"** and select the `newtab-extension` folder.
5. Open a new tab — you should see Launchpad immediately.

## Permissions

| Permission | Why |
|------------|-----|
| `topSites` | Reads your most-visited URLs (no history content, just URLs and titles) |
| `downloads` | Reads recent download metadata, opens files, and shows them in Finder/Explorer |
| `geolocation` | Gets your coordinates for the weather forecast — asked once by Chrome |
| `storage` | Saves your favorites, notes, todos, and settings; syncs them across devices |

### External services

- **Weather data** — [Open-Meteo](https://open-meteo.com) (free, no API key required)
- **Reverse geocoding** (turning coords into a city name) — [Nominatim / OpenStreetMap](https://nominatim.org) (free)
- **Favicons** — Google's public favicon service
- **Search suggestions** — Google Suggest API
- **Search results** — whichever engine you've selected (defaults to Google)

No analytics, no tracking, no telemetry. The extension has no background scripts.

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `/` | Focus the search bar |
| `↑` / `↓` | Navigate search suggestions |
| `Enter` | Run the highlighted suggestion (or your typed query) |
| `Escape` | Close any open dialog (search suggestions, settings, favorite editor) |

## Settings

Click the floating ⚙️ gear button in the bottom-right of the hero panel to open settings:

- **Name** — appears in the greeting
- **Temperature** — °C / °F (weather refetches automatically)
- **Clock format** — 24-hour / 12-hour
- **Wind speed** — km/h / mph
- **Show seconds, greeting, search bar, weather** — toggle individual sections
- **Export data** — downloads a JSON backup of all your favorites, notes, todos, and settings
- **Import data** — restores from a JSON backup file (overwrites current data)
- **Reset all settings** — restores defaults (your favorites/notes/todos are kept)

## Data storage

All persistent data lives under these keys in `chrome.storage.sync`:

| Key | Contents |
|-----|----------|
| `launchpad_settings` | All settings (name, units, clock format, section visibility) |
| `launchpad_favorites` | Your manually pinned favorite sites |
| `launchpad_notes` | Your quick notes |
| `launchpad_todos` | Your to-do tasks |
| `launchpad_engine` | Selected search engine |

Sync storage caps at ~100 KB total — plenty for thousands of items in normal use.

## Technical notes

- **Manifest V3** — no background scripts, content scripts, or service workers
- **No build step** — pure HTML / CSS / vanilla JS
- **Offline-friendly** — the page renders instantly from the local extension; only weather and search suggestions hit the network
- All weather icons are inline SVG with CSS animations (no image files)

## Notes

- Weather requires allowing location when Chrome prompts. If you denied it, click "Allow location" in the weather panel.
- Top sites are populated by Chrome's built-in `topSites` API — the list may be empty on a fresh profile until you've browsed a few sites.
- Your data syncs across all Chrome profiles signed into the same Google account, so favorites and notes appear on every device automatically.
