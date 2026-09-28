import * as T from 'three';
import {
  addReferenceBuilding, addReferencePark, addReferencePerson, addReferenceProps,
  addReferenceTree, addReferenceVehicle, type ReferenceBuildingKind,
} from './referenceAssets';

export type TownSettings = {
  weather: 'clear' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'fog' | 'heat';
  disaster: 'none' | 'flood' | 'earthquake' | 'wildfire' | 'tsunami' | 'tornado';
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  climate: 'temperate' | 'tropical' | 'arid';
  hour: number;
  playing: boolean;
};

type Instance = { position: T.Vector3; scale: T.Vector3; color: T.Color; rotation: number };
type Batch = { geometry: T.BufferGeometry; material: T.Material; items: Instance[] };
type RoutePoint = readonly [number, number];

const TAU = Math.PI * 2;
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
const color = (hex: number) => new T.Color(hex);

function routeAt(points: readonly RoutePoint[], distance: number) {
  let total = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    total += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  let left = ((distance % total) + total) % total;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (left <= length) {
      const t = left / length;
      return { x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, angle: Math.atan2(b[0] - a[0], b[1] - a[1]) };
    }
    left -= length;
  }
  return { x: points[0][0], z: points[0][1], angle: 0 };
}

export function createTownScene(canvas: HTMLCanvasElement, initial: TownSettings) {
  const scene = new T.Scene();
  const camera = new T.OrthographicCamera(-55, 55, 38, -38, .1, 260);
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.16;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  const geometry: T.BufferGeometry[] = [];
  const materials: T.Material[] = [];
  const disposers: Array<() => void> = [];
  const boxGeometry = new T.BoxGeometry(1, 1, 1);
  const foliageGeometry = new T.IcosahedronGeometry(1, 1);
  const sphereGeometry = new T.SphereGeometry(1, 8, 6);
  const flameGeometry = new T.ConeGeometry(1, 1, 5);
  geometry.push(boxGeometry, foliageGeometry, sphereGeometry, flameGeometry);

  const material = (options: T.MeshStandardMaterialParameters) => {
    const value = new T.MeshStandardMaterial(options);
    materials.push(value);
    return value;
  };
  const solid = material({ color: 0xffffff, roughness: .88, flatShading: true });
  const roofMat = material({ color: 0xffffff, roughness: .68, flatShading: true });
  const glass = material({ color: 0xffffff, roughness: .23, metalness: .24, emissive: 0xffcc7a, emissiveIntensity: 0 });
  const foliage = material({ color: 0xffffff, roughness: .98, flatShading: true });
  const warmLight = new T.MeshBasicMaterial({ color: 0xffd899 });
  materials.push(warmLight);
  const batches = new Map<string, Batch>();
  const batchMeshes = new Map<string, T.InstancedMesh>();
  const add = (key: string, shape: T.BufferGeometry, mat: T.Material, x: number, y: number, z: number, sx: number, sy: number, sz: number, tint: number, rotation = 0) => {
    let batch = batches.get(key);
    if (!batch) { batch = { geometry: shape, material: mat, items: [] }; batches.set(key, batch); }
    batch.items.push({ position: new T.Vector3(x, y, z), scale: new T.Vector3(sx, sy, sz), color: color(tint), rotation });
  };
  const block = (x: number, y: number, z: number, w: number, h: number, d: number, tint: number, key = 'solid', rotation = 0) =>
    add(key, boxGeometry, key === 'glass' ? glass : key === 'roof' ? roofMat : key === 'light' ? warmLight : solid, x, y, z, w, h, d, tint, rotation);
  const leaf = (x: number, y: number, z: number, sx: number, sy: number, sz: number, tint: number) =>
    add('foliage', foliageGeometry, foliage, x, y, z, sx, sy, sz, tint);
  const makePlane = (w: number, h: number, mat: T.Material, x: number, y: number, z: number, receiveShadow = false) => {
    const shape = new T.PlaneGeometry(w, h);
    geometry.push(shape);
    const mesh = new T.Mesh(shape, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, y, z);
    mesh.receiveShadow = receiveShadow;
    scene.add(mesh);
    return mesh;
  };

  // Compact square diorama: the river and beach stay at the back edge.
  const groundMat = material({ color: 0x89ad55, roughness: 1 });
  const beachMat = material({ color: 0xdcc99f, roughness: 1 });
  const waterMat = material({ color: 0x4b9697, roughness: .34, metalness: .05 });
  const riverbankMat = material({ color: 0xb8ae93, roughness: 1 });
  block(0, -1.55, 0, 80, 3.1, 78, 0x554537);
  block(0, -.13, 0, 80.2, .26, 78.2, 0x689049);
  makePlane(80, 78, groundMat, 0, .015, 0, true);
  makePlane(80, 7.2, waterMat, 0, .085, -31);
  makePlane(80, .58, riverbankMat, 0, .105, -26.95);
  makePlane(80, .58, riverbankMat, 0, .105, -35.05);
  makePlane(8, 6, beachMat, 44.5, .13, -25.5, true);
  block(44.5, -1.55, -31, 9, 3.1, 16, 0x385f5e);
  makePlane(9, 16, waterMat, 44.5, .085, -31);
  for (let i = 0; i < 8; i++) block(46.5 + i % 2 * .9, .13, -37 + i * 1.65, .13, .02, 1.05, 0xd6e8d6);
  block(41.5, .31, -32, 7, .38, 2.3, 0xa78560);
  for (const x of [39, 44]) for (const z of [-33, -31]) block(x, -.32, z, .25, 1.1, .25, 0x604c3b);

  // Asphalt roads, raised pale sidewalks, bridges, and crosswalks.
  const road = (x: number, z: number, w: number, d: number) => {
    block(x, .1, z, w + 1.25, .17, d + 1.25, 0xbebbb0);
    block(x, .205, z, w, .055, d, 0x454747);
  };
  for (const x of [-20, 19]) {
    road(x, 1, 5, 55);
    for (const z of [-24, -19, -4, 1, 6, 23, 28]) block(x, .239, z, .12, .014, 2, 0xf3efe1);
  }
  for (const z of [-37, -25]) {
    road(0, z, 78, 4.2);
    for (const x of [-35, -29, -12, -6, 0, 6, 12, 27, 33]) block(x, .239, z, 2.25, .014, .12, 0xf3efe1);
  }
  for (const z of [-12, 15]) {
    road(0, z, 78, 5);
    for (const x of [-35, -29, -12, -6, 0, 6, 12, 27, 33]) block(x, .239, z, 2.25, .014, .12, 0xf3efe1);
  }
  for (const x of [-20, 19]) {
    block(x, .21, -31, 6.6, .44, 9.4, 0xaaa79b);
    block(x, .48, -31, 5, .1, 9.4, 0x494a49);
    for (const side of [-1, 1]) {
      block(x + side * 2.95, .9, -31, .22, .78, 9.4, 0xd8d0b9);
      for (let z = -34.5; z <= -27.5; z += 2.3) block(x + side * 2.95, 1.42, z, .34, .38, .34, 0x897f6a);
    }
    for (const z of [-34.5, -27.5]) for (const side of [-1, 1]) block(x + side * 2.25, -.42, z, .64, 1.2, .64, 0x776b5e);
    block(x, .54, -31, .12, .014, 2, 0xf3efe1);
  }
  for (const x of [-20, 19]) for (const z of [-12, 15]) {
    for (const direction of [-1, 1]) for (let stripe = -2; stripe <= 2; stripe++) {
      block(x + stripe * .66, .245, z + direction * 3.8, .35, .012, 1.2, 0xf5f0e4);
      block(x + direction * 3.8, .245, z + stripe * .66, 1.2, .012, .35, 0xf5f0e4);
    }
  }

  const plots: Array<readonly [number, number, number, number, number, ReferenceBuildingKind]> = [
    [-31, -18.5, 9, 8, 13, 'apartment'], [-10, -18.5, 11, 8, 19, 'apartment'],
    [8, -18.5, 10, 8, 16, 'apartment'], [30, -18.5, 11, 8, 22, 'office'],
    [-31, 0, 10, 11, 12, 'shop'], [0, 1, 16, 14, 9.5, 'restaurant'],
    [30, 0, 11, 11, 9, 'shop'],
    [-30, 25, 14, 10, 6, 'grocery'], [30, 25, 14, 10, 7, 'civic'],
  ];
  plots.forEach((plot, index) => addReferenceBuilding(block, ...plot, index));

  // Clustered faceted trees and tiny street life echo the supplied diorama.
  const treePositions: Array<readonly [number, number, number]> = [
    [-37, 8, 1.08], [-25, 8, .82], [-13, 9, 1.12], [13, 9, .95], [25, 9, .88],
    [-37, 34, .85], [-23, 34, .78], [-15, 21, 1.05], [-13, 27, 1.1],
    [-10, 34, 1.18], [-8, 31, 1.34], [-4, 35, 1.05], [8, 21, 1.08],
    [13, 34, 1.16], [16, 31, .88], [24, 35, .8], [37, 34, .9],
    [-37, -22, .76], [-25, -22, .82], [16, -22, .84], [37, -23, .9],
  ];
  treePositions.forEach(([x, z, size], i) => addReferenceTree(block, leaf, x, z, size, i));
  addReferencePark(block, 0, 27);
  addReferenceProps(block, [
    { kind: 'lamp', x: -16, z: -8 }, { kind: 'lamp', x: 15, z: -8 },
    { kind: 'lamp', x: -16, z: 19 }, { kind: 'lamp', x: 16, z: 19 },
    { kind: 'lamp', x: -38, z: -8 }, { kind: 'lamp', x: 38, z: 19 },
    { kind: 'bin', x: -37, z: 9 }, { kind: 'bin', x: 14, z: 10, index: 1 },
    { kind: 'marketStall', x: -29, z: 33, index: 1 },
    { kind: 'sign', x: -23, z: 18, index: 1 }, { kind: 'sign', x: 22, z: -8 },
  ]);
  addReferenceVehicle(block, -25, 19, Math.PI / 2, 'motorcycle', 2);
  addReferenceVehicle(block, 11, 22, -.35, 'car', 0);
  for (const [x, z, angle, index] of [
    [-12, 11, .3, 0], [-8, 11, -.3, 1], [11, 10, .4, 2],
    [-35, 31, 1.1, 3], [-24, 31, -1, 4], [21, 30, .4, 5],
    [-15, 19, .7, 0], [15, 22, -.8, 1], [9, 34, .5, 2],
    [-34, 19, -.2, 3], [35, 18, .3, 4],
  ]) addReferencePerson(block, x, z, angle, index);

  const dummy = new T.Object3D();
  for (const [key, batch] of batches) {
    const mesh = new T.InstancedMesh(batch.geometry, batch.material, batch.items.length);
    batch.items.forEach((item, index) => {
      dummy.position.copy(item.position);
      dummy.rotation.set(0, item.rotation, 0);
      dummy.scale.copy(item.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      mesh.setColorAt(index, item.color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.castShadow = key !== 'glass' && key !== 'light';
    mesh.receiveShadow = key !== 'foliage';
    mesh.frustumCulled = false;
    scene.add(mesh);
    batchMeshes.set(key, mesh);
  }

  const hemisphere = new T.HemisphereLight(0xffe9cd, 0x595246, 1.9);
  scene.add(hemisphere);
  const sun = new T.DirectionalLight(0xffddb0, 2.7);
  sun.position.set(-32, 58, -18);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -67;
  sun.shadow.camera.right = sun.shadow.camera.top = 67;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 170;
  sun.shadow.bias = -.00035;
  scene.add(sun, sun.target);
  const sky = color(0xb39a80);
  scene.background = sky;
  const fog = new T.FogExp2(0xb39a80, .003);
  scene.fog = fog;

  const dynamicMat = material({ color: 0xffffff, roughness: .55, metalness: .08 });
  const rubberMat = material({ color: 0x20272a, roughness: 1 });
  const actorGlass = material({ color: 0x789aaa, roughness: .18, metalness: .25 });
  const skinMat = material({ color: 0xffffff, roughness: 1 });
  const makeDynamic = (shape: T.BufferGeometry, mat: T.Material, count: number) => {
    const mesh = new T.InstancedMesh(shape, mat, count);
    mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    mesh.frustumCulled = false;
    scene.add(mesh);
    return mesh;
  };
  const carCount = 11;
  const carBody = makeDynamic(boxGeometry, dynamicMat, carCount);
  const carCabin = makeDynamic(boxGeometry, actorGlass, carCount);
  const carWheels = makeDynamic(boxGeometry, rubberMat, carCount * 4);
  const carLights = makeDynamic(boxGeometry, warmLight, carCount * 2);
  const carColors = [0xc7624a, 0xd4d5ca, 0x587779, 0xbba765, 0x576b82, 0x88847a, 0x71926f, 0xe1cfaa, 0x5c6168, 0x925f58, 0xb5bbb7];
  carColors.forEach((tint, index) => carBody.setColorAt(index, color(tint)));
  const motorcycleCount = 5;
  const motoBody = makeDynamic(boxGeometry, dynamicMat, motorcycleCount);
  const motoRider = makeDynamic(boxGeometry, dynamicMat, motorcycleCount);
  const motoWheels = makeDynamic(boxGeometry, rubberMat, motorcycleCount * 2);
  for (let i = 0; i < motorcycleCount; i++) {
    motoBody.setColorAt(i, color([0x455d6c, 0xc76c50, 0xc8ae63, 0x556b58, 0x4c5051][i]));
    motoRider.setColorAt(i, color([0x677d78, 0xd2c6aa, 0x555f67][i % 3]));
  }
  const personCount = 19;
  const peopleBodies = makeDynamic(boxGeometry, dynamicMat, personCount);
  const peopleHeads = makeDynamic(sphereGeometry, skinMat, personCount);
  const peopleLegs = makeDynamic(boxGeometry, dynamicMat, personCount * 2);
  for (let i = 0; i < personCount; i++) {
    peopleBodies.setColorAt(i, color([0x8a6b5a, 0x5c7c7b, 0xc4a06a, 0x768568, 0x525b68, 0xb58d84][i % 6]));
    peopleHeads.setColorAt(i, color([0xc39372, 0xe0b899, 0x966b54, 0xb57e61][i % 4]));
  }
  const setPose = (mesh: T.InstancedMesh, index: number, x: number, y: number, z: number, w: number, h: number, d: number, rotation: number) => {
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, rotation, 0);
    dummy.scale.set(w, h, d);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  };
  const offset = (x: number, z: number, side: number, front: number, rotation: number) => ({
    x: x + side * Math.cos(rotation) + front * Math.sin(rotation),
    z: z - side * Math.sin(rotation) + front * Math.cos(rotation),
  });
  const centerLoop: RoutePoint[] = [[-20, -12], [19, -12], [19, 15], [-20, 15]];
  const bridgeLoop: RoutePoint[] = [[-20, -37], [19, -37], [19, -12], [-20, -12]];
  const trafficRoutes = [centerLoop, bridgeLoop, centerLoop];
  const sidewalkRoutes: RoutePoint[][] = [
    [[-10, -7], [10, -7], [10, 11], [-10, 11]],
    [[-37, -7], [-25, -7], [-25, 8], [-37, 8]],
    [[23.5, -7], [37, -7], [37, 8], [23.5, 8]],
    [[-38, 19], [-23, 19], [-23, 33], [-38, 33]],
    [[22, 19], [38, 19], [38, 33], [22, 33]],
    [[-14, 21], [14, 21], [14, 35], [-14, 35]],
  ];
  const aircraft = new T.Group();
  const aircraftMat = material({ color: 0xf4f2df, roughness: .42, metalness: .12 });
  const addAircraft = (x: number, y: number, z: number, w: number, h: number, d: number, mat: T.Material) => {
    const part = new T.Mesh(boxGeometry, mat);
    part.position.set(x, y, z);
    part.scale.set(w, h, d);
    aircraft.add(part);
  };
  addAircraft(0, 0, 0, 1.1, .65, 5.4, aircraftMat);
  addAircraft(0, .05, -.5, 8.2, .13, 1.25, aircraftMat);
  addAircraft(0, .58, -2.4, 2.4, 1.15, .15, aircraftMat);
  addAircraft(0, 0, -2.25, 3.4, .12, .7, aircraftMat);
  scene.add(aircraft);

  const cloudMat = material({ color: 0xffffff, roughness: 1, transparent: true, opacity: .78, depthWrite: false });
  const clouds = makeDynamic(sphereGeometry, cloudMat, 19);
  clouds.castShadow = false;
  const rainShape = new T.BufferGeometry();
  const rainArray = new Float32Array(280 * 6);
  rainShape.setAttribute('position', new T.BufferAttribute(rainArray, 3));
  geometry.push(rainShape);
  const rainMat = new T.LineBasicMaterial({ color: 0xc7e1ee, transparent: true, opacity: .7, depthWrite: false });
  materials.push(rainMat);
  const rain = new T.LineSegments(rainShape, rainMat);
  rain.frustumCulled = false;
  scene.add(rain);
  const snowShape = new T.BufferGeometry();
  const snowArray = new Float32Array(260 * 3);
  snowShape.setAttribute('position', new T.BufferAttribute(snowArray, 3));
  geometry.push(snowShape);
  const snowMat = new T.PointsMaterial({ color: 0xf5faf9, size: .33, transparent: true, opacity: .9, depthWrite: false });
  materials.push(snowMat);
  const snow = new T.Points(snowShape, snowMat);
  snow.frustumCulled = false;
  scene.add(snow);
  const stormFlashMat = new T.LineBasicMaterial({ color: 0xf5f5ff, transparent: true, opacity: .95 });
  materials.push(stormFlashMat);
  const lightningShape = new T.BufferGeometry().setFromPoints([
    new T.Vector3(-10, 36, -19), new T.Vector3(-12, 28, -18), new T.Vector3(-9, 27, -18),
    new T.Vector3(-13, 18, -15), new T.Vector3(-11, 17, -15), new T.Vector3(-14, 10, -12),
  ]);
  geometry.push(lightningShape);
  const lightning = new T.Line(lightningShape, stormFlashMat);
  scene.add(lightning);

  const floodMat = material({ color: 0x5194a6, roughness: .2, metalness: .1, transparent: true, opacity: .73, depthWrite: false, side: T.DoubleSide });
  const flood = makePlane(79, 16, floodMat, 0, .36, -26);
  const earthquakeMat = new T.LineBasicMaterial({ color: 0x2a3434, linewidth: 2 });
  materials.push(earthquakeMat);
  const crackPoints = [
    [-47, -10], [-36, -9], [-33, -11], [-23, -10], [-17, -8], [-10, -10], [-3, -8],
    [4, -10], [11, -8], [17, -9], [22, -7], [32, -8],
  ];
  const cracks = new T.Line(new T.BufferGeometry().setFromPoints(crackPoints.map(([x, z]) => new T.Vector3(x, .45, z))), earthquakeMat);
  geometry.push(cracks.geometry);
  scene.add(cracks);
  const debris = new T.Group();
  for (let i = 0; i < 24; i++) {
    const piece = new T.Mesh(boxGeometry, roofMat);
    piece.material = roofMat;
    piece.position.set(-38 + i * 2.8, .43, -9 + Math.sin(i * 7) * 1.4);
    piece.scale.set(.24 + i % 3 * .13, .2 + i % 2 * .15, .3);
    piece.rotation.set(i * .73, i * 1.1, i * .21);
    debris.add(piece);
  }
  scene.add(debris);
  const wildfireMat = material({ color: 0xffa136, emissive: 0xff4b0b, emissiveIntensity: 1.8, roughness: 1, transparent: true, opacity: .88, side: T.DoubleSide });
  const wildfire = new T.Group();
  for (let i = 0; i < 23; i++) {
    const x = -14 + i * 1.3, z = i % 2 ? 25 : 29 + i % 3;
    const flame = new T.Mesh(flameGeometry, wildfireMat);
    flame.position.set(x, 1.1 + i % 3 * .25, z);
    flame.scale.set(.65 + i % 3 * .22, 2.3 + i % 4 * .55, .65);
    wildfire.add(flame);
  }
  const smokeMat = new T.PointsMaterial({ color: 0x57534d, size: 1.1, transparent: true, opacity: .64, depthWrite: false });
  materials.push(smokeMat);
  const smokeShape = new T.BufferGeometry();
  const smokeArray = new Float32Array(90 * 3);
  smokeShape.setAttribute('position', new T.BufferAttribute(smokeArray, 3));
  geometry.push(smokeShape);
  const smoke = new T.Points(smokeShape, smokeMat);
  smoke.frustumCulled = false;
  wildfire.add(smoke);
  scene.add(wildfire);
  const waveMat = material({ color: 0x5cacc0, roughness: .24, metalness: .06, transparent: true, opacity: .87, side: T.DoubleSide });
  const tsunami = new T.Group();
  const wave = new T.Mesh(boxGeometry, waveMat);
  wave.scale.set(78, 7.5, 2.4);
  wave.position.set(0, 3.6, -36);
  tsunami.add(wave);
  const foam = new T.Mesh(boxGeometry, material({ color: 0xdaf2ea, roughness: .8, transparent: true, opacity: .92 }));
  foam.scale.set(78, .55, 3);
  foam.position.set(0, 7.4, -35.5);
  tsunami.add(foam);
  scene.add(tsunami);
  const tornado = new T.Group();
  const funnelGeometry = new T.CylinderGeometry(4.8, .55, 17, 16, 1, true);
  geometry.push(funnelGeometry);
  const funnelMat = material({ color: 0x697879, roughness: 1, transparent: true, opacity: .62, side: T.DoubleSide, depthWrite: false });
  const funnel = new T.Mesh(funnelGeometry, funnelMat);
  funnel.position.y = 9;
  tornado.add(funnel);
  const spiral = new T.Line(new T.BufferGeometry().setFromPoints(Array.from({ length: 170 }, (_, i) => {
    const fraction = i / 169;
    const radius = .8 + fraction * 4;
    const angle = fraction * Math.PI * 12;
    return new T.Vector3(Math.sin(angle) * radius, 1 + fraction * 17, Math.cos(angle) * radius);
  })), new T.LineBasicMaterial({ color: 0xd8ddd7, transparent: true, opacity: .68 }));
  geometry.push(spiral.geometry);
  materials.push(spiral.material);
  tornado.add(spiral);
  tornado.position.set(8, .2, 10);
  scene.add(tornado);

  let settings = { ...initial };
  let elapsed = 0;
  let trafficProgress = 0;
  let pedestrianProgress = 0;
  let lastFrame = performance.now();
  let raf = 0;
  let destroyed = false;
  let reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let azimuth = Math.PI / 4;
  let elevation = .7;
  let zoom = 1;
  const pointers = new Map<number, { x: number; y: number }>();
  let lastPinch = 0;
  const focus = new T.Vector3(0, 4, 0);
  const updateCamera = (shake = 0) => {
    const r = 110;
    camera.position.set(
      focus.x + Math.sin(azimuth) * Math.cos(elevation) * r + shake,
      focus.y + Math.sin(elevation) * r,
      focus.z + Math.cos(azimuth) * Math.cos(elevation) * r,
    );
    camera.lookAt(focus);
    camera.updateProjectionMatrix();
  };
  const updateProjection = (width = Math.max(1, canvas.clientWidth), height = Math.max(1, canvas.clientHeight)) => {
    const aspect = width / height;
    const span = aspect < .82 ? Math.max(108, 106 / aspect) : aspect < 1.2 ? 98 : 86;
    camera.top = span / 2 / zoom;
    camera.bottom = -camera.top;
    camera.right = camera.top * aspect;
    camera.left = -camera.right;
    updateCamera();
    draw(0);
  };
  const resize = () => {
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(2_000_000 / (width * height))));
    renderer.setSize(width, height, false);
    updateProjection(width, height);
  };
  const rotateCamera = (deltaAzimuth: number, deltaElevation: number) => {
    azimuth = clamp(azimuth + deltaAzimuth, .33, 1.27);
    elevation = clamp(elevation + deltaElevation, .48, .9);
    updateCamera();
    draw(0);
  };
  const zoomCamera = (factor: number) => {
    zoom = clamp(zoom * factor, .7, 1.75);
    updateProjection();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  const priorTouchAction = canvas.style.touchAction;
  canvas.style.touchAction = 'none';
  const onPointerDown = (event: PointerEvent) => {
    canvas.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2) {
      const pair = [...pointers.values()];
      lastPinch = Math.hypot(pair[0].x - pair[1].x, pair[0].y - pair[1].y);
    }
  };
  const onPointerMove = (event: PointerEvent) => {
    const previous = pointers.get(event.pointerId);
    if (!previous) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2) {
      const pair = [...pointers.values()];
      const pinch = Math.hypot(pair[0].x - pair[1].x, pair[0].y - pair[1].y);
      if (lastPinch > 0) zoomCamera(pinch / lastPinch);
      lastPinch = pinch;
    } else {
      rotateCamera(-(event.clientX - previous.x) * .006, (event.clientY - previous.y) * .004);
    }
  };
  const onPointerUp = (event: PointerEvent) => { pointers.delete(event.pointerId); lastPinch = 0; };
  const onWheel = (event: WheelEvent) => { event.preventDefault(); zoomCamera(Math.exp(-event.deltaY * .001)); };
  const onVisibility = () => { lastFrame = performance.now(); if (!document.hidden) draw(0); };
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const onMotion = (event: MediaQueryListEvent) => { reduced = event.matches; draw(0); };
  const listen = (target: EventTarget, type: string, callback: EventListener, options?: AddEventListenerOptions) => {
    target.addEventListener(type, callback, options);
    disposers.push(() => target.removeEventListener(type, callback, options));
  };
  listen(canvas, 'pointerdown', onPointerDown as EventListener);
  listen(canvas, 'pointermove', onPointerMove as EventListener);
  listen(canvas, 'pointerup', onPointerUp as EventListener);
  listen(canvas, 'pointercancel', onPointerUp as EventListener);
  listen(canvas, 'wheel', onWheel as EventListener, { passive: false });
  listen(document, 'visibilitychange', onVisibility);
  listen(motionQuery, 'change', onMotion as EventListener);

  const applySettings = () => {
    const hour = ((settings.hour % 24) + 24) % 24;
    const daylight = clamp(Math.sin((hour - 5.5) / 13 * Math.PI), 0, 1);
    const twilight = daylight < .16;
    const stormy = settings.weather === 'storm';
    const wet = settings.weather === 'rain' || stormy || settings.disaster === 'flood' || settings.disaster === 'tsunami';
    const haze = settings.weather === 'fog';
    const hot = settings.weather === 'heat' || settings.climate === 'arid';
    const snowing = settings.weather === 'snow';
    const baseSky = daylight > .2 ? hot ? 0xc6a17e : stormy ? 0x687576 : settings.weather === 'cloudy' ? 0xa9a79c : haze ? 0xbdb5a8 : 0xb39a80 : 0x24303c;
    sky.set(baseSky);
    fog.color.copy(sky);
    fog.density = haze ? .027 : stormy ? .011 : hot ? .008 : .003;
    hemisphere.intensity = daylight > 0 ? 1.15 + daylight * (stormy ? .3 : .75) : .62;
    sun.intensity = (daylight > 0 ? .5 + daylight * 2.45 : .18) * (stormy ? .46 : settings.weather === 'cloudy' ? .72 : .98);
    sun.color.set(daylight > .3 ? 0xfff0d5 : daylight > 0 ? 0xffb97b : 0x9ab9d5);
    sun.position.set(Math.cos(hour / 24 * TAU) * 54, 18 + daylight * 62, Math.sin(hour / 24 * TAU) * 52);
    groundMat.color.set(snowing ? 0xdce3d0 : settings.climate === 'arid' ? 0xb6a66e : settings.season === 'winter' ? 0xbfc9ae : settings.season === 'autumn' ? 0xa0a05d : settings.climate === 'tropical' ? 0x73a55b : 0x89ad55);
    beachMat.color.set(snowing ? 0xe7e1d2 : settings.climate === 'tropical' ? 0xf0d7ad : settings.climate === 'arid' ? 0xd1b588 : 0xdcc99f);
    waterMat.color.set(stormy ? 0x456678 : daylight < .15 ? 0x285a68 : settings.climate === 'tropical' ? 0x50aaaa : 0x4b9697);
    waterMat.roughness = wet ? .18 : .31;
    glass.emissiveIntensity = twilight ? .74 : 0;
    batchMeshes.get('light')!.visible = twilight;
    cloudMat.color.set(stormy ? 0x657078 : settings.weather === 'cloudy' || wet ? 0xb6c0c1 : 0xf4f5ef);
    cloudMat.opacity = settings.weather === 'clear' ? .45 : .82;
    rain.visible = wet && settings.disaster !== 'tsunami';
    snow.visible = snowing || settings.season === 'winter' && settings.weather === 'cloudy';
    flood.visible = settings.disaster === 'flood';
    cracks.visible = debris.visible = settings.disaster === 'earthquake';
    wildfire.visible = settings.disaster === 'wildfire';
    tsunami.visible = settings.disaster === 'tsunami';
    tornado.visible = settings.disaster === 'tornado';
    lightning.visible = stormy;
    const foliageBatch = batches.get('foliage')!;
    const foliageMesh = batchMeshes.get('foliage')!;
    foliageBatch.items.forEach((item, index) => {
      const tint = settings.climate === 'arid' ? 0xa2a26d
        : settings.season === 'winter' ? 0xd5dec5
          : settings.season === 'autumn' ? [0xcaa64e, 0xdfba61, 0xa4853e][index % 3]
            : settings.season === 'spring' ? [0x8fc441, 0x9dbb58, 0x78aa3d][index % 3]
              : settings.climate === 'tropical' ? [0x5da143, 0x6eae4d, 0x548c3b][index % 3]
                : item.color.getHex();
      foliageMesh.setColorAt(index, color(tint));
    });
    if (foliageMesh.instanceColor) foliageMesh.instanceColor.needsUpdate = true;
  };

  const draw = (dt: number) => {
    if (destroyed || document.hidden) return;
    elapsed += settings.playing && !reduced ? dt : 0;
    const moving = settings.playing && !reduced;
    const disasterSpeed = settings.disaster === 'none' ? 1 : settings.disaster === 'earthquake' ? .42 : .15;
    const trafficSpeed = disasterSpeed * (settings.weather === 'storm' || settings.weather === 'snow' ? .55 : settings.weather === 'fog' ? .65 : 1);
    const night = settings.hour < 6 || settings.hour > 20;
    const pedestriansActive = settings.disaster === 'none' || settings.disaster === 'flood';
    const pedestrianSpeed = pedestriansActive ? settings.weather === 'storm' || settings.weather === 'snow' ? .5 : night ? .55 : 1 : .12;
    if (moving) {
      trafficProgress += dt * trafficSpeed;
      pedestrianProgress += dt * pedestrianSpeed;
    }
    for (let i = 0; i < carCount; i++) {
      const path = trafficRoutes[i % trafficRoutes.length];
      const p = routeAt(path, i * 31 + trafficProgress * (3.7 + i % 3 * .55));
      const lane = i % 2 ? -.62 : .62;
      const center = offset(p.x, p.z, lane, 0, p.angle);
      const bridgeLift = center.z < -26 && center.z > -36 ? .3 : 0;
      const cabin = offset(center.x, center.z, 0, -.12, p.angle);
      setPose(carBody, i, center.x, .56 + bridgeLift, center.z, 1.08, .38, 1.83, p.angle);
      setPose(carCabin, i, cabin.x, .86 + bridgeLift, cabin.z, .78, .37, .98, p.angle);
      for (let wheel = 0; wheel < 4; wheel++) {
        const point = offset(center.x, center.z, wheel % 2 ? .58 : -.58, wheel < 2 ? .55 : -.55, p.angle);
        setPose(carWheels, i * 4 + wheel, point.x, .4 + bridgeLift, point.z, .17, .33, .34, p.angle);
      }
      for (let headlight = 0; headlight < 2; headlight++) {
        const point = offset(center.x, center.z, headlight ? .35 : -.35, .96, p.angle);
        setPose(carLights, i * 2 + headlight, point.x, .61 + bridgeLift, point.z, .14, .09, .05, p.angle);
      }
    }
    carLights.visible = night || settings.weather === 'storm' || settings.weather === 'fog';
    for (let i = 0; i < motorcycleCount; i++) {
      const p = routeAt(trafficRoutes[(i + 1) % 3], i * 43 + 8 + trafficProgress * 5.2);
      const center = offset(p.x, p.z, i % 2 ? -.48 : .48, 0, p.angle);
      const bridgeLift = center.z < -26 && center.z > -36 ? .3 : 0;
      const rider = offset(center.x, center.z, 0, -.12, p.angle);
      setPose(motoBody, i, center.x, .52 + bridgeLift, center.z, .46, .24, 1.15, p.angle);
      setPose(motoRider, i, rider.x, 1.03 + bridgeLift, rider.z, .4, .78, .35, p.angle);
      for (let wheel = 0; wheel < 2; wheel++) {
        const point = offset(center.x, center.z, 0, wheel ? -.55 : .55, p.angle);
        setPose(motoWheels, i * 2 + wheel, point.x, .35 + bridgeLift, point.z, .28, .45, .17, p.angle);
      }
    }
    const visiblePeople = pedestriansActive ? night ? 7 : settings.weather === 'storm' ? 11 : personCount : 5;
    for (let i = 0; i < personCount; i++) {
      const p = routeAt(sidewalkRoutes[i % sidewalkRoutes.length], i * 6.4 + pedestrianProgress * .78);
      const sway = Math.sin(elapsed * 6 + i * 1.4) * .07;
      setPose(peopleBodies, i, p.x, 1.14 + sway, p.z, .35, .68, .24, p.angle);
      setPose(peopleHeads, i, p.x, 1.67 + sway, p.z, .23, .23, .23, p.angle);
      for (let leg = 0; leg < 2; leg++) {
        const point = offset(p.x, p.z, leg ? .11 : -.11, Math.sin(elapsed * 6 + i * 1.4 + leg * Math.PI) * .13, p.angle);
        setPose(peopleLegs, i * 2 + leg, point.x, .51, point.z, .12, .51, .14, p.angle);
      }
    }
    peopleBodies.count = peopleHeads.count = visiblePeople;
    peopleLegs.count = visiblePeople * 2;
    for (const mesh of [carBody, carCabin, carWheels, carLights, motoBody, motoRider, motoWheels, peopleBodies, peopleHeads, peopleLegs]) mesh.instanceMatrix.needsUpdate = true;
    const skyTime = elapsed;
    aircraft.position.set(-53 + ((skyTime * 2.8 + 27) % 110), 31, -30 + ((skyTime * 1.05 + 20) % 34));
    aircraft.rotation.y = Math.PI / 2.6;
    aircraft.visible = settings.weather !== 'storm' && settings.disaster !== 'tornado' && settings.disaster !== 'tsunami';
    for (let i = 0; i < 19; i++) {
      const x = -46 + i * 5.7 + elapsed * .18 % 10;
      setPose(clouds, i, x, 25 + i % 3 * 3, -22 + i % 5 * 15, 4 + i % 3, 1.2 + i % 2, 2.8 + i % 4, 0);
    }
    clouds.instanceMatrix.needsUpdate = true;
    clouds.visible = settings.weather !== 'clear' || settings.disaster === 'tornado';
    if (rain.visible) {
      for (let i = 0; i < 280; i++) {
        const x = -50 + (i * 17.13 % 102), z = -34 + (i * 11.71 % 68);
        const y = ((i * 3.71 - elapsed * 15) % 17 + 17) % 17;
        const j = i * 6;
        rainArray[j] = x; rainArray[j + 1] = y + 1; rainArray[j + 2] = z;
        rainArray[j + 3] = x + (settings.weather === 'storm' ? .65 : .16); rainArray[j + 4] = y + .32; rainArray[j + 5] = z;
      }
      rainShape.attributes.position.needsUpdate = true;
    }
    if (snow.visible) {
      for (let i = 0; i < 260; i++) {
        const j = i * 3;
        snowArray[j] = -50 + (i * 13.27 + elapsed * .7) % 102;
        snowArray[j + 1] = ((i * 4.13 - elapsed * 2.2) % 17 + 17) % 17 + .3;
        snowArray[j + 2] = -34 + (i * 19.43 % 68);
      }
      snowShape.attributes.position.needsUpdate = true;
    }
    lightning.visible = settings.weather === 'storm' && elapsed % 6.2 < .13;
    if (wildfire.visible) {
      smokeArray.forEach((_, i) => {
        if (i % 3 === 0) smokeArray[i] = -14 + (i * 7 % 29);
        if (i % 3 === 1) smokeArray[i] = 2 + ((i * 2.7 + elapsed * 2.7) % 19);
        if (i % 3 === 2) smokeArray[i] = 24 + (i * 11 % 10);
      });
      smokeShape.attributes.position.needsUpdate = true;
      wildfire.children.forEach((child, i) => { if (child !== smoke) child.scale.y = 2.3 + i % 4 * .55 + Math.sin(elapsed * 8 + i) * .3; });
    }
    if (tsunami.visible) tsunami.position.z = Math.sin(elapsed * .23) * 3;
    if (tornado.visible) {
      tornado.rotation.y = elapsed * .8;
      tornado.position.x = 8 + Math.sin(elapsed * .35) * 3;
    }
    const shake = settings.disaster === 'earthquake' && !reduced ? Math.sin(elapsed * 31) * .18 : 0;
    updateCamera(shake);
    renderer.render(scene, camera);
  };
  const frame = (now: number) => {
    if (destroyed) return;
    const delta = Math.min(.05, (now - lastFrame) / 1000);
    if (now - lastFrame >= 1000 / 40) {
      lastFrame = now;
      if (settings.playing && !reduced) draw(delta);
    }
    raf = requestAnimationFrame(frame);
  };
  resize();
  applySettings();
  draw(0);
  raf = requestAnimationFrame(frame);

  return {
    updateSettings(next: TownSettings) { settings = { ...next }; applySettings(); draw(0); },
    rotateCamera,
    zoomCamera,
    resetCamera() { azimuth = Math.PI / 4; elevation = .7; zoom = 1; updateProjection(); },
    getStats() { return { drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles }; },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      disposers.forEach(dispose => dispose());
      canvas.style.touchAction = priorTouchAction;
      geometry.forEach(item => item.dispose());
      materials.forEach(item => item.dispose());
      for (const mesh of batchMeshes.values()) mesh.dispose();
      for (const mesh of [carBody, carCabin, carWheels, carLights, motoBody, motoRider, motoWheels, peopleBodies, peopleHeads, peopleLegs, clouds]) mesh.dispose();
      renderer.dispose();
      scene.clear();
    },
  };
}
