import { storageGet, storageSet, toast } from './dom';
import { createLocator } from './location';
import { createMap } from './map';
import { initModes, savedMode } from './modes';
import { isNative } from './native';
import { initPanel } from './panel';
import { createPlanner } from './planner';
import { Router } from './routing';
import { initSearch } from './search';
import { createSurfaceLayer } from './surfaceLayer';

// Surface problems on the page instead of failing silently.
window.toast = toast;
window.addEventListener('error', e => toast(`Script error: ${e.message}`, 10000));
window.addEventListener('unhandledrejection', e => toast(`Error: ${e.reason instanceof Error ? e.reason.message : String(e.reason)}`, 10000));
if (!isNative && location.protocol === 'file:') {
  toast('Opened as a file: routing and location may be blocked. Use “Open Route Planner.command” or the Route Planner app instead.', 12000);
}

const ctx = createMap(window.APP_DATA);
const { map } = ctx;
const surfaces = createSurfaceLayer(map);
const panel = initPanel(ctx, surfaces);
const locator = createLocator(map);
const planner = createPlanner({ map, router: new Router(window.APP_BRF), locator, clickThroughLayers: [ctx.loops, ctx.roadLoops] });
const setMode = initModes(panel, planner);
initSearch(map);

// Reopen where you left off; the very first launch in the app starts at your position.
const VIEW_KEY = 'ra-view';
const view = storageGet<{ lat: number; lng: number; z: number }>(VIEW_KEY);
if (view) map.setView([view.lat, view.lng], view.z);
else if (isNative) setTimeout(() => locator.locate(true), 300);
map.on('moveend', () => {
  const c = map.getCenter();
  storageSet(VIEW_KEY, { lat: +c.lat.toFixed(5), lng: +c.lng.toFixed(5), z: map.getZoom() });
});

setMode(savedMode());
void planner.update();
