import { $, input } from './dom';
import { CLASS_COLORS, classifyTileRoad, type TileRoad } from './surfaces';

// Unpaved roads, forest tracks and trails anywhere in the world, drawn from
// OpenFreeMap's OpenMapTiles vector tiles (loaded with Leaflet.VectorGrid).

interface VectorGridApi {
  protobuf(url: string, options: Record<string, unknown>): L.Layer;
}
const vectorGrid = (L as unknown as { vectorGrid: VectorGridApi }).vectorGrid;
const canvasTile = (L.canvas as unknown as { tile: unknown }).tile;

const MIN_ZOOM = 11;
const ZOOM_HINT = `Zoom in (level ${MIN_ZOOM}+) to see surfaces.`;
const READY = 'Surfaces from OpenStreetMap. Exact tags (gravel, compacted…) show in the route planner.';

export interface SurfaceLayer {
  /** Rebuild the layer from the three checkboxes, debounced. */
  schedule(): void;
}

export function createSurfaceLayer(map: L.Map): SurfaceLayer {
  let layer: L.Layer | null = null;
  let tiles: { url: string; layers: string[] } | null = null;
  let timer: number | undefined;
  const status = () => $('surfStatus');

  async function refresh(): Promise<void> {
    const on = [1, 2, 3].filter(c => input('l' + c).checked);
    if (layer) { map.removeLayer(layer); layer = null; }
    if (!on.length) { status().textContent = 'Surfaces are off.'; return; }

    try {
      if (!tiles) {
        const tilejson = await (await fetch('https://tiles.openfreemap.org/planet')).json() as { tiles: string[]; vector_layers: { id: string }[] };
        tiles = { url: tilejson.tiles[0], layers: tilejson.vector_layers.map(l => l.id) };
      }
    } catch {
      status().textContent = 'Could not reach the surface map server. Check your connection.';
      return;
    }

    // VectorGrid draws every source layer unless told otherwise, so hide all but roads.
    const styles: Record<string, (p: TileRoad) => L.PathOptions | []> = {};
    for (const id of tiles.layers) styles[id] = () => [];
    styles.transportation = p => {
      const c = classifyTileRoad(p);
      return c && on.includes(c)
        ? { color: CLASS_COLORS[c], weight: c === 1 ? 2.2 : 1.7, opacity: 0.9, dashArray: c === 3 ? '4 3' : undefined }
        : [];
    };

    layer = vectorGrid.protobuf(tiles.url, {
      rendererFactory: canvasTile, vectorTileLayerStyles: styles, interactive: false,
      minZoom: MIN_ZOOM, maxNativeZoom: 14, maxZoom: 19, zIndex: 450, attribution: '© OpenMapTiles © OpenStreetMap',
    }).addTo(map);
    status().textContent = map.getZoom() < MIN_ZOOM ? ZOOM_HINT : READY;
  }

  map.on('zoomend', () => { if (layer) status().textContent = map.getZoom() < MIN_ZOOM ? ZOOM_HINT : READY; });

  return {
    schedule() {
      clearTimeout(timer);
      timer = window.setTimeout(() => { void refresh(); }, 30);
    },
  };
}
