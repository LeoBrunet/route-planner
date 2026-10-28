import { $, input, select } from './dom';
import type { BaseName, MapContext } from './map';
import type { SurfaceLayer } from './surfaceLayer';

/** Ids of the overlay checkboxes in the side panel. */
export type OverlayId = 'gps' | 'wmt' | 'l1' | 'l2' | 'l3' | 'loops' | 'rloops';

export interface Panel {
  setHeat(sport: string, color: string): void;
  setOverlay(id: OverlayId, on: boolean): void;
}

/** Wires the side panel: base map, heatmap, overlays and the "check elsewhere" links. */
export function initPanel(ctx: MapContext, surfaces: SurfaceLayer): Panel {
  const { map, base, labels, heat } = ctx;
  let current = base.sat;

  document.querySelectorAll<HTMLInputElement>('input[name=base]').forEach(r => {
    r.onchange = () => {
      map.removeLayer(current);
      current = base[r.value as BaseName].addTo(map);
      current.bringToBack();
      if (r.value === 'sat' && input('labels').checked) labels.addTo(map); else map.removeLayer(labels);
    };
  });
  input('labels').onchange = () => {
    if (input('labels').checked && map.hasLayer(base.sat)) labels.addTo(map); else map.removeLayer(labels);
  };

  const heatRadios = document.querySelectorAll<HTMLInputElement>('input[name=heat]');
  heatRadios.forEach(r => { r.onchange = () => { heat.sport = r.value; ctx.setHeat(); updateLinks(); }; });
  select('color').onchange = () => { heat.color = select('color').value; ctx.setHeat(); };
  input('op').oninput = () => {
    const v = +input('op').value;
    heat.opacity = v / 100;
    $('opv').textContent = `${v}%`;
    heat.layer?.setOpacity(heat.opacity);
  };

  const tileOverlays: Partial<Record<OverlayId, L.Layer>> = { gps: ctx.gps, wmt: ctx.wmt, loops: ctx.loops, rloops: ctx.roadLoops };
  const applyOverlay = (id: OverlayId) => {
    const on = input(id).checked, layer = tileOverlays[id];
    if (layer) { if (on) layer.addTo(map); else map.removeLayer(layer); } else surfaces.schedule();
  };
  (['gps', 'wmt', 'l1', 'l2', 'l3', 'loops', 'rloops'] as OverlayId[]).forEach(id => { input(id).onchange = () => applyOverlay(id); });

  $('min').onclick = () => {
    const p = $('panel');
    p.classList.toggle('min');
    $('min').textContent = p.classList.contains('min') ? 'show' : 'hide';
  };

  function updateLinks(): void {
    const c = map.getCenter(), z = Math.max(map.getZoom(), 12), la = c.lat.toFixed(5), lo = c.lng.toFixed(5);
    const sport = heat.sport === 'none' || heat.sport === 'ride' ? 'Ride' : heat.sport.replace('sport_', '');
    $<HTMLAnchorElement>('strava').href = `https://www.strava.com/maps/global-heatmap?style=satellite&terrain=false&sport=${sport}&gColor=hot&gOpacity=100&labels=true&poi=false#${z}/${la}/${lo}`;
    $<HTMLAnchorElement>('lm').href = 'https://minkarta.lantmateriet.se/';
    $<HTMLAnchorElement>('komoot').href = `https://www.komoot.com/plan/@${la},${lo},${z}z`;
    $<HTMLAnchorElement>('gmaps').href = `https://www.google.com/maps/@${la},${lo},${Math.round(40000000 / 2 ** z)}m/data=!3m1!1e3`;
  }
  map.on('moveend', updateLinks);
  updateLinks();

  return {
    setHeat(sport, color) {
      heat.color = color;
      select('color').value = color;
      heatRadios.forEach(r => { r.checked = r.value === sport; });
      heat.sport = sport;
      ctx.setHeat();
      updateLinks();
    },
    setOverlay(id, on) {
      if (input(id).checked === on) return;
      input(id).checked = on;
      applyOverlay(id);
    },
  };
}
