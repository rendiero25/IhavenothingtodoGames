/** Shared geography and routes: rendering and city activity use the same map. */
export type Point = readonly [number, number];
export const WORLD = { width: 216, depth: 148, minX: -108, maxX: 108, minZ: -67, maxZ: 81, centerZ: 7 } as const;
export const AVENUES = [-92, -62, -32, 30, 60, 90] as const;
export const STREETS = [-58, -31, -4, 23, 50, 72] as const;
export const RIVER_WIDTH = 7.5;
export const clamp = (v: number, low: number, high: number) => Math.max(low, Math.min(high, v));
export const riverX = (z: number) => -6 + Math.sin(z * .039) * 11 + Math.sin(z * .091) * 3;
export const coastX = (z: number) => 69 + Math.sin((z - 54) * .055) * 4;
export const isSea = (x: number, z: number) => z >= 54 && x >= coastX(z);
export const isRiver = (x: number, z: number, margin = 0) => Math.abs(x - riverX(z)) <= RIVER_WIDTH / 2 + margin;

export type Road = { a: Point; b: Point; width: number };
export const ROADS: Road[] = [
  ...AVENUES.map(x => ({ a: [x, -58] as Point, b: [x, x === 90 ? 50 : 72] as Point, width: 5 })),
  ...STREETS.map(z => ({ a: [-92, z] as Point, b: [z === 72 ? 60 : 90, z] as Point, width: 5 })),
];
export function onRoad(x: number, z: number, margin = 0) {
  return ROADS.some(({ a, b, width }) => x >= Math.min(a[0], b[0]) - width / 2 - margin
    && x <= Math.max(a[0], b[0]) + width / 2 + margin
    && z >= Math.min(a[1], b[1]) - width / 2 - margin
    && z <= Math.max(a[1], b[1]) + width / 2 + margin);
}

export type Facility = 'hospital' | 'school' | 'fire' | 'police' | 'station' | 'stadium' | 'park' | 'market' | 'power';
export type Plot = { x: number; z: number; w: number; d: number; height: number; facility?: Facility; waterfront?: boolean; index: number };
const facilities: Record<string, Facility> = {
  '1:0': 'fire', '3:0': 'police', '4:0': 'station',
  '0:1': 'school', '1:1': 'park', '3:1': 'power',
  '1:2': 'hospital', '4:2': 'stadium',
  '1:3': 'park', '3:3': 'market',
};
export const PLOTS: Plot[] = [];
export const SIDEWALKS: Point[][] = [];
for (let column = 0; column < AVENUES.length - 1; column++) {
  for (let row = 0; row < STREETS.length - 1; row++) {
    if (column === 2 || column === 4 && row === 4) continue;
    const left = AVENUES[column], right = AVENUES[column + 1];
    const top = STREETS[row], bottom = STREETS[row + 1];
    const x = (left + right) / 2, z = (top + bottom) / 2;
    const index = column * 5 + row;
    const facility = facilities[`${column}:${row}`];
    PLOTS.push({ x, z, w: 20, d: Math.min(17, bottom - top - 10), height: 6 + index * 7 % 22, facility, index });
    SIDEWALKS.push([[left + 3.7, top + 3.7], [right - 3.7, top + 3.7],
      [right - 3.7, bottom - 3.7], [left + 3.7, bottom - 3.7]]);
  }
}
for (let row = 0; row < STREETS.length - 1; row++) {
  // The central riverfront block is an uninterrupted public garden, not housing.
  if (row === 2) continue;
  const z = (STREETS[row] + STREETS[row + 1]) / 2;
  const d = row === 4 ? 12 : 16;
  const bends = Array.from({ length: 41 }, (_, i) => riverX(z - d / 2 + i * d / 40));
  for (const side of [-1, 1]) {
    const left = side === -1 ? -27.7 : Math.max(...bends) + 9.5;
    const right = side === -1 ? Math.min(...bends) - 9.5 : 25.7;
    const w = Math.min(10, right - left - 1.2);
    if (w < 5) continue;
    PLOTS.push({ x: (left + right) / 2, z, w, d, height: 12 + row % 3 * 3,
      waterfront: true, index: 30 + row * 2 + (side === 1 ? 1 : 0) });
  }
}
export const RIVER_PARK = { minZ: 0, maxZ: 19, z: 9.5 } as const;
export const RAIL = { x: 95.6, minZ: -56, maxZ: 50, carSpacing: 6.5, carLength: 6 } as const;
/** Three-car reversible shuttle: smooth acceleration, dwell, then return on the same track. */
export function trainAt(elapsed: number) {
  const phase = ((elapsed % 80) + 80) % 80;
  const southbound = phase < 40;
  const progress = clamp((phase - (southbound ? 8 : 48)) / 32, 0, 1);
  const ease = (1 - Math.cos(progress * Math.PI)) / 2;
  const from = -44.5, to = 38.5;
  return { x: RAIL.x, z: southbound ? from + (to - from) * ease : to - (to - from) * ease,
    angle: southbound ? 0 : Math.PI, moving: progress > 0 && progress < 1 };
}
// Waterfront walks follow the bends, staying outside the river's banks.
for (const side of [-1, 1]) {
  const outward: Point[] = Array.from({ length: 35 }, (_, i) => {
    const z = -56 + i * 3.7;
    return [riverX(z) + side * 6.5, z];
  });
  SIDEWALKS.push([...outward, ...[...outward].reverse().map(([x, z]) => [x + side * 1.3, z] as Point)]);
}
export const TRAFFIC_ROUTES: Point[][] = [
  [[-92, -58], [-32, -58], [-32, 72], [-92, 72]],
  [[-62, -31], [60, -31], [60, 50], [-62, 50]],
  [[-32, -58], [90, -58], [90, 50], [-32, 50]],
  [[-92, -4], [30, -4], [30, 72], [-92, 72]],
  [[30, -31], [90, -31], [90, 50], [30, 50]],
  [[-32, 23], [60, 23], [60, 72], [-32, 72]],
];
const routeMetrics = new WeakMap<readonly Point[], { lengths: number[]; total: number }>();
function metrics(points: readonly Point[]) {
  const cached = routeMetrics.get(points);
  if (cached) return cached;
  const lengths = points.map((a, i) => {
    const b = points[(i + 1) % points.length];
    return Math.hypot(b[0] - a[0], b[1] - a[1]);
  });
  const total = lengths.reduce((a, b) => a + b, 0);
  const value = { lengths, total };
  routeMetrics.set(points, value);
  return value;
}
export function routeAt(points: readonly Point[], distance: number) {
  const { lengths, total } = metrics(points);
  let remaining = ((distance % total) + total) % total;
  for (let i = 0; i < points.length; i++) {
    const length = lengths[i];
    if (length === 0) continue;
    if (remaining <= length) {
      const a = points[i], b = points[(i + 1) % points.length], t = remaining / length;
      return { x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, angle: Math.atan2(b[0] - a[0], b[1] - a[1]) };
    }
    remaining -= length;
  }
  return { x: points[0][0], z: points[0][1], angle: 0 };
}

