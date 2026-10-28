import { $, button, input, select, storageGet, storageSet, toast } from './dom';
import { ElevationChart } from './elevationChart';
import { haversineKm } from './geo';
import { buildGpx, downloadGpx, gpxFileName } from './gpx';
import type { Locator } from './location';
import { isNative, postNative } from './native';
import type { Router } from './routing';
import { CLASS_COLORS, CLASS_NAMES, hasBikeInfra } from './surfaces';
import type { Segment, TrackPoint } from './types';

const RUN_PROFILES = new Set(['hiking-beta', 'shortest']);
const PLAN_KEY = 'gbg-plan';
const HINT_START = 'Click the map to set a start, then click again to add points. Drag a point to move it, click a point to remove it, click the line to add a point in between.';
const HINT_EDIT = 'Drag a point to move it, click a point to remove it, click the line to add a point in between.';

interface SavedPlan { w: [number, number][]; n?: string; p?: string; c?: string; pace?: string }

export interface PlannerDeps {
  map: L.Map;
  router: Router;
  locator: Locator;
  /** Layers whose popups are switched off while planning, so clicks add points instead. */
  clickThroughLayers: L.LayerGroup[];
}

export interface Planner {
  update(): Promise<void>;
  setProfile(profile: string): void;
}

export function createPlanner({ map, router, locator, clickThroughLayers }: PlannerDeps): Planner {
  const state = { wps: [] as L.LatLng[], segs: [] as Segment[], drawing: true, open: false, seq: 0 };
  let track: TrackPoint[] = [];

  const routeLayer = L.layerGroup().addTo(map);
  const pointLayer = L.layerGroup().addTo(map);
  const hover = L.circleMarker([0, 0], { radius: 6, color: '#000', weight: 2, fillColor: '#ff3fa4', fillOpacity: 1, interactive: false });
  const chart = new ElevationChart($<HTMLCanvasElement>('prof'), i => {
    if (i == null) hover.remove(); else hover.setLatLng([track[i].lat, track[i].lng]).addTo(map);
  });

  const profile = () => select('profile').value;
  const isRun = () => RUN_PROFILES.has(profile());
  const hint = (text: string, error = false) => { $('hint').className = error ? 'hint err' : 'hint'; $('hint').textContent = text; };

  /** Pace field "5:30" → seconds per km (defaults to 5:30). */
  function paceSeconds(): number {
    const m = input('pace').value.match(/^(\d+)(?::(\d{1,2}))?$/);
    return m ? +m[1] * 60 + +(m[2] ?? 0) : 330;
  }

  function syncProfileUI(): void {
    select('cprio').disabled = !router.supportsCyclePriority(profile());
    select('cprio').hidden = isRun();
    $('paceRow').hidden = !isRun();
  }

  function save(): void {
    storageSet(PLAN_KEY, {
      w: state.wps.map(w => [+w.lat.toFixed(6), +w.lng.toFixed(6)]),
      n: input('rname').value, p: profile(), c: select('cprio').value, pace: input('pace').value,
    } satisfies SavedPlan);
  }

  function drawPoints(): void {
    pointLayer.clearLayers();
    const n = state.wps.length;
    state.wps.forEach((w, i) => {
      const kind = i === 0 ? 'start' : i === n - 1 ? 'end' : '';
      const m = L.marker(w, {
        icon: L.divIcon({ className: '', html: `<div class="wp ${kind}"></div>`, iconSize: [14, 14], iconAnchor: [7, 7] }),
        draggable: true, bubblingMouseEvents: false, keyboard: false,
      }).addTo(pointLayer);
      m.on('dragend', () => { state.wps[i] = m.getLatLng(); void update(); });
      m.on('click', () => { state.wps.splice(i, 1); void update(); });
    });
  }

  async function update(retry = false): Promise<void> {
    drawPoints();
    save();
    syncProfileUI();
    const seq = ++state.seq, w = state.wps;
    (['undo', 'rev', 'loop', 'clear'] as const).forEach(id => { button(id).disabled = !w.length; });
    button('gpxdl').disabled = true;
    if (w.length < 2) {
      state.segs = [];
      render();
      hint(w.length ? 'Now click where you want to go next.' : HINT_START);
      return;
    }
    hint('Routing…');
    try {
      const p = await router.resolve(profile(), +select('cprio').value);
      const segs = await Promise.all(w.slice(1).map((b, i) => router.segment(w[i], b, p)));
      if (seq !== state.seq) return;
      state.segs = segs;
      render();
      hint(HINT_EDIT);
      button('gpxdl').disabled = false;
    } catch (e) {
      if (seq !== state.seq) return;
      const msg = e instanceof Error ? e.message : String(e);
      // Uploaded custom profiles expire on the server: upload again once.
      if (!retry && /profile/i.test(msg)) { router.reset(); return update(true); }
      hint(`BRouter could not route this: ${msg}. Move the last point onto a road or path.`, true);
    }
  }

  function render(): void {
    routeLayer.clearLayers();
    track = [];
    let d = 0;
    state.segs.forEach((sg, si) => {
      const ll = sg.pts.map(x => [x.lat, x.lng] as L.LatLngTuple);
      L.polyline(ll, { color: '#000', weight: 8, opacity: 0.6, interactive: false }).addTo(routeLayer);
      L.polyline(ll, { color: '#ff3fa4', weight: 4.5, opacity: 1, bubblingMouseEvents: false })
        .on('click', e => { state.wps.splice(si + 1, 0, (e as L.LeafletMouseEvent).latlng); void update(); })
        .addTo(routeLayer);
      sg.pts.forEach((x, i) => {
        if (i > 0) d += haversineKm(sg.pts[i - 1], x);
        if (si > 0 && i === 0) return; // shared with the previous leg
        track.push({ ...x, d, c: sg.cls[Math.max(0, i - 1)], t: sg.tags[Math.max(0, i - 1)] });
      });
    });
    renderStats();
    chart.setTrack(track);
  }

  function renderStats(): void {
    const has = state.segs.length > 0;
    const km = state.segs.reduce((a, s) => a + s.km, 0), asc = state.segs.reduce((a, s) => a + s.asc, 0);
    const run = isRun();
    const seconds = run ? km * paceSeconds() + asc * 6 : state.segs.reduce((a, s) => a + s.time, 0);

    const byClass = [0, 0, 0, 0], raw: Record<string, number> = {};
    let infra = 0;
    for (let i = 1; i < track.length; i++) {
      const dd = track[i].d - track[i - 1].d;
      if (hasBikeInfra(track[i].t)) infra += dd;
      byClass[track[i].c] += dd;
      const s = track[i].t.surface ?? 'untagged';
      raw[s] = (raw[s] ?? 0) + dd;
    }
    const total = byClass.reduce((a, b) => a + b, 0) || 1;
    const minutes = Math.round(seconds / 60);

    $('kpis').innerHTML = has
      ? `<span><b>${km.toFixed(1)}</b>km</span><span><b>${Math.round(asc)}</b>m ↑</span>` +
        `<span><b>${Math.round((1 - byClass[0] / total) * 100)}%</b>unpaved</span>` +
        (run ? '' : `<span><b>${Math.round((infra / total) * 100)}%</b>cycle paths/lanes</span>`) +
        `<span><b>${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}</b>h est.</span><span>${state.wps.length} points</span>`
      : '';
    $('sbar').innerHTML = has ? byClass.map((v, i) => `<i style="width:${(v / total) * 100}%;background:${CLASS_COLORS[i]}"></i>`).join('') : '';
    const topTags = Object.entries(raw).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k} ${v.toFixed(1)}`).join(' · ');
    $('slegend').innerHTML = has
      ? byClass.map((v, i) => `<span><i class="sw" style="background:${CLASS_COLORS[i]}"></i> ${CLASS_NAMES[i]} ${v.toFixed(1)} km</span>`).join('') + `<span>OSM tags: ${topTags}</span>`
      : '';
  }

  function setDrawing(on: boolean): void {
    state.drawing = on;
    $('draw').classList.toggle('on', on);
    $('draw').textContent = on ? 'Adding points' : 'Add points: off';
    document.body.classList.toggle('drawing', on && state.open);
  }

  function open(on: boolean): void {
    state.open = on;
    $('sheet').hidden = !on;
    $('panel').classList.toggle('planning', on);
    $('planOpen').textContent = on ? 'Close planner' : 'Plan a route';
    document.body.classList.toggle('drawing', on && state.drawing);
    setTimeout(() => { map.invalidateSize(); chart.draw(); }, 0);
    for (const group of clickThroughLayers) {
      group.eachLayer(f => (f as L.FeatureGroup).eachLayer(l => { (l as L.Path).options.interactive = !on; }));
    }
  }

  // --- wiring
  map.on('click', e => {
    if (!state.open || !state.drawing) return;
    state.wps.push((e as L.LeafletMouseEvent).latlng);
    void update();
  });
  $('draw').onclick = () => setDrawing(!state.drawing);
  $('undo').onclick = () => { state.wps.pop(); void update(); };
  $('rev').onclick = () => { state.wps.reverse(); void update(); };
  $('loop').onclick = () => { if (state.wps.length > 1) { state.wps.push(state.wps[0]); void update(); } };

  let clearArmed: number | undefined;
  $('clear').onclick = () => {
    if (!clearArmed) {
      $('clear').textContent = 'Click again to clear';
      clearArmed = window.setTimeout(() => { clearArmed = undefined; $('clear').textContent = 'Clear'; }, 2500);
      return;
    }
    clearTimeout(clearArmed);
    clearArmed = undefined;
    $('clear').textContent = 'Clear';
    state.wps = [];
    void update();
  };

  $('fromMe').onclick = () => {
    const here = locator.position;
    if (here) { state.wps.unshift(here); void update(); return; }
    toast('Finding your position…', 3000);
    locator.locate(true);
    map.once('locationfound', e => { state.wps.unshift((e as L.LocationEvent).latlng); void update(); });
  };

  select('profile').onchange = () => void update();
  select('cprio').onchange = () => void update();
  input('pace').oninput = () => { save(); render(); };
  input('rname').oninput = save;

  $('gpxdl').onclick = () => {
    if (track.length < 2) return;
    const name = input('rname').value.trim() || 'Route';
    const content = buildGpx(name, profile(), track);
    downloadGpx(gpxFileName(name), content, isNative ? (n, c) => postNative({ type: 'saveGPX', name: n, content: c }) : undefined);
  };

  $('planOpen').onclick = () => open(!state.open);
  $('planClose').onclick = () => open(false);
  window.addEventListener('resize', () => chart.draw());

  // restore the last plan
  const saved = storageGet<SavedPlan>(PLAN_KEY);
  if (saved) {
    state.wps = (saved.w ?? []).map(([a, b]) => L.latLng(a, b));
    input('rname').value = saved.n || 'My ride';
    if (saved.p) select('profile').value = saved.p;
    if (saved.c) select('cprio').value = saved.c;
    if (saved.pace) input('pace').value = saved.pace;
  }

  return {
    update: () => update(),
    setProfile(p) {
      select('profile').value = p;
      if (state.wps.length > 1) void update(); else syncProfileUI();
    },
  };
}
