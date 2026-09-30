import * as T from 'three';
import type { Roof, SceneTools, Tree } from './scenery';
import type { TownSettings } from './simulation';
import { clamp, coastX, isRiver, isSea, riverX } from './world';

export type Disaster = Exclude<TownSettings['disaster'], 'none'>;
export type DamageHistory = Partial<Record<Disaster, number>>;
const arrival: Record<Disaster, number> = { earthquake: 3, flood: 18, wildfire: 22, tsunami: 30,
  tornado: 30, hailstorm: 22, landslide: 8, drought: 35 };
const delay: Record<Disaster, number> = { earthquake: .5, flood: 4, wildfire: 1, tsunami: 18,
  tornado: 4, hailstorm: 3, landslide: .5, drought: 2 };
const tornadoPath = Array.from({ length: 18 }, (_, i) => [24 + Math.sin(i * 2 * .055) * 24, 13 + Math.sin(i * 2 * .07) * 31]);

/** Cumulative exposure, not instantaneous hazard: survives receding water and fading shaking. */
export function recordDamage(history: DamageHistory, disaster: TownSettings['disaster'], age: number) {
  if (disaster === 'none') return;
  const progress = clamp((age - delay[disaster]) / (arrival[disaster] - delay[disaster]), 0, 1);
  history[disaster] = Math.max(history[disaster] ?? 0, progress);
}
export function impactAt(disaster: Disaster, x: number, z: number, extent = 0, exposure = 1) {
  const bankDistance = Math.abs(x - riverX(z));
  switch (disaster) {
    case 'flood': return clamp((9 + exposure * 9 + extent - bankDistance) / 9, 0, 1);
    case 'earthquake': return .45 + .55 * clamp(1 - Math.hypot(x + 30, z - 9) / 100, 0, 1);
    case 'wildfire': return clamp((13 + extent - Math.hypot(x + 47, z - 36.5)) / 9, 0, 1);
    case 'tsunami': return clamp((z - 43 + extent) / 15, 0, 1) * clamp((x - coastX(z) + 13 + extent) / 13, 0, 1);
    case 'tornado': {
      let distance = Infinity;
      for (let i = 0; i < tornadoPath.length && i * 2 <= 35 * exposure; i++) distance = Math.min(distance, Math.hypot(x - tornadoPath[i][0], z - tornadoPath[i][1]));
      return clamp((9 + extent - distance) / 7, 0, 1);
    }
    case 'hailstorm': return .55 + .25 * Math.sin(x * .19 + z * .13) ** 2;
    case 'landslide': return clamp((15 + extent - Math.hypot(x + 96, z + 55)) / 10, 0, 1);
    case 'drought': return .75;
  }
}
export function damageAt(history: DamageHistory, x: number, z: number, extent = 0) {
  let strength = 0, kind: Disaster | undefined;
  for (const [disaster, exposure] of Object.entries(history) as [Disaster, number][]) {
    const value = exposure * impactAt(disaster, x, z, extent, exposure);
    if (value > strength) { strength = value; kind = disaster; }
  }
  return { strength, kind };
}
export const structural = (kind?: Disaster) => kind === 'earthquake' || kind === 'tornado' || kind === 'hailstorm' || kind === 'tsunami';

