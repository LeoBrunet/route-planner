import { $, input } from './dom';

interface NominatimPlace {
  display_name: string;
  boundingbox: [string, string, string, string]; // south, north, west, east
}

/** Place search with OpenStreetMap Nominatim. */
export function initSearch(map: L.Map): void {
  const box = $('results');
  const note = (text: string) => { box.innerHTML = `<span class="note">${text}</span>`; };

  $<HTMLFormElement>('search').addEventListener('submit', async e => {
    e.preventDefault();
    const q = input('q').value.trim();
    if (!q) return;
    box.hidden = false;
    note('Searching…');
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(q)}`, { headers: { 'Accept-Language': 'en' } });
      const places = await r.json() as NominatimPlace[];
      if (!places.length) { note('No place found. Try adding the country.'); return; }
      box.innerHTML = '';
      for (const p of places) {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = p.display_name;
        b.onclick = () => {
          const [s, n, w, east] = p.boundingbox.map(Number);
          map.fitBounds([[s, w], [n, east]], { maxZoom: 14 });
          box.hidden = true;
        };
        box.appendChild(b);
      }
    } catch {
      note('Search failed. Check your connection.');
    }
  });
}
