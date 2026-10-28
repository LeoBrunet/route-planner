// Embedded loops are stored as a flat [x, y, …] list in 10 m units of a local
// equirectangular projection centred on latitude 57.7° (see scripts/build_map.py).
const K = Math.cos((57.7 * Math.PI) / 180);

export function decodeTrack(g: number[]): L.LatLngTuple[] {
  const out: L.LatLngTuple[] = [];
  for (let i = 0; i < g.length; i += 2) out.push([(g[i + 1] * 10) / 110540, (g[i] * 10) / (K * 111320)]);
  return out;
}

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