export function createImpacts(tools: SceneTools, roofs: Roof[], trees: Tree[]) {
  const history: DamageHistory = {}, meshes: T.InstancedMesh[] = [];
  const instances = (name: string, shape: T.BufferGeometry, color: number, count: number) => {
    const mesh = new T.InstancedMesh(shape, tools.material({ color, roughness: 1, side: T.DoubleSide }), count);
    mesh.name = name; mesh.frustumCulled = false; mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    tools.scene.add(mesh); meshes.push(mesh); return mesh;
  };
  const ground = instances('aftermath-ground', tools.trackGeometry(new T.CircleGeometry(1, 12)), 0xffffff, 350);
  const debris = instances('aftermath-debris', tools.box, 0xffffff, roofs.length * 5 + 40);
  const holeShape = new T.Shape();
  [[-.5, -.37], [-.32, -.45], [-.18, -.25], [.13, -.4], [.48, -.16], [.33, .06], [.5, .28],
    [.21, .5], [-.11, .28], [-.42, .43], [-.25, .12], [-.5, -.05]].forEach(([x, y], i) => i ? holeShape.lineTo(x, y) : holeShape.moveTo(x, y));
  holeShape.closePath();
  const holes = instances('damaged-roofs', tools.trackGeometry(new T.ShapeGeometry(holeShape).rotateX(-Math.PI / 2)), 0x4d4c43, roofs.length);
  const brokenGlass = instances('broken-windows', tools.box, 0x283536, roofs.length * 3);
  const watermarks = instances('flood-watermarks', tools.box, 0x89765c, roofs.length);
  const fallen = instances('fallen-trees', tools.trackGeometry(new T.CylinderGeometry(.13, .2, 1, 7)), 0x63533f, trees.length);
  const dummy = new T.Object3D();
  let signature = '', revision = 0;
  function pose(mesh: T.InstancedMesh, i: number, x: number, y: number, z: number,
    w: number, h: number, d: number, rx = 0, ry = 0, rz = 0) {
    dummy.position.set(x, y, z); dummy.scale.set(w, h, d); dummy.rotation.set(rx, ry, rz); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
  }
  function rebuild() {
    let g = 0, r = 0, roofIndex = 0, windowIndex = 0, markIndex = 0, treeIndex = 0;
    // Ground deposits are local to the footprint: mud, char, dry grass or storm debris.
    for (let i = 0; i < 350; i++) {
      const x = -105 + i * 17.731 % 210, z = -64 + i * 31.193 % 141;
      if (isRiver(x, z) || isSea(x, z)) continue;
      const impact = damageAt(history, x, z);
      if (impact.strength < .18) continue;
      const color = impact.kind === 'wildfire' ? 0x4f4435 : impact.kind === 'hailstorm' ? 0xd9e4e2
        : impact.kind === 'drought' ? 0xbda37b : 0x9b8262;
      const size = impact.kind === 'earthquake' || impact.kind === 'tornado' ? .65 : 1.4;
      pose(ground, g, x, .335, z, size * impact.strength, size * .7 * impact.strength, 1, -Math.PI / 2, 0, i);
      ground.setColorAt(g++, new T.Color(color));
    }
    const structuralHistory = Object.fromEntries(Object.entries(history).filter(([kind]) => structural(kind as Disaster))) as DamageHistory;
    const wetHistory: DamageHistory = { flood: history.flood ?? 0, tsunami: history.tsunami ?? 0 };
    roofs.forEach((roof, i) => {
      const impact = damageAt(history, roof.x, roof.z, Math.min(roof.w, roof.d) / 2);
      if (impact.strength < .16) return;
      const structure = damageAt(structuralHistory, roof.x, roof.z, Math.min(roof.w, roof.d) / 2);
      const wet = damageAt(wetHistory, roof.x, roof.z, Math.min(roof.w, roof.d) / 2);
      if (structure.strength > .16) {
        pose(holes, roofIndex++, roof.x + roof.w * .2, roof.y + .16, roof.z,
          roof.w * .4 * structure.strength, .12, roof.d * .5 * structure.strength, 0, .22);
        for (let j = 0; j < 3 && !roof.open; j++) pose(brokenGlass, windowIndex++, roof.x - roof.w * .24 + j * roof.w * .24,
          Math.max(2, roof.y * (.35 + j * .13)), roof.z + roof.d / 2 + .22,
          .7 * structure.strength, 1.1 * structure.strength, .025, 0, 0, (j - 1) * .14);
      }
      if (!roof.open && wet.strength > .16) pose(watermarks, markIndex++, roof.x, .95,
        roof.z + roof.d / 2 + .24, roof.w * .86, .36 * wet.strength, .025);
      const rubbleStrength = Math.max(structure.strength, wet.strength, (history.landslide ?? 0) * impactAt('landslide', roof.x, roof.z));
      if (rubbleStrength < .16) return;
      for (let j = 0; j < 5; j++) {
        const size = (.28 + j % 3 * .12) * rubbleStrength;
        const x = roof.x + (j % 2 ? 1 : -1) * (roof.w / 2 + .7), z = roof.z + Math.sin(i * 3 + j * 4.1) * roof.d / 2;
        pose(debris, r, x, (isSea(x, z) ? .17 : .38) + size / 2,
          z, size, size * .7, size * (roof.open ? 3.8 : 1.7), .12, i + j, .2);
        debris.setColorAt(r++, new T.Color(impact.kind === 'flood' || impact.kind === 'tsunami' ? 0x846f55 : 0x9c978a));
      }
    });
    trees.forEach((tree, i) => {
      const impact = damageAt(history, tree.x, tree.z);
      if (impact.strength < .6 || !['wildfire', 'tornado', 'tsunami', 'landslide'].includes(impact.kind ?? '')) return;
      pose(fallen, treeIndex++, tree.x, .48, tree.z, tree.size, tree.size * 2.7, tree.size, Math.PI / 2, i * .71);
    });
    ground.count = g; debris.count = r; holes.count = roofIndex; brokenGlass.count = windowIndex; watermarks.count = markIndex; fallen.count = treeIndex;
    for (const mesh of meshes) {
      mesh.visible = mesh.count > 0; mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    revision++;
  }
  rebuild();
  return {
    history,
    update(disaster: TownSettings['disaster'], age: number) {
      recordDamage(history, disaster, age);
      const next = Object.entries(history).map(([kind, value]) => `${kind}:${Math.round(value * 30)}`).join('|');
      if (next !== signature) { signature = next; rebuild(); }
      return revision;
    },
    repair() { for (const key of Object.keys(history) as Disaster[]) delete history[key]; signature = ''; rebuild(); },
    stats: () => ({ damage: { ...history }, debris: debris.count, brokenWindows: brokenGlass.count, fallenTrees: fallen.count }),
    dispose() { meshes.forEach(mesh => mesh.dispose()); },
  };
}
