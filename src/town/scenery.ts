import * as T from 'three';
import { addReferenceBuilding, addReferenceProps, addReferenceTree, type ReferenceBlock, type ReferenceLeaf } from './referenceAssets';
import { AVENUES, STREETS, PLOTS, WORLD, RIVER_WIDTH, RIVER_PARK, RAIL, ROADS, coastX, riverX, isSea, type Plot } from './world';

export type Roof = { x: number; z: number; y: number; w: number; d: number; open?: boolean };
export type Tree = { x: number; z: number; size: number };
export type SceneTools = {
  scene: T.Scene;
  box: T.BoxGeometry;
  sphere: T.SphereGeometry;
  material: (options: T.MeshStandardMaterialParameters) => T.MeshStandardMaterial;
  trackGeometry: <G extends T.BufferGeometry>(shape: G) => G;
  trackMaterial: <M extends T.Material>(mat: M) => M;
};

export function ribbonGeometry(width: number, minZ = WORLD.minZ, maxZ = WORLD.maxZ, center = riverX) {
  const positions: number[] = [], indices: number[] = [];
  const segments = 100;
  for (let i = 0; i <= segments; i++) {
    const z = minZ + (maxZ - minZ) * i / segments;
    positions.push(center(z) - width / 2, 0, z, center(z) + width / 2, 0, z);
    if (i < segments) { const n = i * 2; indices.push(n, n + 2, n + 1, n + 1, n + 2, n + 3); }
  }
  const shape = new T.BufferGeometry();
  shape.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  shape.setIndex(indices);
  shape.computeVertexNormals();
  return shape;
}

function facility(block: ReferenceBlock, plot: Plot): Roof[] {
  const { x, z, facility: kind } = plot;
  block(x, .12, z, 22, .2, 17, 0xc8c5b8);
  if (kind === 'park') {
    block(x, .25, z, 21, .15, 16, 0x7eac63);
    block(x, .35, z, 2, .06, 16, 0xd5c8a7);
    block(x, .35, z + 2, 21, .06, 1.5, 0xd5c8a7);
    addReferenceProps(block, [{ kind: 'fountain', x: x + 5, z: z - 2 },
      { kind: 'bench', x: x - 5, z: z + 4 }, { kind: 'bench', x: x + 5, z: z + 5 },
      { kind: 'table', x: x - 5, z: z - 3 }, { kind: 'bin', x: x - 8, z: z + 5 }]);
    // Children's playground, slide and swings.
    block(x - 6, 1.9, z - 4, 2.4, .2, 1.5, 0xcd9159);
    for (const side of [-1, 1]) block(x - 6 + side, 1, z - 4, .16, 2, .16, 0x47787d);
    block(x - 6, 1, z - 2.6, 1, .15, 3.2, 0xb8c3c0, 'solid', -.2);
    return [];
  }
  if (kind === 'stadium') {
    block(x, .28, z, 14, .1, 10, 0x538856);
    for (const side of [-1, 1]) {
      block(x + side * 9, 1.1, z, 3, 2, 15, 0xbac2bc);
      block(x, .4, z + side * 4.6, 13.5, .02, .12, 0xf4f1dc);
      block(x + side * 6.5, .4, z, .12, .02, 9, 0xf4f1dc);
      block(x + side * 6.2, 1.1, z, .12, 1.6, 3.8, 0xf4f1dc);
      block(x + side * 5.7, 1.9, z, 1.2, .12, 3.8, 0xf4f1dc);
    }
    block(x, .4, z, .12, .02, 9.2, 0xf4f1dc);
    return [];
  }
  if (kind === 'market') {
    const canopies: Roof[] = [];
    for (let i = 0; i < 8; i++) {
      const sx = x - 7 + i % 4 * 4.5, sz = z - 4 + Math.floor(i / 4) * 7;
      addReferenceProps(block, [{ kind: 'marketStall', x: sx, z: sz, index: i }]);
      canopies.push({ x: sx, z: sz, y: 2.98, w: 2.6, d: 1.45, open: true });
    }
    addReferenceProps(block, [{ kind: 'table', x, z }, { kind: 'bin', x: x + 9, z: z + 6 }]);
    return canopies;
  }
  if (kind === 'power') {
    for (let i = 0; i < 12; i++) {
      block(x - 7 + i % 4 * 4.3, 1.2, z - 5 + Math.floor(i / 4) * 4.6, 3.2, .16, 3.4, 0x29495e, 'roof');
      block(x - 7 + i % 4 * 4.3, .7, z - 5 + Math.floor(i / 4) * 4.6, .2, 1, .2, 0x8d9f9b);
    }
    block(x + 8, 2.2, z, 3, 4.2, 8, 0xc6c8b8);
    return [{ x: x + 8, z, y: 4.35, w: 3, d: 8 }];
  }
  const height = kind === 'hospital' ? 10 : kind === 'station' ? 5 : 6;
  const tint = kind === 'fire' ? 0xb96b51 : kind === 'police' ? 0x698392 : kind === 'school' ? 0xcdb982 : 0xe4dfce;
  addReferenceBuilding(block, x, z - 1, 18, 11, height, kind === 'hospital' ? 'office' : 'civic', plot.index);
  block(x, height + .6, z - 1, 18.5, .3, 11.5, tint, 'roof');
  if (kind === 'hospital') {
    for (const [w, h] of [[2.7, .6], [.6, 2.7]]) block(x, height - 1.2, z + 4.85, w, h, .12, 0xbc514e);
    block(x - 4, height + .83, z - 1, 4, .03, 4, 0x607675);
    block(x - 4, height + .86, z - 1, .2, .03, 2.6, 0xf0eedf);
    for (const side of [-1, 1]) block(x - 4 + side * .9, height + .86, z - 1, .2, .03, 2.6, 0xf0eedf);
  }
  if (kind === 'fire' || kind === 'police') {
    for (let i = -1; i <= 1; i++) block(x + i * 5, 1.7, z + 5, 3.8, 3, .15, tint);
  }
  if (kind === 'school') {
    block(x + 7, 2.3, z + 7, .1, 4.5, .1, 0x7f8b85);
    block(x + 7.6, 4, z + 7, 1.3, .8, .07, 0xe8c976);
  }
  if (kind === 'station') {
    block(x, 3, z + 5.5, 20, .18, 3, 0x517b7e, 'roof');
    for (let i = -2; i <= 2; i++) block(x + i * 4, 1.5, z + 6, .16, 3, .16, 0xb4bbb0);
    block(x, 4, z + 5.7, 1.3, 1.3, .14, 0xf1ecdc);
    block(x, 4.15, z + 5.8, .07, .45, .03, 0x4c5654);
  }
  return [{ x, z: z - 1, y: height + .8, w: 18, d: 11 }];
}

