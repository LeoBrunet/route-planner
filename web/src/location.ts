import { toast } from './dom';
import { isNative, postNative } from './native';

export interface Locator {
  /** Start following the user (or re-centre on them); `false` stops. */
  locate(on: boolean): void;
  readonly position: L.LatLng | null;
}

/** "My position" button. Uses CoreLocation in the macOS app, the Geolocation API in a browser. */
export function createLocator(map: L.Map): Locator {
  let on = false, first = true;
  let position: L.LatLng | null = null;
  let dot: L.Marker | null = null, ring: L.Circle | null = null;
  let btn!: HTMLButtonElement;

  const Control = L.Control.extend({
    options: { position: 'topright' },
    onAdd() {
      const bar = L.DomUtil.create('div', 'leaflet-bar');
      btn = L.DomUtil.create('button', 'locbtn', bar) as HTMLButtonElement;
      btn.title = 'Show my position';
      btn.setAttribute('aria-label', 'Show my position');
      btn.innerHTML = '&#x2316;';
      L.DomEvent.disableClickPropagation(bar);
      btn.onclick = () => locate(!on || !!position);
      return bar;
    },
  });
  map.addControl(new Control());

  function locate(want: boolean): void {
    if (!want) {
      if (isNative) postNative({ type: 'locate', on: false }); else map.stopLocate();
      on = false;
      btn.classList.remove('on', 'wait');
      return;
    }
    if (!isNative && !navigator.geolocation) { toast('This browser has no location support.'); return; }
    if (position && on) { map.setView(position, Math.max(map.getZoom(), 14)); return; }
    on = true; first = true;
    btn.classList.add('wait');
    if (isNative) postNative({ type: 'locate', on: true });
    else map.locate({ watch: true, enableHighAccuracy: true, maximumAge: 15000 });
  }

  // The macOS app pushes fixes through these globals; they feed Leaflet's own events.
  window.__loc = (lat, lng, accuracy) => { map.fire('locationfound', { latlng: L.latLng(lat, lng), accuracy }); };
  window.__locErr = (code, message) => { map.fire('locationerror', { code, message }); };

  map.on('locationfound', e => {
    const ev = e as L.LocationEvent;
    position = ev.latlng;
    btn.classList.remove('wait');
    btn.classList.add('on');
    if (!dot || !ring) {
      ring = L.circle(ev.latlng, { radius: ev.accuracy, color: '#1a73e8', weight: 1, fillOpacity: 0.12, interactive: false }).addTo(map);
      dot = L.marker(ev.latlng, {
        icon: L.divIcon({ className: '', html: '<div class="me"></div>', iconSize: [16, 16], iconAnchor: [8, 8] }),
        interactive: false, zIndexOffset: 1000,
      }).addTo(map);
    } else {
      dot.setLatLng(ev.latlng);
      ring.setLatLng(ev.latlng).setRadius(ev.accuracy);
    }
    if (first) { first = false; map.setView(ev.latlng, Math.max(map.getZoom(), 14)); }
  });

  map.on('locationerror', e => {
    const ev = e as L.ErrorEvent;
    on = false;
    btn.classList.remove('wait', 'on');
    const blocked = isNative
      ? 'Location blocked. Allow it in System Settings → Privacy & Security → Location Services.'
      : 'Location blocked. Allow it for this page in your browser (Safari: Settings → Websites → Location).';
    toast(ev.code === 1 ? blocked : `Could not get your position: ${ev.message}`, 9000);
  });

  return {
    locate,
    get position() { return position; },
  };
}
