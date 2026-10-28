/** OSM way tags as reported by BRouter (`WayTags` column). */
export type Tags = Record<string, string>;

/** 0 = paved, 1 = fast gravel, 2 = rough gravel / forest track, 3 = technical / trail. */
export type SurfaceClass = 0 | 1 | 2 | 3;

export type Mode = 'gravel' | 'road' | 'run';

/** A pre-built loop embedded in the page (Göteborg extras). `g` is a flat [x, y, x, y…] list in 10 m units. */
export interface LoopData {
  name: string;
  km: number;
  ascent: number;
  classes: Record<string, number>;
  start: string;
  file: string;
  g: number[];
}

export interface AppData {
  loops: LoopData[];
  road: LoopData[];
}

export interface RoutePoint {
  lat: number;
  lng: number;
  ele: number | null;
}

/** One routed leg between two consecutive waypoints. */
export interface Segment {
  pts: RoutePoint[];
  /** Surface class of each interval pts[i-1] → pts[i]. */
  cls: SurfaceClass[];
  tags: Tags[];
  km: number;
  asc: number;
  /** BRouter's own riding-time estimate, in seconds. */
  time: number;
}

/** A point of the whole route, with cumulative distance and the way it lies on. */
export interface TrackPoint extends RoutePoint {
  d: number;
  c: SurfaceClass;
  t: Tags;
}

/** A BRouter profile id plus any `&profile:param=value` overrides. */
export interface Profile {
  id: string;
  q: string;
}

export type NativeMessage =
  | { type: 'locate'; on: boolean }
  | { type: 'saveGPX'; name: string; content: string };
