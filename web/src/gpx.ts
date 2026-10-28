import { escapeXml } from './dom';
import type { TrackPoint } from './types';

export function buildGpx(name: string, profile: string, track: TrackPoint[]): string {
  const n = escapeXml(name);
  const points = track
    .map(t => `<trkpt lat="${t.lat.toFixed(6)}" lon="${t.lng.toFixed(6)}">${t.ele != null ? `<ele>${t.ele.toFixed(1)}</ele>` : ''}</trkpt>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Route Planner (BRouter ${escapeXml(profile)})" xmlns="http://www.topografix.com/GPX/1/1">
<metadata><name>${n}</name></metadata>
<trk><name>${n}</name><trkseg>
${points}
</trkseg></trk>
</gpx>
`;
}

/** "Morning Loop" → "morning-loop.gpx"; keeps letters with accents. */
export function gpxFileName(name: string): string {
  return `${name.replace(/[^\p{L}\p{N}\- _]/gu, '').trim().replace(/\s+/g, '-').toLowerCase() || 'route'}.gpx`;
}

/** Saves through the macOS app's dialog when available, otherwise as a browser download. */
export function downloadGpx(fileName: string, content: string, save?: (name: string, content: string) => void): void {
  if (save) { save(fileName, content); return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: 'application/gpx+xml' }));
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
