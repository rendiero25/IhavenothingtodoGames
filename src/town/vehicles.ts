import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { SceneTools } from './scenery';
import { RAIL, trafficAt, trainAt } from './world';

type Layer = 'paint' | 'glass' | 'rubber' | 'metal' | 'headlight' | 'tail';
type Builder = ReturnType<typeof modelBuilder>;
const paints = [0xb8634d, 0xdddacb, 0x597b7d, 0xb7a368, 0x63788c, 0x8c8e7d, 0x809570];

/** Merge each material layer before instancing: detail without hundreds of draw calls. */
function modelBuilder() {
  const layers = new Map<Layer, T.BufferGeometry[]>();
  function add(layer: Layer, geometry: T.BufferGeometry, x: number, y: number, z: number,
    w = 1, h = 1, d = 1, rx = 0, ry = 0, rz = 0) {
    geometry.applyMatrix4(new T.Matrix4().compose(new T.Vector3(x, y, z),
      new T.Quaternion().setFromEuler(new T.Euler(rx, ry, rz)), new T.Vector3(w, h, d)));
    const pieces = layers.get(layer) ?? []; pieces.push(geometry); layers.set(layer, pieces);
  }
  const box = (layer: Layer, x: number, y: number, z: number, w: number, h: number, d: number, rx = 0, ry = 0, rz = 0) =>
    add(layer, new T.BoxGeometry(1, 1, 1), x, y, z, w, h, d, rx, ry, rz);
  const ellipsoid = (layer: Layer, x: number, y: number, z: number, w: number, h: number, d: number) =>
    add(layer, new T.SphereGeometry(1, 16, 10), x, y, z, w, h, d);
  const cylinder = (layer: Layer, x: number, y: number, z: number, radius: number, length: number, axis: 'x' | 'z' = 'x') =>
    add(layer, new T.CylinderGeometry(radius, radius, length, 16), x, y, z, 1, 1, 1, axis === 'z' ? Math.PI / 2 : 0, 0, axis === 'x' ? Math.PI / 2 : 0);
  function profile(layer: Layer, points: number[][], width: number, bevel = .04) {
    const shape = new T.Shape(); points.forEach(([z, y], i) => i ? shape.lineTo(z, y) : shape.moveTo(z, y)); shape.closePath();
    const geometry = new T.ExtrudeGeometry(shape, { depth: width, bevelEnabled: bevel > 0,
      bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, steps: 1, curveSegments: 8 });
    geometry.rotateY(-Math.PI / 2); geometry.translate(width / 2, 0, 0);
    add(layer, geometry, 0, 0, 0);
  }
  return { layers, box, ellipsoid, cylinder, profile };
}