export function buildScenery(tools: SceneTools, block: ReferenceBlock, leaf: ReferenceLeaf) {
  const { scene, trackGeometry, material } = tools;
  const roofs: Roof[] = [], trees: Tree[] = [];
  const groundMat = material({ color: 0x82a55c, roughness: 1 });
  const beachMat = material({ color: 0xe2cfaa, roughness: 1 });
  const waterMat = material({ color: 0x4d9eac, roughness: .28, metalness: .12 });
  const plane = (w: number, d: number, mat: T.Material, x: number, y: number, z: number) => {
    const mesh = new T.Mesh(trackGeometry(new T.PlaneGeometry(w, d)), mat);
    mesh.rotation.x = -Math.PI / 2; mesh.position.set(x, y, z); mesh.receiveShadow = true; scene.add(mesh); return mesh;
  };
  block(0, -1.55, WORLD.centerZ, WORLD.width, 3.1, WORLD.depth, 0x5b4e40);
  plane(WORLD.width, WORLD.depth, groundMat, 0, .025, WORLD.centerZ);
  const bank = new T.Mesh(trackGeometry(ribbonGeometry(RIVER_WIDTH + 2.2)), material({ color: 0xb4b49b, roughness: 1 }));
  bank.position.y = .06; bank.receiveShadow = true; scene.add(bank);
  const river = new T.Mesh(trackGeometry(ribbonGeometry(RIVER_WIDTH)), waterMat);
  river.position.y = .12; river.receiveShadow = true; scene.add(river);
  for (const side of [-1, 1]) {
    const path = new T.Mesh(trackGeometry(ribbonGeometry(1.8, WORLD.minZ, WORLD.maxZ, z => riverX(z) + side * 7)), material({ color: 0xcac6b5, roughness: 1 }));
    path.position.y = .16; scene.add(path);
  }
  // South-east shore. Narrow strips make a gently bending shoreline, rather than a separate rear pool.
  const shoreStrip = (sea: boolean) => {
    const vertices: number[] = [], indices: number[] = [];
    for (let i = 0; i <= 54; i++) {
      const z = 54 + i * .5, edge = coastX(z);
      vertices.push(sea ? edge : edge - 5, sea ? .14 : .15, z, sea ? WORLD.maxX : edge, sea ? .14 : .15, z);
      if (i < 54) { const n = i * 2; indices.push(n, n + 2, n + 1, n + 1, n + 2, n + 3); }
    }
    const shape = trackGeometry(new T.BufferGeometry());
    shape.setAttribute('position', new T.Float32BufferAttribute(vertices, 3)); shape.setIndex(indices); shape.computeVertexNormals();
    const mesh = new T.Mesh(shape, sea ? waterMat : beachMat); mesh.receiveShadow = true; scene.add(mesh);
  };
  shoreStrip(true); shoreStrip(false);
  plane(39, 4.8, beachMat, 88.5, .16, 52.1);
  for (let i = 0; i < 8; i++) {
    const z = 57 + i * 3;
    block(coastX(z) + .8, .17, z, .22, .035, 1.5, 0xe6eee0);
    block(63, .4, z, .08, .7, .08, 0x8b7454);
  }
  const pierX = 85, pierZ = 62;
  block(pierX, .55, pierZ, 18, .25, 2.6, 0xa88861, 'roof');
  roofs.push({ x: pierX, z: pierZ, y: .675, w: 18, d: 2.6, open: true });
  for (let i = 0; i < 6; i++) for (const side of [-1, 1]) block(77 + i * 3, -.2, pierZ + side * 1, .28, 1.7, .28, 0x6b5945);
  for (let i = 0; i < 7; i++) {
    const x = 75 + i * 4;
    block(x, .38, 50.1, 1.6, .16, .7, 0xdad8c5);
    block(x, 1.2, 49.9, .08, 1.8, .08, 0x84694b);
    block(x, 2.2, 49.9, 2.6, .15, 2.4, i % 2 ? 0xd0b78a : 0xe5dcc6, 'roof');
    roofs.push({ x, z: 49.9, y: 2.275, w: 2.6, d: 2.4, open: true });
  }
  // Every road ends at a junction. Surface crosses the river continuously on bridge decks.
  for (const { a, b, width } of ROADS) {
    const w = Math.abs(b[0] - a[0]) + width, d = Math.abs(b[1] - a[1]) + width;
    const x = (a[0] + b[0]) / 2, z = (a[1] + b[1]) / 2;
    block(x, .16, z, w + 2.3, .17, d + 2.3, 0xc6c4b8);
    block(x, .27, z, w, .055, d, 0x454a49);
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let t = 3; t < length; t += 6) {
      const px = a[0] + (b[0] - a[0]) * t / length, pz = a[1] + (b[1] - a[1]) * t / length;
      if (AVENUES.some(ax => Math.abs(ax - px) < 4) && STREETS.some(sz => Math.abs(sz - pz) < 4)) continue;
      block(px, .308, pz, b[0] === a[0] ? .13 : 2.2, .015, b[0] === a[0] ? 2.2 : .13, 0xefeadb);
    }
  }
  for (const z of STREETS) {
    const x = riverX(z);
    block(x, .16, z, 19, .22, 7.4, 0xb9b5a8);
    block(x, .28, z, 19, .055, 5, 0x454a49);
    for (const side of [-1, 1]) {
      block(x, 1.15, z + side * 3.2, 19, .15, .18, 0xd6d7c6);
      for (let i = -4; i <= 4; i++) block(x + i * 2, .75, z + side * 3.2, .16, .8, .16, 0x808a80);
      block(x + side * 7, -.55, z, .8, 1.5, 6.8, 0x92988d);
    }
    for (let i = -3; i <= 3; i++) block(x + i * 2.8, .314, z, 1.3, .012, .13, 0xeeeada);
  }
  for (const x of AVENUES) for (const z of STREETS) {
    if (x === 90 && z === 72) continue;
    for (const side of [-1, 1]) for (let stripe = -2; stripe <= 2; stripe++) {
      block(x + stripe * .67, .32, z + side * 3.1, .4, .014, 1, 0xeae9d7);
      block(x + side * 3.1, .32, z + stripe * .67, 1, .014, .4, 0xeae9d7);
    }
    addReferenceProps(block, [{ kind: 'lamp', x: x - 3.5, z: z - 4 }, { kind: 'bin', x: x + 3.6, z: z + 4 }]);
    block(x + 3.5, 1.65, z - 3.8, .12, 3.2, .12, 0x60706c);
    block(x + 3.5, 3, z - 3.8, .44, .82, .3, 0x303e3b);
    block(x + 3.5, 3.18, z - 3.61, .18, .17, .07, 0xbd5f47);
    block(x + 3.5, 2.84, z - 3.61, .18, .17, .07, 0x76a36a, 'light');
  }
  for (const plot of PLOTS) {
    if (plot.facility) { roofs.push(...facility(block, plot)); continue; }
    if (plot.waterfront || plot.w < 10) {
      addReferenceBuilding(block, plot.x, plot.z, plot.w - .8, plot.d - 2, plot.height, plot.waterfront ? 'apartment' : 'shop', plot.index);
      roofs.push({ x: plot.x, z: plot.z, y: plot.height + .7, w: plot.w - .5, d: plot.d - 2 });
      continue;
    }
    for (const side of [-1, 1]) {
      const x = plot.x + side * 5.8, z = plot.z;
      const h = plot.height + (side === 1 ? 3 : 0);
      const kind = plot.index % 4 === 0 ? 'office' : plot.index % 3 === 0 ? 'shop' : 'apartment';
      addReferenceBuilding(block, x, z, 8.5, plot.d - 2, h, kind, plot.index + (side === 1 ? 1 : 0));
      roofs.push({ x, z, y: h + .7, w: 8.3, d: plot.d - 2.3 });
    }
  }
  // Quiet residential edges add length without blocking the connected road network.
  for (let i = 0; i < 7; i++) {
    const z = -40 + i * 16;
    for (const x of [-101, 101]) {
      if (isSea(x, z) || x === 101 && z > 44) continue;
      addReferenceBuilding(block, x, z, 7, 9, 5 + i % 3, 'house', i);
      roofs.push({ x, z, y: 5.7 + i % 3, w: 7, d: 9 });
    }
  }
  for (const plot of PLOTS) {
    if (plot.waterfront || plot.w < 10) continue;
    for (const side of [-1, 1]) trees.push({ x: plot.x + side * 10.8, z: plot.z + 7.7, size: .9 + plot.index % 3 * .12 });
    if (plot.facility === 'park') for (let i = 0; i < 5; i++) trees.push({ x: plot.x - 8 + i * 4, z: plot.z - 6, size: 1.2 });
    addReferenceProps(block, [{ kind: 'bench', x: plot.x, z: plot.z + 9.5 }]);
  }
  for (let i = 0; i < 30; i++) {
    const z = -62 + i * 4.6;
    for (const side of [-1, 1]) {
      const x = riverX(z) + side * 10;
      if (!PLOTS.some(p => Math.abs(p.x - x) < p.w / 2 + 1.7 && Math.abs(p.z - z) < p.d / 2 + 1.7))
        trees.push({ x, z, size: .7 + i % 3 * .15 });
    }
  }
  for (const side of [-1, 1]) {
    const x = riverX(RIVER_PARK.z) + side * 15;
    plane(10, 19, groundMat, x, .17, RIVER_PARK.z);
    block(x, .2, RIVER_PARK.z, 1.3, .05, 18, 0xd6ccb6);
    block(x, .2, RIVER_PARK.z, 9, .05, 1.3, 0xd6ccb6);
    addReferenceProps(block, [{ kind: 'fountain', x: x + side * 2, z: 5 },
      { kind: 'bench', x: x + side * 2, z: 14 }, { kind: 'bin', x: x - side * 2, z: 14 }]);
    for (const z of [2, 17]) trees.push({ x: x + side * 3, z, size: 1.1 });
  }
  trees.forEach((tree, i) => addReferenceTree(block, leaf, tree.x, tree.z, tree.size, i));
  // Rail corridor connects the station to the north and south suburbs; cars never use it.
  for (const x of [RAIL.x - .7, RAIL.x + .7]) block(x, .29, -3, .12, .09, RAIL.maxZ - RAIL.minZ, 0x777f7b);
  for (let z = RAIL.minZ; z < RAIL.maxZ; z += 1.6) block(RAIL.x, .22, z, 2.4, .12, .35, 0x9c927e);
  block(93.8, .5, -44.5, 1.2, .4, 17, 0xc8c6b9);
  for (const z of [RAIL.minZ, RAIL.maxZ]) {
    block(RAIL.x, .8, z, 1.8, .18, .3, 0xb54c40);
    for (const side of [-1, 1]) block(RAIL.x + side * .7, .55, z, .16, .8, .4, 0x5e6863);
  }
  // A rocky, vegetated slope provides a geographical source for landslides.
  const hill = new T.Mesh(tools.trackGeometry(new T.SphereGeometry(1, 16, 10)), material({ color: 0x7c9068, roughness: 1 }));
  hill.position.set(-101, -.5, -61); hill.scale.set(10, 11, 6); hill.castShadow = hill.receiveShadow = true; scene.add(hill);
  const hillRockMat = material({ color: 0x827e6c, roughness: 1 });
  for (let i = 0; i < 10; i++) {
    const rock = new T.Mesh(tools.sphere, hillRockMat);
    rock.position.set(-104 + i % 4 * 2.3, 3 + i % 3 * 1.6, -63 + Math.floor(i / 4) * 2.4);
    rock.scale.set(1.4, 1.1, .9); scene.add(rock);
  }
  return { groundMat, beachMat, waterMat, river, roofs, trees };
}
