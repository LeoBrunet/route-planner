import { CLASS_COLORS } from './surfaces';
import type { TrackPoint } from './types';

const LEFT = 46, TOP = 6;
const MUTED = '#9aa69d', GRID = '#2e3730', LINE = '#ff3fa4', FILL = 'rgba(255,63,164,.22)', INK = '#e4e9e2';

/** Elevation profile with a surface strip underneath; reports the hovered track index. */
export class ElevationChart {
  private ctx: CanvasRenderingContext2D;
  private track: TrackPoint[] = [];
  private geom: { x(d: number): number; total: number; width: number } | null = null;

  constructor(private canvas: HTMLCanvasElement, onHover: (index: number | null) => void) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    this.ctx = ctx;
    canvas.addEventListener('mousemove', e => {
      if (!this.geom) return;
      const r = canvas.getBoundingClientRect();
      const d = ((e.clientX - r.left - LEFT) / (this.geom.width - LEFT - 4)) * this.geom.total;
      let i = this.track.findIndex(t => t.d >= d);
      if (i < 0) i = this.track.length - 1;
      this.draw(i);
      onHover(i);
    });
    canvas.addEventListener('mouseleave', () => { this.draw(); onHover(null); });
  }

  setTrack(track: TrackPoint[]): void {
    this.track = track;
    this.draw();
  }

  draw(highlight?: number): void {
    const { canvas, ctx, track } = this;
    const r = canvas.getBoundingClientRect(), dpr = devicePixelRatio || 1;
    canvas.width = r.width * dpr;
    canvas.height = r.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = r.width, H = r.height;
    ctx.clearRect(0, 0, W, H);
    if (track.length < 2) { this.geom = null; return; }

    const ele = track.map(t => t.ele ?? 0);
    const lo = Math.min(...ele), span = Math.max(30, Math.max(...ele) - lo), total = track[track.length - 1].d;
    const base = H - 16;
    const X = (d: number) => LEFT + ((W - LEFT - 4) * d) / total;
    const Y = (e: number) => base - 10 - ((base - 10 - TOP) * (e - lo)) / span;
    this.geom = { x: X, total, width: W };

    ctx.font = '11px IBM Plex Mono, monospace';
    ctx.fillStyle = MUTED;
    ctx.textAlign = 'right';
    for (const e of [lo, lo + span]) {
      ctx.fillText(`${Math.round(e)} m`, LEFT - 4, Y(e) + 4);
      ctx.strokeStyle = GRID;
      ctx.beginPath(); ctx.moveTo(LEFT, Y(e)); ctx.lineTo(W - 4, Y(e)); ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(X(0), base - 10);
    track.forEach(t => ctx.lineTo(X(t.d), Y(t.ele ?? 0)));
    ctx.lineTo(X(total), base - 10);
    ctx.closePath();
    ctx.fillStyle = FILL;
    ctx.fill();

    ctx.beginPath();
    track.forEach((t, i) => (i ? ctx.lineTo(X(t.d), Y(t.ele ?? 0)) : ctx.moveTo(X(t.d), Y(t.ele ?? 0))));
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    for (let i = 1; i < track.length; i++) {
      ctx.fillStyle = CLASS_COLORS[track[i].c];
      ctx.fillRect(X(track[i - 1].d), base - 6, Math.max(1, X(track[i].d) - X(track[i - 1].d) + 0.5), 6);
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = MUTED;
    const step = [1, 2, 5, 10, 20, 25, 50, 100].find(s => (W - LEFT) / (total / s) >= 56) ?? 100;
    for (let k = 0; k <= total; k += step) ctx.fillText(`${k} km`, Math.min(W - 20, Math.max(LEFT + 14, X(k))), H - 2);

    if (highlight != null) {
      const t = track[highlight], x = X(t.d);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, TOP); ctx.lineTo(x, base); ctx.stroke();
      const label = `${t.d.toFixed(1)} km · ${Math.round(t.ele ?? 0)} m · ${t.t.surface ?? 'untagged'} ${t.t.highway ?? ''}`;
      const right = x > W / 2;
      ctx.textAlign = right ? 'right' : 'left';
      ctx.fillStyle = INK;
      ctx.fillText(label, x + (right ? -6 : 6), TOP + 10);
    }
  }
}
