import { classifyWay } from './surfaces';
import type { Profile, RoutePoint, Segment, SurfaceClass, Tags } from './types';

const BROUTER = 'https://brouter.de/brouter';

interface BRouterFeature {
  properties: { 'track-length': string; 'filtered ascend': string; 'total-time': string; messages: string[][] };
  geometry: { coordinates: [number, number, number?][] };
}

const ll = (p: L.LatLngLiteral) => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`;

/** Routes legs on the public BRouter server, caching each leg so dragging one point only reroutes its neighbours. */
export class Router {
  private cache = new Map<string, Promise<Segment>>();
  private uploaded: Record<string, Promise<string>> = {};

  /** `profiles`: BRouter profile sources that accept `cycleway_priority`, keyed by base profile name. */
  constructor(private profiles: Record<string, string>) {}

  supportsCyclePriority(base: string): boolean {
    return base in this.profiles;
  }

  /**
   * Plain profile, or — when cycle-path priority is on — our custom profile uploaded once
   * to the server (it returns a temporary `custom_…` id) plus the priority parameter.
   */
  async resolve(base: string, priority: number): Promise<Profile> {
    if (!priority || !this.supportsCyclePriority(base)) return { id: base, q: '' };
    this.uploaded[base] ??= fetch(`${BROUTER}/profile`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: this.profiles[base] })
      .then(r => r.json() as Promise<{ profileid?: string; error?: string }>)
      .then(j => {
        if (!j.profileid) throw new Error(j.error ?? 'profile upload failed');
        return j.profileid;
      })
      .catch(e => { delete this.uploaded[base]; throw e; });
    return { id: await this.uploaded[base], q: `&profile:cycleway_priority=${priority}` };
  }

  /** Forget uploaded profiles and cached legs (custom profiles expire on the server). */
  reset(): void {
    this.uploaded = {};
    this.cache.clear();
  }

  segment(a: L.LatLngLiteral, b: L.LatLngLiteral, p: Profile): Promise<Segment> {
    const key = `${p.id}${p.q}|${ll(a)}|${ll(b)}`;
    const hit = this.cache.get(key);
    if (hit) return hit;
    const url = `${BROUTER}?lonlats=${ll(a)}|${ll(b)}&profile=${p.id}${p.q}&alternativeidx=0&format=geojson`;
    const leg = fetch(url).then(async r => {
      const text = await r.text();
      if (!r.ok || text[0] !== '{') throw new Error(text.trim().slice(0, 140) || `HTTP ${r.status}`);
      return parseLeg((JSON.parse(text) as { features: BRouterFeature[] }).features[0]);
    });
    this.cache.set(key, leg);
    leg.catch(() => this.cache.delete(key));
    return leg;
  }
}

function parseLeg(f: BRouterFeature): Segment {
  const props = f.properties, [header, ...msgRows] = props.messages;
  const iLon = header.indexOf('Longitude'), iLat = header.indexOf('Latitude'), iTags = header.indexOf('WayTags');
  // Each message row covers one way and ends at the given coordinate (micro-degrees).
  const rows = msgRows.map(r => ({
    lon: +r[iLon],
    lat: +r[iLat],
    tags: Object.fromEntries(r[iTags].split(' ').filter(x => x.includes('=')).map(x => x.split(/=(.*)/s).slice(0, 2))) as Tags,
  }));

  const pts: RoutePoint[] = f.geometry.coordinates.map(c => ({ lat: c[1], lng: c[0], ele: c[2] ?? null }));
  const cls: SurfaceClass[] = [], tags: Tags[] = [];
  let ri = 0;
  for (let i = 1; i < pts.length; i++) {
    const row = rows[Math.min(ri, rows.length - 1)] ?? { tags: {}, lon: NaN, lat: NaN };
    cls.push(classifyWay(row.tags));
    tags.push(row.tags);
    if (ri < rows.length && Math.round(pts[i].lng * 1e6) === row.lon && Math.round(pts[i].lat * 1e6) === row.lat) ri++;
  }
  return { pts, cls, tags, km: +props['track-length'] / 1000, asc: +props['filtered ascend'], time: +props['total-time'] };
}