/** Round road junctions with tangent-continuous turns instead of snapping vehicles 90 degrees. */
export function trafficAt(i: number, progress: number, speed: number) {
  const points = TRAFFIC_ROUTES[i % TRAFFIC_ROUTES.length];
  const { lengths, total } = metrics(points);
  const distance = i * 43.7 + progress * speed;
  let remaining = ((distance % total) + total) % total;
  let p = routeAt(points, distance);
  for (let segment = 0; segment < lengths.length; segment++) {
    if (remaining > lengths[segment]) { remaining -= lengths[segment]; continue; }
    const radius = 2;
    const cornerIndex = remaining < radius ? segment : remaining > lengths[segment] - radius ? (segment + 1) % points.length : -1;
    if (cornerIndex !== -1) {
      const before = points[(cornerIndex + points.length - 1) % points.length], corner = points[cornerIndex], after = points[(cornerIndex + 1) % points.length];
      const inLength = Math.hypot(corner[0] - before[0], corner[1] - before[1]);
      const outLength = Math.hypot(after[0] - corner[0], after[1] - corner[1]);
      const incoming = [(corner[0] - before[0]) / inLength, (corner[1] - before[1]) / inLength];
      const outgoing = [(after[0] - corner[0]) / outLength, (after[1] - corner[1]) / outLength];
      const u = (remaining < radius ? remaining + radius : remaining - lengths[segment] + radius) / (2 * radius);
      p = { x: corner[0] - incoming[0] * radius * (1 - u) ** 2 + outgoing[0] * radius * u ** 2,
        z: corner[1] - incoming[1] * radius * (1 - u) ** 2 + outgoing[1] * radius * u ** 2,
        angle: Math.atan2(incoming[0] * (1 - u) + outgoing[0] * u, incoming[1] * (1 - u) + outgoing[1] * u) };
    }
    break;
  }
  return { ...p, x: p.x + .82 * Math.cos(p.angle), z: p.z - .82 * Math.sin(p.angle) };
}

/** Follow the current sidewalk to the next safe block corner, then shelter. */
export function shelterAt(points: readonly Point[], initialDistance: number, travel: number) {
  const { lengths, total } = metrics(points);
  let remaining = ((initialDistance % total) + total) % total;
  let untilCorner = 0;
  for (const length of lengths) {
    if (remaining <= length) { untilCorner = length - remaining; break; }
    remaining -= length;
  }
  return routeAt(points, initialDistance + Math.min(Math.max(0, travel), untilCorner));
}

export const LANDMARKS = {
  downtown: [-47, 9.5], river: [-6, 10], beach: [79, 61],
  station: [75, -44.5], park: [-47, 36.5], hills: [-101, -60],
} satisfies Record<string, Point>;
export type Landmark = keyof typeof LANDMARKS;

/** Camera-relative forward/right movement works at every heading. */
export function cameraTravel(azimuth: number, forward: number, right: number, distance: number) {
  const length = Math.max(1, Math.hypot(forward, right));
  return { x: (-Math.sin(azimuth) * forward + Math.cos(azimuth) * right) * distance / length,
    z: (-Math.cos(azimuth) * forward - Math.sin(azimuth) * right) * distance / length };
}
