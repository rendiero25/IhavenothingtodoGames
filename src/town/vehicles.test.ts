import { describe, expect, it } from 'vitest';
import * as T from 'three';
import { airPose, createVehicles, seaPose } from './vehicles';
import type { SceneTools } from './scenery';
import { isSea, onRoad, trafficAt, WORLD } from './world';

describe('recognizable, batched city vehicles', () => {
  it('turns smoothly on every connected traffic route while staying on asphalt', () => {
    for (let i = 0; i < 6; i++) for (let t = 0; t < 800; t += .5) {
      const p = trafficAt(i, t, 1), next = trafficAt(i, t + .001, 1);
      expect(onRoad(p.x, p.z)).toBe(true);
      expect(Math.cos(p.angle - next.angle)).toBeGreaterThan(.999);
      expect(Math.hypot(p.x - next.x, p.z - next.z)).toBeLessThan(.002);
    }
  });
  it('ships and aircraft follow their route tangent without teleporting at a wrap', () => {
    for (const pose of [seaPose, airPose]) for (let t = 0; t < 460; t += .5) {
      const a = pose(t), b = pose(t + .001), dx = b.x - a.x, dz = b.z - a.z;
      const tangent = Math.atan2(dx, dz);
      expect(Math.cos(a.angle - tangent)).toBeCloseTo(1, 5);
      expect(Math.hypot(dx, dz)).toBeLessThan(.004);
      expect(a.x).toBeGreaterThan(WORLD.minX); expect(a.x).toBeLessThan(WORLD.maxX);
      expect(a.z).toBeGreaterThan(WORLD.minZ); expect(a.z).toBeLessThan(WORLD.maxZ);
      if (pose === seaPose) expect(isSea(a.x, a.z)).toBe(true);
    }
  });
  it('has valid curved models, distinct material layers and finite transforms', () => {
    const geometries: T.BufferGeometry[] = [], materials: T.Material[] = [];
    const tools: SceneTools = { scene: new T.Scene(), box: new T.BoxGeometry(), sphere: new T.SphereGeometry(),
      material: p => { const m = new T.MeshStandardMaterial(p); materials.push(m); return m; },
      trackGeometry: g => { geometries.push(g); return g; }, trackMaterial: m => { materials.push(m); return m; } };
    const fleet = createVehicles(tools);
    fleet.update(23, 23, true, false, false, false);
    for (const name of ['sedans', 'city-buses', 'motorcycles', 'emergency-vans', 'rail-shuttle', 'motor-launch', 'commuter-jet']) {
      const group = tools.scene.getObjectByName(name)!;
      expect(group.children.length).toBeGreaterThanOrEqual(3);
      for (const child of group.children) {
        const mesh = child as T.InstancedMesh;
        expect(Array.from(mesh.geometry.attributes.position.array).every(Number.isFinite)).toBe(true);
        expect(Array.from(mesh.geometry.attributes.normal.array).every(Number.isFinite)).toBe(true);
        expect(Array.from(mesh.instanceMatrix.array).every(Number.isFinite)).toBe(true);
      }
    }
    expect(fleet.stats(23).vehicleLayers).toBeLessThan(50);
    fleet.update(25, 25, false, true, true, true);
    expect(tools.scene.getObjectByName('motor-launch')!.visible).toBe(false);
    expect(tools.scene.getObjectByName('commuter-jet')!.visible).toBe(false);
    fleet.dispose(); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); tools.box.dispose(); tools.sphere.dispose();
  });
});
