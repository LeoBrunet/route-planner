# Route Planner

Plan bike and running routes anywhere and export GPX. It's a macOS app, also usable in a browser, built on OpenStreetMap, BRouter and the public Strava heatmap. It started as a gravel guide for Göteborg; those extras are still in here.

## What's inside

| Path | What it is |
|---|---|
| `app/` | Native macOS app (Swift, WKWebView). `app/build_app.sh` builds `Route Planner.app`. |
| `web/` | The map and route planner UI in TypeScript (`web/src/`, one module per concern) plus its HTML/CSS shell (`web/index.html`). `scripts/build_page.py` type-checks and bundles it with esbuild, then inlines it with the data into `route-planner.html`. |
| `route-planner.html` | Built page. Open it with `Open Route Planner.command`, which serves it on localhost so routing and location work in Safari. |
| `profiles/` | BRouter profiles (gravel, fastbike, trekking) with an added `cycleway_priority` parameter that penalises car roads without cycle lanes or tracks. `scripts/make_profiles.py` regenerates them. |
| `scripts/route.py` | Command-line route builder: waypoints → GPX plus a surface report (paved / fast gravel / rough / technical). |
| `scripts/longways.py` | Lists the longest gravel roads in a bounding box, useful for choosing waypoints. |
| `gpx/` | Six Göteborg gravel loops and three road loops (`gpx/road/`). |
| `goteborg-gravel-atlas.html` | Static Göteborg surface atlas and resource guide. |
| `data/` | Processed OSM extracts for Göteborg. Raw downloads are git-ignored; recreate them with `scripts/fetch_osm.sh`. |

## Features

- **Modes:** Gravel / Road / Run. Each switches the Strava heatmap, map layers and routing profile.
- **Route planner:** click to add points, drag to move them, click the line to insert one. Shows distance, climbing, % unpaved, % on cycle paths, an elevation profile with a surface strip, and exports GPX.
- **Cycle path priority:** four levels, normal to "whenever possible", for the gravel, road and trekking profiles.
- **Running:** BRouter `hiking-beta` (paths and trails) or `shortest`, with the time estimated from your pace.
- **Surfaces anywhere:** unpaved roads, forest tracks and trails from OpenFreeMap vector tiles.
- **Other:** place search (Nominatim), current position (CoreLocation in the app), satellite, CyclOSM and OSM base maps, OSM GPS traces, Waymarked Trails cycle routes.

## Build

```bash
python3 scripts/build_page.py      # page (needs Node 18+; installs web/ dev dependencies on first run)
app/build_app.sh                   # macOS app (needs Xcode command line tools); also rebuilds the page
```

While working on the UI: `cd web && npm run typecheck`.

## How the macOS app works

The app is a thin native shell around the web page (`app/Sources/main.swift`, ~200 lines of Swift):

1. **Window + WKWebView**: an AppKit window whose content is a WebKit view, the same engine as Safari.
2. **Bundled page**: `build_app.sh` copies `route-planner.html` into `Route Planner.app/Contents/Resources/web/`. The app serves it through its own `gbg://` URL scheme (`WKURLSchemeHandler`), so the page behaves like a real website: it can call BRouter, Nominatim and the tile servers, and keep its settings in localStorage.
3. **Native bridge**: the page posts messages to Swift (`window.webkit.messageHandlers.native`), and Swift answers by running JavaScript.
   - *Location*: CoreLocation gets the position, and the app pushes it to the map with `__loc(lat, lng, accuracy)`.
   - *GPX export*: the page sends the GPX text and the app opens a native Save dialog (`NSSavePanel`).
   - *Links*: Strava, Komoot and Google links open in your default browser.
4. **Bundle**: `build_app.sh` compiles `main.swift` with `swiftc`, generates the icon (`app/tools/make_icon.swift` → `iconutil`), writes `Info.plist` (bundle id, location-permission text) and signs the app ad hoc with `codesign`.

## Data and licences

- Map data © OpenStreetMap contributors (ODbL). Vector tiles © OpenMapTiles / OpenFreeMap.
- Routing: [BRouter](https://github.com/abrensch/brouter) public server.
- Imagery © Esri, Maxar, Earthstar Geographics.
- The Strava heatmap tiles belong to Strava. They load live from Strava's public endpoint for personal viewing and aren't redistributed here.
