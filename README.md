# Route Atlas

Plan bike and running routes anywhere and export GPX. It's a macOS app, also usable in a browser, built on OpenStreetMap, BRouter and the public Strava heatmap. It started as a gravel guide for Göteborg; those extras are still in here.

## What's inside

| Path | What it is |
|---|---|
| `app/` | Native macOS app (Swift, WKWebView). `app/build_app.sh` builds `Route Atlas.app`. |
| `heatmap_template.html` | Source of the map and route planner page. `scripts/build_page.py` embeds the data and writes `route-atlas.html`. |
| `route-atlas.html` | Built page. Open it with `Open Route Atlas.command`, which serves it on localhost so routing and location work in Safari. |
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
python3 scripts/build_page.py      # page
app/build_app.sh                   # macOS app (needs Xcode command line tools)
```

## Data and licences

- Map data © OpenStreetMap contributors (ODbL). Vector tiles © OpenMapTiles / OpenFreeMap.
- Routing: [BRouter](https://github.com/abrensch/brouter) public server.
- Imagery © Esri, Maxar, Earthstar Geographics.
- The Strava heatmap tiles belong to Strava. They load live from Strava's public endpoint for personal viewing and aren't redistributed here.
