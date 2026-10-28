import type { SurfaceClass, Tags } from './types';

export const CLASS_COLORS: readonly string[] = ['#b9c2bb', '#5ee6e6', '#2fa3b8', '#c58cff'];
export const CLASS_NAMES: readonly string[] = ['Paved', 'Fast gravel', 'Rough gravel', 'Technical'];

const PAVED = new Set(['asphalt', 'paved', 'concrete', 'paving_stones', 'sett', 'concrete:plates', 'concrete:lanes', 'chipseal', 'metal', 'wood']);
const FAST = new Set(['compacted', 'fine_gravel']);
const TECH = new Set(['ground', 'dirt', 'earth', 'rock', 'mud', 'grass', 'sand']);
const GRAVEL_ROADS = ['unclassified', 'residential', 'tertiary', 'cycleway'];

/** How a way rides on a gravel bike, from its OSM tags. Mirrors scripts/classify.py. */
export function classifyWay(t: Tags): SurfaceClass {
  const hw = t.highway, s = t.surface, tt = t.tracktype;
  if (s && PAVED.has(s)) return 0;
  if (!s && !['track', 'path', 'bridleway'].includes(hw) && !tt) return 0;
  if (tt === 'grade4' || tt === 'grade5' || (s && TECH.has(s)) || hw === 'bridleway') return 3;
  if (hw === 'path' && (!s || s === 'unpaved')) return 3;
  if ((s && FAST.has(s)) || tt === 'grade1') return 1;
  if ((s === 'gravel' || s === 'pebblestone') && GRAVEL_ROADS.includes(hw)) return 1;
  return 2;
}

/** OpenMapTiles `transportation` feature properties (surface is only paved / unpaved). */
export interface TileRoad {
  class?: string;
  subclass?: string;
  surface?: string;
}

/** Map-layer class for a vector-tile road: 1 unpaved road, 2 forest track, 3 trail, 0 hidden. */
export function classifyTileRoad(p: TileRoad): SurfaceClass {
  if (p.surface === 'paved') return 0;
  if (p.class === 'track') return 2;
  if (p.class === 'path') {
    const trail = p.subclass === 'path' || p.subclass === 'bridleway' || p.subclass === 'trail';
    return trail || p.surface === 'unpaved' ? 3 : 0;
  }
  return p.surface === 'unpaved' ? 1 : 0;
}

const LANES = ['track', 'lane', 'opposite_track', 'opposite_lane'];

/** True when the way is a cycle path or a road with a cycle lane / track. */
export function hasBikeInfra(t: Tags): boolean {
  if (t.highway === 'cycleway' || t.bicycle === 'designated') return true;
  return LANES.some(v => t.cycleway === v || t['cycleway:right'] === v || t['cycleway:left'] === v || t['cycleway:both'] === v);
}
