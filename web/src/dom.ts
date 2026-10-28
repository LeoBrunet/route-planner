/** Typed `getElementById` that fails loudly when the page and the code drift apart. */
export function $<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
}

export const input = (id: string) => $<HTMLInputElement>(id);
export const select = (id: string) => $<HTMLSelectElement>(id);
export const button = (id: string) => $<HTMLButtonElement>(id);

let toastTimer: number | undefined;

/** Short message at the top of the map. */
export function toast(message: string, ms = 5000): void {
  const el = $('toast');
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { el.hidden = true; }, ms);
}

const XML_ENTITIES: Record<string, string> = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' };
export const escapeXml = (s: string) => s.replace(/[<>&"]/g, c => XML_ENTITIES[c]);

export function storageGet<T>(key: string): T | null {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') as T | null; } catch { return null; }
}

export function storageSet(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode or blocked storage */ }
}
