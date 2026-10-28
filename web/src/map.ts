import { decodeTrack } from './geo';
import type { AppData, LoopData } from './types';

export type BaseName = 'sat' | 'cyclosm' | 'osm';

export interface HeatState {
  sport: string;
  color: string;
  opacity: number;
  layer: L.TileLayer | null;
}

export interface MapContext {
  map: L.Map;
  base: Record<BaseName, L.TileLayer>;
  labels: L.TileLayer;
  heat: HeatState;
  setHeat(): void;
  gps: L.TileLayer;
  wmt: L.TileLayer;
  loops: L.LayerGroup;
  roadLoops: L.LayerGroup;
}

function loopLayer(l: LoopData, summary: string): L.FeatureGroup {
  const ll = decodeTrack(l.g);
  return L.featureGroup([
    L.polyline(ll, { color: '#111', weight: 7, opacity: 0.7 }),
    L.polyline(ll, { color: '#fff', weight: 3.5, opacity: 1 }),
  ]).bindPopup(`<b>${l.name}</b><br>${l.km} km · ${l.ascent} m ↑ · ${summary}<br>Start: ${l.start}<br><small>gpx/${l.file}</small>`);
}

export function createMap(data: AppData): MapContext {
  const map = L.map('map', { zoomControl: true, preferCanvas: true }).setView([57.72, 12.12], 11);
  map.zoomControl.setPosition('topright');

  const base: Record<BaseName, L.TileLayer> = {
    sat: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Esri, Maxar, Earthstar Geographics' }),
    cyclosm: L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', { maxZoom: 19, subdomains: 'abc', attribution: 'CyclOSM, © OpenStreetMap' }),
    osm: L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }),
  };
  const labels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, pane: 'overlayPane', zIndex: 650 });
  base.sat.addTo(map);
  labels.addTo(map);

  // Strava's public heatmap is served without login up to zoom 11; Leaflet upscales it beyond.
  const heat: HeatState = { sport: 'sport_GravelRide', color: 'hot', opacity: 0.85, layer: null };
  const setHeat = () => {
    if (heat.layer) map.removeLayer(heat.layer);
    heat.layer = null;
    if (heat.sport === 'none') return;
    heat.layer = L.tileLayer(`https://heatmap-external-{s}.strava.com/tiles/${heat.sport}/${heat.color}/{z}/{x}/{y}.png`, {
      subdomains: 'abc', maxNativeZoom: 11, maxZoom: 19, opacity: heat.opacity, zIndex: 400, attribution: 'Heatmap © Strava',
    }).addTo(map);
  };
  setHeat();

  const gps = L.tileLayer('https://gps.tile.openstreetmap.org/lines/{z}/{x}/{y}.png', { maxZoom: 19, maxNativeZoom: 18, zIndex: 420, attribution: 'GPS traces © OSM' });
  const wmt = L.tileLayer('https://tile.waymarkedtrails.org/cycling/{z}/{x}/{y}.png', { maxZoom: 18, zIndex: 430, opacity: 0.9, attribution: 'Waymarked Trails' }).addTo(map);

  const loops = L.layerGroup(data.loops.map(l => loopLayer(l, `${Math.round(100 - ((l.classes[0] ?? 0) / l.km) * 100)}% unpaved`))).addTo(map);
  const roadLoops = L.layerGroup(data.road.map(l => loopLayer(l, `${Math.round(((l.classes[0] ?? 0) / l.km) * 100)}% paved`)));

  return { map, base, labels, heat, setHeat, gps, wmt, loops, roadLoops };
}