function wheels(b: Builder, width: number, front: number, rear: number, y: number, radius: number) {
  for (const side of [-1, 1]) for (const z of [front, rear]) {
    b.cylinder('rubber', side * width / 2, y, z, radius, .18);
    b.cylinder('metal', side * (width / 2 + .095), y, z, radius * .58, .025);
  }
}
function carModel(van = false) {
  const b = modelBuilder(), length = van ? 3.1 : 2.45, width = van ? 1.32 : 1.12;
  b.profile('paint', [[-length / 2, .52], [-length / 2, .81], [-.85, .9], [.8, .82], [length / 2, .69], [length / 2, .52]], width);
  if (van) {
    b.profile('paint', [[-1.4, .78], [-1.4, 1.55], [.55, 1.55], [.95, .91]], 1.2);
    b.box('glass', 0, 1.29, .76, 1.04, .48, .04, -.62);
    b.box('glass', 0, 1.29, -1.44, .87, .36, .04);
  } else {
    b.profile('glass', [[-.86, .83], [-.58, 1.24], [.34, 1.24], [.71, .84]], .94);
    b.box('paint', 0, 1.27, -.1, 1.01, .08, .96);
    for (const side of [-1, 1]) {
      b.box('paint', side * .495, 1.05, -.17, .045, .4, .075);
      b.box('paint', side * .58, .98, .42, .18, .09, .18);
      b.box('metal', side * .572, .82, -.32, .015, .035, .17);
    }
  }
  for (const side of [-1, 1]) {
    b.box('headlight', side * width * .31, .72, length / 2 + .045, .26, .12, .06);
    b.box('tail', side * width * .33, .74, -length / 2 - .045, .22, .13, .06);
  }
  for (const z of [-length / 2, length / 2]) b.box('metal', 0, .52, z, width + .07, .12, .12);
  b.box('rubber', 0, .64, length / 2 + .07, .38, .1, .02);
  wheels(b, width + .06, length * .32, -length * .32, .52, .225);
  return b;
}
function busModel() {
  const b = modelBuilder();
  b.profile('paint', [[-2.8, .6], [-2.8, 1.93], [-2.6, 2.1], [2.45, 2.1], [2.8, 1.72], [2.8, .6]], 1.65);
  for (const side of [-1, 1]) for (let i = 0; i < 7; i++) b.box('glass', side * .86, 1.63, -2.2 + i * .64, .035, .57, .52);
  b.box('glass', 0, 1.59, 2.76, 1.41, .76, .06, -.16);
  b.box('rubber', .86, 1.16, 1.76, .045, 1.02, .78);
  b.box('glass', .89, 1.55, 1.76, .025, .55, .62);
  b.box('metal', 0, 2.19, -.65, .94, .17, 1.36);
  for (const side of [-1, 1]) {
    b.box('headlight', side * .57, .84, 2.85, .3, .17, .035);
    b.box('tail', side * .62, .95, -2.85, .17, .32, .035);
    b.box('paint', side * 1.02, 1.66, 2.35, .24, .24, .15);
  }
  wheels(b, 1.73, 1.78, -1.78, .61, .32);
  return b;
}
function motorcycleModel() {
  const b = modelBuilder();
  b.box('metal', 0, .71, 0, .16, .1, 1.04);
  b.ellipsoid('paint', 0, .84, .14, .24, .18, .31);
  b.box('rubber', 0, .89, -.29, .4, .11, .53);
  b.box('metal', 0, .59, -.2, .28, .3, .3);
  for (const z of [-.64, .64]) { b.cylinder('rubber', 0, .54, z, .245, .13); b.cylinder('metal', .07, .54, z, .17, .025); }
  for (const side of [-1, 1]) {
    b.box('metal', side * .1, .72, .58, .035, .46, .035, -.2);
    b.box('rubber', side * .24, 1.06, .4, .17, .045, .065);
    b.box('rubber', side * .16, .91, -.2, .12, .42, .16, -.4);
    b.box('paint', side * .16, 1.28, .08, .12, .39, .12, -.62);
  }
  b.box('metal', 0, 1.06, .4, .6, .035, .04);
  b.ellipsoid('paint', 0, 1.31, -.21, .21, .35, .16);
  b.ellipsoid('rubber', 0, 1.73, -.08, .2, .21, .2); // helmet, not a cuboid rider
  b.box('glass', 0, 1.75, .105, .27, .1, .055);
  b.ellipsoid('headlight', 0, .93, .69, .11, .11, .07);
  b.box('tail', 0, .92, -.63, .18, .08, .045);
  return b;
}
function trainModel() {
  const b = modelBuilder();
  for (let car = -1; car <= 1; car++) {
    const z = car * RAIL.carSpacing;
    b.box('paint', 0, 1.33, z, 1.83, 1.62, 5.8);
    b.box('metal', 0, 2.17, z, 1.75, .12, 5.7);
    b.box('rubber', 0, .74, z, 1.38, .2, 5.7);
    for (const side of [-1, 1]) {
      for (let i = 0; i < 6; i++) b.box('glass', side * .935, 1.62, z - 2 + i * .8, .035, .49, .57);
      for (const dz of [-2, 2]) {
        b.box('metal', side * .94, 1.15, z + dz, .035, 1.05, .52);
        b.box('glass', side * .963, 1.6, z + dz, .02, .37, .36);
      }
    }
    wheels(b, 1.54, z + 1.7, z - 1.7, .56, .27);
    wheels(b, 1.54, z + 2.15, z - 2.15, .56, .27);
    b.box('rubber', 0, 1.22, z + 3.06, 1.28, 1.1, .32);
  }
  for (const side of [-1, 1]) {
    const end = side * (RAIL.carSpacing + 2.96);
    b.box('glass', 0, 1.7, end, 1.36, .55, .045);
    for (const x of [-.64, .64]) b.box(side === 1 ? 'headlight' : 'tail', x, 1, end, .24, .16, .055);
  }
  return b;
}
function boatModel() {
  const b = modelBuilder();
  // Lofted V-bottom hull: pointed bow, broad waterline and narrow keel.
  const rings = [[-2.3, .74, .2], [-1.7, .94, .18], [.8, .9, .13], [2.1, .06, .4]];
  const vertices: number[] = [], indices: number[] = [];
  for (const [z, width, keel] of rings) vertices.push(-width, .52, z, -width * .68, .03, z, 0, -keel, z, width * .68, .03, z, width, .52, z);
  for (let r = 0; r < rings.length - 1; r++) for (let i = 0; i < 5; i++) {
    const a = r * 5 + i, next = r * 5 + (i + 1) % 5;
    indices.push(a, next, a + 5, next, next + 5, a + 5);
  }
  indices.push(0, 2, 1, 0, 3, 2, 0, 4, 3, 15, 16, 17, 15, 17, 18, 15, 18, 19);
  const hull = new T.BufferGeometry(); hull.setAttribute('position', new T.Float32BufferAttribute(vertices, 3)); hull.setIndex(indices);
  hull.computeVertexNormals(); hull.setAttribute('uv', new T.Float32BufferAttribute(new Float32Array(vertices.length / 3 * 2), 2));
  b.layers.set('paint', [hull]);
  b.box('metal', 0, .57, -.1, 1.34, .1, 2.9);
  b.box('paint', 0, .94, -.55, 1.14, .66, 1.57);
  b.box('glass', 0, 1.1, .26, 1, .35, .035, -.2);
  for (const side of [-1, 1]) {
    b.box('glass', side * .58, 1.1, -.54, .025, .3, 1.15);
    b.box('metal', side * .7, .94, .85, .04, .05, 1.54);
    for (const z of [.3, 1.1, 1.5]) b.box('metal', side * .7, .75, z, .035, .36, .035);
  }
  b.box('paint', 0, 1.31, -.55, 1.34, .1, 1.85);
  b.box('metal', 0, 1.73, -.94, .035, .75, .035);
  b.box('rubber', 0, .25, -2.4, .35, .72, .34); // outboard
  return b;
}
function aircraftModel() {
  const b = modelBuilder();
  b.ellipsoid('paint', 0, 0, 0, .47, .5, 3.15);
  b.box('glass', 0, .22, 2.57, .6, .3, .42, -.35);
  for (const side of [-1, 1]) {
    b.box('paint', side * 2.03, -.09, -.13, 3.75, .09, .98, 0, side * .17, side * .015);
    b.box('paint', side * 1.08, .15, -2.52, 2, .07, .66, 0, side * .2);
    b.cylinder('metal', side * 1.38, -.44, .22, .25, 1.17, 'z');
    b.cylinder('rubber', side * 1.38, -.44, .83, .18, .025, 'z');
    b.box('paint', side * 1.38, -.21, .16, .07, .35, .64);
    for (let i = 0; i < 9; i++) b.ellipsoid('glass', side * .458, .1, -1.65 + i * .39, .025, .074, .052);
    b.ellipsoid(side === -1 ? 'tail' : 'headlight', side * 3.92, -.04, -.51, .08, .065, .1);
  }
  b.box('paint', 0, .64, -2.46, .085, 1.22, .92, -.24);
  return b;
}

