export const ATMOSPHERE_STOPS = [
  { id: 'ground', altitude: 0, range: '0 km', layer: 0 },
  { id: 'troposphere', altitude: 6, range: '0–12 km', layer: 1 },
  { id: 'stratosphere', altitude: 30, range: '12–50 km', layer: 2 },
  { id: 'mesosphere', altitude: 65, range: '50–80 km', layer: 3 },
  { id: 'thermosphere', altitude: 400, range: '80–700 km', layer: 4 },
  { id: 'exosphere', altitude: 4000, range: '700–10.000 km', layer: 5 },
  { id: 'beyond', altitude: 10000, range: '10.000 km +', layer: 0 },
] as const;

export type AtmosphereStopId = typeof ATMOSPHERE_STOPS[number]['id'];

// DOM sections run from outer space (top) to the ground (bottom).
export function ascentPosition(scrollTop: number, viewportHeight: number, centers: readonly number[]) {
  const center = scrollTop + viewportHeight / 2;
  let nearest = 0;
  centers.forEach((value, index) => {
    if (Math.abs(value - center) < Math.abs(centers[nearest] - center)) nearest = index;
  });
  return nearest;
}
