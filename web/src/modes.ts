import { $, storageSet } from './dom';
import type { OverlayId, Panel } from './panel';
import type { Planner } from './planner';
import type { Mode } from './types';

interface ModeConfig {
  heat: string;
  color: string;
  profile: string;
  on: OverlayId[];
  off: OverlayId[];
  note: string;
}

export const MODES: Record<Mode, ModeConfig> = {
  gravel: {
    heat: 'sport_GravelRide', color: 'hot', profile: 'gravel', on: ['l1', 'l2'], off: ['rloops', 'l3'],
    note: 'Strava gravel rides as orange–yellow heat, unpaved roads in cyan and forest tracks in blue. Bright heat on a gravel road means it goes through and people ride it.',
  },
  road: {
    heat: 'sport_Ride', color: 'hot', profile: 'fastbike', on: ['wmt'], off: ['l1', 'l2', 'l3', 'loops'],
    note: 'Strava road rides. The brightest lines are the roads local riders use; signed cycle routes in purple and blue.',
  },
  run: {
    heat: 'sport_Run', color: 'hot', profile: 'hiking-beta', on: ['l1', 'l3'], off: ['l2', 'loops', 'rloops', 'wmt'],
    note: 'Strava runs as heat, unpaved roads in cyan and trails dashed in violet. Route planning follows paths and trails, with time from your pace.',
  },
};

const MODE_KEY = 'gbg-mode';
const BUTTONS: Record<Mode, string> = { gravel: 'mGravel', road: 'mRoad', run: 'mRun' };

export const isMode = (v: unknown): v is Mode => v === 'gravel' || v === 'road' || v === 'run';

/** Gravel / Road / Run switch: heatmap, overlays and routing profile in one click. */
export function initModes(panel: Panel, planner: Planner): (mode: Mode) => void {
  function setMode(mode: Mode): void {
    const m = MODES[mode];
    (Object.keys(BUTTONS) as Mode[]).forEach(k => $(BUTTONS[k]).setAttribute('aria-pressed', String(k === mode)));
    $('modeNote').textContent = m.note;
    panel.setHeat(m.heat, m.color);
    m.on.forEach(id => panel.setOverlay(id, true));
    m.off.forEach(id => panel.setOverlay(id, false));
    planner.setProfile(m.profile);
    storageSet(MODE_KEY, mode);
  }
  (Object.keys(BUTTONS) as Mode[]).forEach(k => { $(BUTTONS[k]).onclick = () => setMode(k); });
  return setMode;
}

export function savedMode(): Mode {
  try {
    const raw = localStorage.getItem(MODE_KEY);
    const v = raw?.startsWith('"') ? JSON.parse(raw) : raw; // older builds stored the bare string
    return isMode(v) ? v : 'gravel';
  } catch {
    return 'gravel';
  }
}