/** +Z is the bow/nose. Heading is always the actual tangent of the route. */
export function seaPose(t: number) {
  const a = t * .06;
  return { x: 89 + Math.sin(a) * 8, z: 72 + Math.cos(a) * 3,
    angle: Math.atan2(8 * Math.cos(a), -3 * Math.sin(a)) };
}
export function airPose(t: number) {
  const a = t * .028;
  return { x: Math.sin(a) * 92, z: 7 + Math.cos(a) * 52,
    angle: Math.atan2(92 * Math.cos(a), -52 * Math.sin(a)), bank: -.13 * Math.sin(a) };
}

export function createVehicles(tools: SceneTools) {
  const mats: Record<Layer, T.Material> = {
    paint: tools.material({ color: 0xffffff, roughness: .48, metalness: .18 }),
    glass: tools.material({ color: 0x3f697b, roughness: .17, metalness: .4 }),
    rubber: tools.material({ color: 0x26312f, roughness: 1 }),
    metal: tools.material({ color: 0xa8b4b4, roughness: .48, metalness: .6 }),
    headlight: tools.trackMaterial(new T.MeshBasicMaterial({ color: 0xffedb6 })),
    tail: tools.material({ color: 0xbb3c32, emissive: 0x9e2118, emissiveIntensity: .35 }),
  };
  const meshes: T.InstancedMesh[] = [];
  function fleet(name: string, model: Builder, count: number) {
    const group = new T.Group(); group.name = name;
    for (const [layer, parts] of model.layers) {
      const normalized = parts.map(p => p.index ? p.toNonIndexed() : p);
      const geometry = tools.trackGeometry(mergeGeometries(normalized)!);
      parts.forEach(p => p.dispose()); normalized.forEach(p => p.dispose());
      const mesh = new T.InstancedMesh(geometry, mats[layer], count); mesh.name = `${name}-${layer}`;
      mesh.instanceMatrix.setUsage(T.DynamicDrawUsage); mesh.frustumCulled = false;
      mesh.castShadow = false; group.add(mesh); meshes.push(mesh);
      if (layer === 'paint') for (let i = 0; i < count; i++) mesh.setColorAt(i, new T.Color(
        name === 'commuter-jet' ? 0xe7e9e2 : name === 'motor-launch' ? 0xe5ddc9 : name === 'rail-shuttle' ? 0xb5caca
          : name === 'emergency-vans' ? [0xe4dfcd, 0xc65749, 0x658b9c][i] : paints[i % paints.length]));
    }
    tools.scene.add(group); return group;
  }
  const cars = fleet('sedans', carModel(), 38), buses = fleet('city-buses', busModel(), 4);
  const motorcycles = fleet('motorcycles', motorcycleModel(), 12), emergency = fleet('emergency-vans', carModel(true), 3);
  const train = fleet('rail-shuttle', trainModel(), 1), boat = fleet('motor-launch', boatModel(), 1), aircraft = fleet('commuter-jet', aircraftModel(), 1);
  const beacons = new T.InstancedMesh(tools.box, tools.trackMaterial(new T.MeshBasicMaterial({ color: 0xffffff })), 6);
  beacons.frustumCulled = false; beacons.instanceMatrix.setUsage(T.DynamicDrawUsage); tools.scene.add(beacons); meshes.push(beacons);
  for (let i = 0; i < 6; i++) beacons.setColorAt(i, new T.Color(i % 2 ? 0x72b4f5 : 0xf2574e));
  const wake = new T.InstancedMesh(tools.sphere, tools.material({ color: 0xd1e7df, roughness: .9 }), 12);
  wake.name = 'boat-wake'; wake.frustumCulled = false; tools.scene.add(wake); meshes.push(wake);
  const dummy = new T.Object3D();
  function set(group: T.Group, i: number, x: number, y: number, z: number, heading: number, roll = 0) {
    dummy.position.set(x, y, z); dummy.rotation.set(0, heading, roll); dummy.scale.setScalar(1); dummy.updateMatrix();
    group.children.forEach(child => (child as T.InstancedMesh).setMatrixAt(i, dummy.matrix));
  }
  return {
    update(t: number, progress: number, hazardous: boolean, roughSea: boolean, grounded: boolean, reduced: boolean) {
      for (const [group, count, start, speed] of [[cars, 38, 0, 4.5], [buses, 4, 40, 3.6], [motorcycles, 12, 20, 5.7], [emergency, 3, 7, 6]] as const) {
        for (let i = 0; i < count; i++) {
          const p = trafficAt(i + start, progress, speed); set(group, i, p.x, 0, p.z, p.angle);
          if (group === emergency) for (let side = 0; side < 2; side++) {
            const dx = (side ? .36 : -.36) * Math.cos(p.angle), dz = -(side ? .36 : -.36) * Math.sin(p.angle);
            dummy.position.set(p.x + dx, 1.69, p.z + dz); dummy.rotation.set(0, p.angle, 0); dummy.scale.set(.29, .13, .25); dummy.updateMatrix(); beacons.setMatrixAt(i * 2 + side, dummy.matrix);
          }
        }
      }
      emergency.visible = hazardous; beacons.visible = hazardous && (reduced || t % 1.2 < .6);
      const rail = trainAt(t); set(train, 0, rail.x, 0, rail.z, rail.angle);
      const sea = seaPose(t); set(boat, 0, sea.x, .45 + (reduced ? 0 : Math.sin(t * .8) * .035), sea.z, sea.angle, reduced ? 0 : Math.sin(t * .65) * .03);
      boat.visible = wake.visible = !roughSea;
      for (let i = 0; i < 12; i++) {
        const past = seaPose(t - .4 - i * .3);
        dummy.position.set(past.x - Math.sin(past.angle) * 2.5, .19, past.z - Math.cos(past.angle) * 2.5);
        dummy.rotation.set(0, past.angle, 0); dummy.scale.set(.15 + i * .085, .025, .23); dummy.updateMatrix(); wake.setMatrixAt(i, dummy.matrix);
      }
      const air = airPose(t); set(aircraft, 0, air.x, 47, air.z, air.angle, air.bank); aircraft.visible = !grounded;
      meshes.forEach(mesh => { mesh.instanceMatrix.needsUpdate = true; });
    },
    stats: (t: number) => ({ train: trainAt(t), boat: seaPose(t), aircraft: airPose(t), vehicleLayers: meshes.length }),
    dispose() { meshes.forEach(mesh => mesh.dispose()); },
  };
}
