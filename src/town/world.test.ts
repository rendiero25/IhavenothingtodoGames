import { describe, expect, it } from 'vitest';
import { AVENUES, STREETS, ROADS, PLOTS, SIDEWALKS, TRAFFIC_ROUTES, WORLD, RAIL, RIVER_PARK, trainAt, cameraTravel, coastX, isRiver, isSea, onRoad, riverX, routeAt, shelterAt } from './world';

describe('city geography', () => {
  it('extends the old 128 × 100 city and puts the coast in the south-east', () => {
    expect(WORLD.width).toBeGreaterThan(128);
    expect(WORLD.depth).toBeGreaterThan(100);
    expect(isSea(100, 75)).toBe(true);
    expect(isSea(100, -50)).toBe(false);
    expect(isSea(-100, 75)).toBe(false);
    expect(coastX(75)).toBeGreaterThan(60);
  });
  it('has a winding river inside the city, away from the avenues', () => {
    const bends = Array.from({ length: 100 }, (_, i) => riverX(-65 + i * 1.45));
    expect(Math.max(...bends) - Math.min(...bends)).toBeGreaterThan(15);
    for (let z = WORLD.minZ; z <= WORLD.maxZ; z++) {
      expect(Math.abs(riverX(z))).toBeLessThan(24);
      for (const x of AVENUES) expect(isRiver(x, z, 3)).toBe(false);
    }
  });
  it('every street endpoint connects to another road and the network is one component', () => {
    for (const road of ROADS) for (const p of [road.a, road.b]) {
      expect(ROADS.filter(other => other !== road && p[0] >= Math.min(other.a[0], other.b[0])
        && p[0] <= Math.max(other.a[0], other.b[0]) && p[1] >= Math.min(other.a[1], other.b[1])
        && p[1] <= Math.max(other.a[1], other.b[1])).length).toBeGreaterThan(0);
    }
    const seen = new Set([0]);
    for (let pass = 0; pass < ROADS.length; pass++) {
      ROADS.forEach((road, i) => ROADS.forEach((other, j) => {
        if (!seen.has(j)) return;
        if (Math.max(Math.min(road.a[0], road.b[0]), Math.min(other.a[0], other.b[0]))
          <= Math.min(Math.max(road.a[0], road.b[0]), Math.max(other.a[0], other.b[0]))
          && Math.max(Math.min(road.a[1], road.b[1]), Math.min(other.a[1], other.b[1]))
          <= Math.min(Math.max(road.a[1], road.b[1]), Math.max(other.a[1], other.b[1]))) seen.add(i);
      }));
    }
    expect(seen.size).toBe(ROADS.length);
  });
  it('all traffic paths stay on connected roads, including their closing segments', () => {
    for (const route of TRAFFIC_ROUTES) for (let d = 0; d < 900; d += .5) {
      const p = routeAt(route, d);
      expect(onRoad(p.x, p.z), `${p.x}, ${p.z}`).toBe(true);
      expect(isSea(p.x, p.z)).toBe(false);
    }
  });
  it('buildings and facilities do not occupy asphalt, river, or sea', () => {
    for (const plot of PLOTS) for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const x = plot.x + sx * plot.w / 2, z = plot.z + sz * plot.d / 2;
      expect(onRoad(x, z, .5)).toBe(false);
      expect(isRiver(x, z, 1)).toBe(false);
      expect(isSea(x, z)).toBe(false);
    }
    expect(new Set(PLOTS.map(p => p.facility).filter(Boolean)).size).toBe(9);
  });
  it('pedestrians stay out of building interiors and open water', () => {
    for (const route of SIDEWALKS) for (let d = 0; d < 500; d += 1) {
      const p = routeAt(route, d);
      expect(isRiver(p.x, p.z)).toBe(false);
      expect(isSea(p.x, p.z)).toBe(false);
      expect(PLOTS.some(plot => Math.abs(p.x - plot.x) < plot.w / 2 && Math.abs(p.z - plot.z) < plot.d / 2)).toBe(false);
    }
    expect(STREETS.length).toBeGreaterThan(3);
  });
  it('riverfront apartments reserve the central park and clear the whole bending waterfront', () => {
    const apartments = PLOTS.filter(p => p.waterfront);
    expect(apartments.length).toBeGreaterThanOrEqual(5);
    expect(apartments.some(p => p.x < riverX(p.z))).toBe(true);
    expect(apartments.some(p => p.x > riverX(p.z))).toBe(true);
    for (const p of apartments) {
      expect(p.height).toBeGreaterThanOrEqual(12);
      expect(p.z + p.d / 2 < RIVER_PARK.minZ || p.z - p.d / 2 > RIVER_PARK.maxZ).toBe(true);
      for (let z = p.z - p.d / 2; z <= p.z + p.d / 2; z += .1) for (const side of [-1, 1])
        expect(isRiver(p.x + side * p.w / 2, z, 5)).toBe(false);
    }
  });
  it('the entire three-car train stays on the physical rails through multiple shuttle cycles', () => {
    for (let t = 0; t < 240; t += .1) {
      const p = trainAt(t);
      expect(p.x).toBe(RAIL.x);
      const extent = RAIL.carSpacing + RAIL.carLength / 2 + .4;
      expect(p.z - extent).toBeGreaterThan(RAIL.minZ);
      expect(p.z + extent).toBeLessThan(RAIL.maxZ);
      expect(onRoad(p.x, p.z, 1)).toBe(false);
    }
    expect(trainAt(0).z).toBe(trainAt(7.9).z);
    expect(trainAt(40).z).toBe(trainAt(47.9).z);
    expect(trainAt(80)).toEqual(trainAt(0));
  });
  it('residents follow their path to a corner and stop there in an emergency', () => {
    const path = [[0, 0], [10, 0], [10, 10], [0, 10]] as const;
    expect(shelterAt(path, 3, 0)).toEqual(routeAt(path, 3));
    expect(shelterAt(path, 3, 2)).toEqual(routeAt(path, 5));
    expect(shelterAt(path, 3, 100).x).toBe(10);
    expect(shelterAt(path, 3, 100).z).toBe(0);
    expect(shelterAt(path, 3, 100)).toEqual(shelterAt(path, 3, 200));
  });
});

describe('360-degree camera travel', () => {
  it('forward follows the current heading at all four compass directions', () => {
    const expected = [[0, -5], [-5, 0], [0, 5], [5, 0]];
    expected.forEach(([x, z], i) => {
      const p = cameraTravel(i * Math.PI / 2, 1, 0, 5);
      expect(p.x).toBeCloseTo(x); expect(p.z).toBeCloseTo(z);
    });
  });
  it('strafe is perpendicular, reverse is inverse, diagonals do not move faster', () => {
    const a = cameraTravel(1.37, 1, 0, 5), b = cameraTravel(1.37, 0, 1, 5);
    const reverse = cameraTravel(1.37, -1, 0, 5), diagonal = cameraTravel(1.37, 1, 1, 5);
    expect(a.x * b.x + a.z * b.z).toBeCloseTo(0);
    expect(reverse.x).toBeCloseTo(-a.x); expect(reverse.z).toBeCloseTo(-a.z);
    expect(Math.hypot(diagonal.x, diagonal.z)).toBeCloseTo(5);
  });
});
