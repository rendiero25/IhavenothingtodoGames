import * as T from 'three';
import { buildScenery, type SceneTools } from './scenery';
import { createEffects } from './effects';
import { createVehicles } from './vehicles';
import { createImpacts, damageAt, structural } from './impacts';
import { createSimulation, stepSimulation, eventStrength, eventPhase, type EventPhase, type TownSettings } from './simulation';
import { LANDMARKS, SIDEWALKS, WORLD, cameraTravel, clamp, riverX, routeAt, shelterAt, trafficAt, type Landmark } from './world';
export type { TownSettings } from './simulation';

type Instance = { position: T.Vector3; scale: T.Vector3; color: T.Color; rotation: number };
type Batch = { geometry: T.BufferGeometry; material: T.Material; items: Instance[] };
export type TravelKey = 'w' | 'a' | 's' | 'd';
const TAU = Math.PI * 2;

export function createTownScene(canvas: HTMLCanvasElement, initial: TownSettings, onEventPhase?: (phase: EventPhase) => void) {
  const scene = new T.Scene();
  const camera = new T.OrthographicCamera(-85, 85, 58, -58, .1, 520);
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  const geometries: T.BufferGeometry[] = [];
  const materials: T.Material[] = [];
  const disposers: Array<() => void> = [];
  const trackGeometry = <G extends T.BufferGeometry>(shape: G): G => { geometries.push(shape); return shape; };
  const trackMaterial = <M extends T.Material>(mat: M): M => { materials.push(mat); return mat; };
  const box = trackGeometry(new T.BoxGeometry(1, 1, 1));
  const sphere = trackGeometry(new T.SphereGeometry(1, 8, 6));
  const foliageShape = trackGeometry(new T.IcosahedronGeometry(1, 1));
  const material = (options: T.MeshStandardMaterialParameters) => trackMaterial(new T.MeshStandardMaterial(options));
  const solid = material({ color: 0xffffff, roughness: .85 });
  const roofMat = material({ color: 0xffffff, roughness: .75 });
  const glass = material({ color: 0xffffff, roughness: .24, metalness: .2, emissive: 0xffce8a, emissiveIntensity: 0 });
  const foliage = material({ color: 0xffffff, roughness: 1, flatShading: true });
  const warmLight = trackMaterial(new T.MeshBasicMaterial({ color: 0xffdba2 }));
  const batches = new Map<string, Batch>();
  const batchMeshes = new Map<string, T.InstancedMesh>();
  const add = (key: string, shape: T.BufferGeometry, mat: T.Material, x: number, y: number, z: number, sx: number, sy: number, sz: number, tint: number, rotation = 0) => {
    let batch = batches.get(key);
    if (!batch) { batch = { geometry: shape, material: mat, items: [] }; batches.set(key, batch); }
    batch.items.push({ position: new T.Vector3(x, y, z), scale: new T.Vector3(sx, sy, sz), color: new T.Color(tint), rotation });
  };
  const block = (x: number, y: number, z: number, w: number, h: number, d: number, tint: number, key = 'solid', rotation = 0) =>
    add(key, box, key === 'glass' ? glass : key === 'roof' ? roofMat : key === 'light' ? warmLight : solid, x, y, z, w, h, d, tint, rotation);
  const leaf = (x: number, y: number, z: number, w: number, h: number, d: number, tint: number) =>
    add('foliage', foliageShape, foliage, x, y, z, w, h, d, tint);
  const tools: SceneTools = { scene, box, sphere, material, trackGeometry, trackMaterial };
  const scenery = buildScenery(tools, block, leaf);
  const dummy = new T.Object3D();
  for (const [key, batch] of batches) {
    const mesh = new T.InstancedMesh(batch.geometry, batch.material, batch.items.length);
    batch.items.forEach((item, i) => {
      dummy.position.copy(item.position); dummy.rotation.set(0, item.rotation, 0); dummy.scale.copy(item.scale); dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix); mesh.setColorAt(i, item.color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = key !== 'glass' && key !== 'light'; mesh.receiveShadow = key !== 'foliage';
    mesh.frustumCulled = false; scene.add(mesh); batchMeshes.set(key, mesh);
  }
  const hemisphere = new T.HemisphereLight(0xf1ebdb, 0x4e5649, 1.85); scene.add(hemisphere);
  const sun = new T.DirectionalLight(0xffebcf, 2.6); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -140;
  sun.shadow.camera.right = sun.shadow.camera.top = 140;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 340; sun.shadow.bias = -.0004;
  scene.add(sun, sun.target);
  const sky = new T.Color(0xb9c9c7); scene.background = sky;
  const fog = new T.FogExp2(0xb9c9c7, .0018); scene.fog = fog;
  const effects = createEffects(tools, scenery.roofs, scenery.trees);
  const vehicles = createVehicles(tools);
  const impacts = createImpacts(tools, scenery.roofs, scenery.trees);
  let impactRevision = -1;

  const actors: T.InstancedMesh[] = [];
  const actorMat = material({ color: 0xffffff, roughness: .6, metalness: .08 });
  const rubberMat = material({ color: 0x293330, roughness: 1 });
  const skinMat = material({ color: 0xffffff, roughness: 1 });
  const dynamic = (shape: T.BufferGeometry, mat: T.Material, count: number) => {
    const mesh = new T.InstancedMesh(shape, mat, count);
    mesh.instanceMatrix.setUsage(T.DynamicDrawUsage); mesh.frustumCulled = false;
    scene.add(mesh); actors.push(mesh); return mesh;
  };
  const carCount = 38, personCount = 110;
  const peopleBodies = dynamic(box, actorMat, personCount), peopleHeads = dynamic(sphere, skinMat, personCount);
  const peopleLegs = dynamic(box, rubberMat, personCount * 2), peopleArms = dynamic(box, skinMat, personCount * 2);
  const umbrellaShape = trackGeometry(new T.ConeGeometry(.85, .35, 12));
  const umbrellas = dynamic(umbrellaShape, actorMat, personCount);
  const umbrellaStems = dynamic(box, rubberMat, personCount);
  const paint = [0xb8634d, 0xdddacb, 0x597b7d, 0xb7a368, 0x63788c, 0x8c8e7d, 0x809570];
  for (let i = 0; i < personCount; i++) {
    peopleBodies.setColorAt(i, new T.Color([0x526d7b, 0x9d775a, 0xc19f6b, 0x74937a, 0xb38a80, 0x53595e][i % 6]));
    const skin = new T.Color([0xc69b7b, 0xe5c2a1, 0x926b51, 0xb88361][i % 4]);
    peopleHeads.setColorAt(i, skin); peopleArms.setColorAt(i * 2, skin); peopleArms.setColorAt(i * 2 + 1, skin);
    umbrellas.setColorAt(i, new T.Color(paint[i % paint.length]));
  }

  const pose = (mesh: T.InstancedMesh, i: number, x: number, y: number, z: number, w: number, h: number, d: number, rotation = 0) => {
    dummy.position.set(x, y, z); dummy.rotation.set(0, rotation, 0); dummy.scale.set(w, h, d); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
  };
  const offset = (x: number, z: number, side: number, front: number, rotation: number) => ({
    x: x + side * Math.cos(rotation) + front * Math.sin(rotation), z: z - side * Math.sin(rotation) + front * Math.cos(rotation),
  });
  const birds = dynamic(trackGeometry(new T.ConeGeometry(1, 1, 3)), material({ color: 0x555c55, roughness: 1 }), 12);

  let settings = { ...initial }, state = createSimulation();
  let lastEventPhase: EventPhase | undefined;
  let evacuationStart = state.pedestrians;
  let destroyed = false, contextLost = false, raf = 0, lastFrame = performance.now();
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = motionQuery.matches;
  let azimuth = .55, elevation = .74, zoom = 1, lastDiagnostic = -1;
  const focus = new T.Vector3(0, 3, WORLD.centerZ);
  const keys = new Set<TravelKey>();
  const buttonKeys = new Set<TravelKey>();
  const pointers = new Map<number, { x: number; y: number; pan: boolean }>();
  const updateCamera = (shake = 0) => {
    const r = 210;
    camera.position.set(focus.x + Math.sin(azimuth) * Math.cos(elevation) * r + shake,
      focus.y + Math.sin(elevation) * r, focus.z + Math.cos(azimuth) * Math.cos(elevation) * r);
    camera.lookAt(focus);
  };
  const updateProjection = () => {
    const aspect = Math.max(1, canvas.clientWidth) / Math.max(1, canvas.clientHeight);
    const span = Math.max(168, 250 / aspect) / zoom;
    camera.top = span / 2; camera.bottom = -camera.top; camera.right = camera.top * aspect; camera.left = -camera.right;
    camera.updateProjectionMatrix(); updateCamera();
  };
  const resize = () => {
    const w = Math.max(1, canvas.clientWidth), h = Math.max(1, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(2_000_000 / (w * h))));
    renderer.setSize(w, h, false); updateProjection(); draw(0);
  };
  const rotateCamera = (horizontal: number, vertical: number) => {
    azimuth = ((azimuth + horizontal) % TAU + TAU) % TAU;
    elevation = clamp(elevation + vertical, .22, 1.35); updateCamera(); draw(0);
  };
  const zoomCamera = (factor: number) => { zoom = clamp(zoom * factor, .55, 6); updateProjection(); draw(0); };
  const moveCamera = (forward: number, right: number, distance = 4, redraw = true) => {
    const travel = cameraTravel(azimuth, forward, right, distance);
    focus.x = clamp(focus.x + travel.x, WORLD.minX, WORLD.maxX);
    focus.z = clamp(focus.z + travel.z, WORLD.minZ, WORLD.maxZ);
    if (redraw) { updateCamera(); draw(0); }
  };
  const panCamera = (dx: number, dy: number) => {
    const horizontal = (camera.right - camera.left) / Math.max(1, canvas.clientWidth);
    const vertical = (camera.top - camera.bottom) / Math.max(1, canvas.clientHeight) / Math.sin(elevation);
    // Pan uses pixel distances directly, without the normalized keyboard diagonal.
    focus.x = clamp(focus.x - dx * horizontal * Math.cos(azimuth) - dy * vertical * Math.sin(azimuth), WORLD.minX, WORLD.maxX);
    focus.z = clamp(focus.z + dx * horizontal * Math.sin(azimuth) - dy * vertical * Math.cos(azimuth), WORLD.minZ, WORLD.maxZ);
  };
  const priorTouchAction = canvas.style.touchAction;
  canvas.style.touchAction = 'none';
  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === 'mouse' && event.button !== 0 && event.button !== 2) return;
    canvas.focus({ preventScroll: true }); canvas.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, pan: event.button === 2 || event.shiftKey });
  };
  const onPointerMove = (event: PointerEvent) => {
    const previous = pointers.get(event.pointerId); if (!previous) return;
    if (pointers.size === 2) {
      const before = [...pointers.values()];
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, pan: previous.pan });
      const after = [...pointers.values()];
      const oldDistance = Math.hypot(before[0].x - before[1].x, before[0].y - before[1].y);
      const newDistance = Math.hypot(after[0].x - after[1].x, after[0].y - after[1].y);
      panCamera((after[0].x + after[1].x - before[0].x - before[1].x) / 2, (after[0].y + after[1].y - before[0].y - before[1].y) / 2);
      zoomCamera(oldDistance > 0 ? newDistance / oldDistance : 1);
    } else {
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, pan: previous.pan });
      if (previous.pan || event.shiftKey) { panCamera(event.clientX - previous.x, event.clientY - previous.y); updateCamera(); draw(0); }
      else rotateCamera(-(event.clientX - previous.x) * .006, (event.clientY - previous.y) * .004);
    }
  };
  const onPointerUp = (event: PointerEvent) => {
    pointers.delete(event.pointerId);
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  };
  const clearInput = () => {
    keys.clear(); buttonKeys.clear();
    for (const id of pointers.keys()) if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
    pointers.clear();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (target?.closest('input,select,textarea,[contenteditable="true"]')) return;
    const key = event.key.toLowerCase();
    if (['w', 'a', 's', 'd'].includes(key)) { event.preventDefault(); keys.add(key as TravelKey); }
  };
  const onKeyUp = (event: KeyboardEvent) => { keys.delete(event.key.toLowerCase() as TravelKey); };
  const listen = (target: EventTarget, type: string, callback: EventListener, options?: AddEventListenerOptions) => {
    target.addEventListener(type, callback, options); disposers.push(() => target.removeEventListener(type, callback, options));
  };
  listen(canvas, 'pointerdown', onPointerDown as EventListener);
  listen(canvas, 'pointermove', onPointerMove as EventListener);
  listen(canvas, 'pointerup', onPointerUp as EventListener);
  listen(canvas, 'pointercancel', onPointerUp as EventListener);
  listen(canvas, 'lostpointercapture', (event) => pointers.delete((event as PointerEvent).pointerId));
  listen(canvas, 'contextmenu', (event) => event.preventDefault());
  listen(canvas, 'wheel', ((event: WheelEvent) => { event.preventDefault(); zoomCamera(Math.exp(-event.deltaY * .001)); }) as EventListener, { passive: false });
  listen(window, 'keydown', onKeyDown as EventListener); listen(window, 'keyup', onKeyUp as EventListener);
  listen(window, 'blur', clearInput);
  listen(document, 'visibilitychange', () => { lastFrame = performance.now(); clearInput(); if (!document.hidden) draw(0); });
  listen(motionQuery, 'change', ((event: MediaQueryListEvent) => { reduced = event.matches; draw(0); }) as EventListener);
  listen(canvas, 'webglcontextlost', (event) => { event.preventDefault(); contextLost = true; clearInput(); });
  listen(canvas, 'webglcontextrestored', () => { contextLost = false; lastFrame = performance.now(); resize(); });
  const observer = new ResizeObserver(resize); observer.observe(canvas);

  let baseSun = 2.5, baseAmbient = 1.8;
  const applySettings = () => {
    impactRevision = -1;
    renderer.shadowMap.needsUpdate = true;
    const hour = ((settings.hour % 24) + 24) % 24;
    const daylight = clamp(Math.sin((hour - 5.5) / 13 * Math.PI), 0, 1);
    const stormy = settings.weather === 'storm' || settings.weather === 'lightning'
      || eventStrength(settings.disaster, state.eventAge) > .04 && (settings.disaster === 'tornado' || settings.disaster === 'hailstorm');
    const winter = settings.season === 'winter' && settings.climate !== 'tropical';
    const snowing = ['snow', 'blizzard'].includes(settings.weather);
    const drought = settings.disaster === 'drought';
    sky.set(daylight > .15 ? stormy ? 0x7f8b94 : settings.weather === 'fog' ? 0xb8c0ba : settings.weather === 'heat' ? 0xc9bb9d : 0xbbcec9 : 0x202f40);
    fog.color.copy(sky); fog.density = settings.weather === 'fog' ? .015 : stormy || settings.weather === 'blizzard' ? .005 : .0018;
    baseAmbient = daylight > 0 ? 1 + daylight * (stormy ? .4 : .9) : .54;
    baseSun = (daylight > 0 ? .5 + daylight * 2.4 : .17) * (stormy ? .42 : settings.weather === 'cloudy' ? .65 : 1);
    sun.color.set(daylight > .3 ? 0xfff0da : daylight > 0 ? 0xffbf8c : 0x9fbede);
    sun.position.set(Math.cos(hour / 24 * TAU) * 100, 35 + daylight * 125, Math.sin(hour / 24 * TAU) * 100);
    sun.target.position.set(0, 0, WORLD.centerZ);
    scenery.groundMat.color.set(drought ? 0xb7a174 : snowing ? 0xcbd4ce : settings.climate === 'arid' ? 0xb5a475 : winter ? 0xa8b8a0 : settings.season === 'autumn' ? 0xaaa169 : 0x82a55c);
    scenery.beachMat.color.set(winter || snowing ? 0xd9d9c8 : 0xe2cfaa);
    scenery.waterMat.color.set(stormy ? 0x476b7a : daylight < .15 ? 0x305669 : 0x4d9eac);
    scenery.waterMat.roughness = stormy ? .43 : .26;
    const riverPositions = scenery.river.geometry.attributes.position as T.BufferAttribute;
    for (let i = 0; i < riverPositions.count; i++) {
      const z = riverPositions.getZ(i);
      riverPositions.setX(i, riverX(z) + (i % 2 ? 1 : -1) * 3.75);
    }
    riverPositions.needsUpdate = true;
    glass.emissiveIntensity = daylight < .17 ? .7 : 0;
    batchMeshes.get('light')!.visible = daylight < .17;
    const foliageBatch = batches.get('foliage')!, foliageMesh = batchMeshes.get('foliage')!;
    foliageBatch.items.forEach((item, i) => {
      const winterBare = winter && settings.weather !== 'snow' ? .34 : 1;
      dummy.position.copy(item.position); dummy.rotation.set(0, item.rotation, 0); dummy.scale.copy(item.scale).multiplyScalar(winterBare); dummy.updateMatrix(); foliageMesh.setMatrixAt(i, dummy.matrix);
      const tint = drought || settings.climate === 'arid' ? 0xa29660 : snowing ? 0xc9d6c4
        : settings.season === 'autumn' ? [0xbd9b4a, 0xcfaa55, 0x9c843f][i % 3]
          : settings.season === 'spring' ? [0x91b764, 0xa1c16d, 0x75a458][i % 3] : item.color.getHex();
      foliageMesh.setColorAt(i, new T.Color(tint));
    });
    foliageMesh.instanceMatrix.needsUpdate = true;
    if (foliageMesh.instanceColor) foliageMesh.instanceColor.needsUpdate = true;
  };

  const getStats = () => ({ drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles,
    elapsed: state.elapsed, eventAge: state.eventAge, traffic: state.traffic, pedestrians: state.pedestrians,
    snowCover: state.snowCover, clockPlaying: settings.playing, azimuth, elevation, zoom,
    focus: { x: focus.x, z: focus.z }, people: peopleBodies.count, cars: carCount,
    firstCar: trafficAt(0, state.traffic, 4.5), width: WORLD.width, depth: WORLD.depth,
    ...vehicles.stats(state.elapsed),
    ...impacts.stats(),
    eventPhase: eventPhase(settings.disaster, state.eventAge),
    weather: settings.weather, disaster: settings.disaster, season: settings.season,
    lightning: scene.getObjectByName('branched-lightning')?.visible,
    opaqueClouds: !((scene.getObjectByName('opaque-cumulus') as T.Mesh).material as T.Material).transparent,
  });
  const draw = (delta: number) => {
    if (destroyed || document.hidden || contextLost) return;
    if (!reduced) stepSimulation(state, settings, delta);
    const held = (key: TravelKey) => keys.has(key) || buttonKeys.has(key) ? 1 : 0;
    if (keys.size || buttonKeys.size) moveCamera(held('w') - held('s'), held('d') - held('a'), delta * 35 / Math.sqrt(zoom), false);
    const t = state.elapsed;
    const night = settings.hour < 6 || settings.hour >= 21;
    const wet = ['rain', 'storm'].includes(settings.weather);
    const emergency = eventStrength(settings.disaster, state.eventAge) > .05;
    vehicles.update(t, state.traffic, emergency, ['rain', 'storm'].includes(settings.weather)
      || emergency && ['tsunami', 'tornado'].includes(settings.disaster),
      ['storm', 'blizzard'].includes(settings.weather) || emergency, reduced);
    for (let i = 0; i < personCount; i++) {
      const path = SIDEWALKS[i % SIDEWALKS.length];
      const pace = .7 + i % 3 * .11;
      const p = emergency
        ? shelterAt(path, i * 7.4 + evacuationStart * pace, (state.pedestrians - evacuationStart) * pace)
        : routeAt(path, i * 7.4 + state.pedestrians * pace);
      const walk = Math.sin(t * 7 + i * 1.3), stride = reduced ? 0 : walk * .15;
      const bob = reduced ? 0 : Math.abs(walk) * .035;
      const y = .12;
      pose(peopleBodies, i, p.x, 1.18 + bob + y, p.z, .36, .66, .26, p.angle);
      pose(peopleHeads, i, p.x, 1.67 + bob + y, p.z, .24, .24, .24, p.angle);
      for (let leg = 0; leg < 2; leg++) {
        const point = offset(p.x, p.z, leg ? .11 : -.11, leg ? stride : -stride, p.angle);
        pose(peopleLegs, i * 2 + leg, point.x, .56 + y, point.z, .13, .52, .16, p.angle);
        const arm = offset(p.x, p.z, leg ? .25 : -.25, leg ? -stride * .7 : stride * .7, p.angle);
        pose(peopleArms, i * 2 + leg, arm.x, 1.19 + y, arm.z, .12, .46, .13, p.angle);
      }
      pose(umbrellas, i, p.x, 2.26, p.z, 1, 1, 1, p.angle);
      pose(umbrellaStems, i, p.x, 1.85, p.z, .035, .8, .035, p.angle);
    }
    const visiblePeople = night ? 62 : settings.weather === 'blizzard' ? 70 : wet ? 80 : personCount;
    peopleBodies.count = peopleHeads.count = umbrellas.count = umbrellaStems.count = visiblePeople;
    peopleLegs.count = peopleArms.count = visiblePeople * 2; umbrellas.visible = umbrellaStems.visible = wet;
    birds.visible = !wet && !emergency;
    for (let i = 0; i < 12; i++) {
      const angle = t * .16 + i * .5;
      pose(birds, i, Math.sin(angle) * (11 + i), 14 + i % 3, 28 + Math.cos(angle) * (8 + i), .6, .1, .3, -angle);
    }
    actors.forEach(mesh => { mesh.instanceMatrix.needsUpdate = true; });
    const revision = impacts.update(settings.disaster, state.eventAge);
    const result = effects.update(settings, state, reduced, impacts.history);
    const phase = eventPhase(settings.disaster, state.eventAge);
    if (phase !== lastEventPhase) {
      if (lastEventPhase !== undefined) applySettings();
      lastEventPhase = phase; onEventPhase?.(phase);
    }
    hemisphere.intensity = baseAmbient + result.flash; sun.intensity = baseSun + result.flash * 1.5;
    if (impacts.history.drought) {
      const dryness = impacts.history.drought;
      const positions = scenery.river.geometry.attributes.position as T.BufferAttribute;
      for (let i = 0; i < positions.count; i++) {
        const z = positions.getZ(i);
        positions.setX(i, riverX(z) + (i % 2 ? 1 : -1) * (3.75 - dryness * 2.4));
      }
      positions.needsUpdate = true;
      scenery.groundMat.color.set(0x82a55c).lerp(new T.Color(0xb7a174), dryness);
    }
    if (revision !== impactRevision) {
      const winter = settings.season === 'winter' && settings.climate !== 'tropical';
      const snowing = ['snow', 'blizzard'].includes(settings.weather);
      for (const key of ['solid', 'glass', 'roof', 'foliage']) {
        const batch = batches.get(key)!, mesh = batchMeshes.get(key)!;
        batch.items.forEach((item, i) => {
          const impact = damageAt(impacts.history, item.position.x, item.position.z);
          const tint = key !== 'foliage' ? item.color.getHex()
            : settings.climate === 'arid' ? 0xa29660 : snowing ? 0xc9d6c4
              : settings.season === 'autumn' ? [0xbd9b4a, 0xcfaa55, 0x9c843f][i % 3]
                : settings.season === 'spring' ? [0x91b764, 0xa1c16d, 0x75a458][i % 3] : item.color.getHex();
          const color = new T.Color(tint);
          const affected = key === 'foliage' && ['wildfire', 'drought', 'flood', 'tsunami', 'tornado', 'landslide'].includes(impact.kind ?? '')
            || item.position.y > .4 && item.position.y < 2 && ['flood', 'tsunami'].includes(impact.kind ?? '')
            || item.position.y > 2 && structural(impact.kind);
          if (affected) color.lerp(new T.Color(key === 'glass' ? 0x344443 : impact.kind === 'wildfire' ? 0x443d31 : 0x8e7a55), impact.strength * .65);
          mesh.setColorAt(i, color);
          if (key === 'foliage') {
            dummy.position.copy(item.position); dummy.rotation.set(0, item.rotation, 0);
            const fallen = impact.strength > .6 && ['tornado', 'tsunami', 'wildfire', 'landslide'].includes(impact.kind ?? '');
            dummy.scale.copy(item.scale).multiplyScalar(fallen ? .06 : winter && !snowing ? .34 : 1);
            dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
          } else {
            dummy.position.copy(item.position); dummy.rotation.set(0, item.rotation, 0); dummy.scale.copy(item.scale);
            if (key === 'roof' && item.scale.y < .7 && impact.strength > .2 && ['tornado', 'tsunami'].includes(impact.kind ?? '')) {
              dummy.position.y -= Math.min(.25, item.position.y * .1) * impact.strength;
              dummy.rotation.z = impact.strength * .14;
            }
            dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
          }
        });
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        mesh.instanceMatrix.needsUpdate = true;
      }
      renderer.shadowMap.needsUpdate = true;
      impactRevision = revision;
    }
    if (settings.disaster === 'earthquake') for (const key of ['solid', 'glass', 'roof']) {
      const batch = batches.get(key)!, mesh = batchMeshes.get(key)!;
      batch.items.forEach((item, i) => {
        dummy.position.copy(item.position);
        const shake = item.position.y > 2 && !reduced ? Math.sin(t * 28 + item.position.x * .2) * .045 * result.strength * item.position.y : 0;
        dummy.position.x += shake; dummy.rotation.set(0, item.rotation, 0); dummy.scale.copy(item.scale); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    }
    const shake = settings.disaster === 'earthquake' && !reduced ? Math.sin(t * 31) * .13 * result.strength : 0;
    updateCamera(shake); renderer.render(scene, camera);
    if (import.meta.env.DEV && (delta === 0 || state.elapsed - lastDiagnostic > .5)) {
      canvas.dataset.townStats = JSON.stringify(getStats()); lastDiagnostic = state.elapsed;
    }
  };
  const frame = (now: number) => {
    if (destroyed) return;
    if (now - lastFrame >= 1000 / 40) {
      const delta = Math.min(.1, (now - lastFrame) / 1000); lastFrame = now; draw(delta);
    }
    raf = requestAnimationFrame(frame);
  };
  applySettings(); resize(); raf = requestAnimationFrame(frame);
  return {
    updateSettings(next: TownSettings) {
      if (next.disaster !== settings.disaster) {
        state.eventAge = 0;
        evacuationStart = state.pedestrians;
        if (settings.disaster === 'earthquake') {
          for (const key of ['solid', 'glass', 'roof']) {
            const batch = batches.get(key)!, mesh = batchMeshes.get(key)!;
            batch.items.forEach((item, i) => {
              dummy.position.copy(item.position); dummy.scale.copy(item.scale); dummy.rotation.set(0, item.rotation, 0); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
            }); mesh.instanceMatrix.needsUpdate = true;
          }
        }
      }
      settings = { ...next, speed: clamp(next.speed, .25, 3) }; applySettings(); draw(0);
    },
    repairCity() { settings.disaster = 'none'; state.eventAge = 0; impacts.repair(); applySettings(); draw(0); },
    rotateCamera, zoomCamera, moveCamera,
    seekEvent(age: number) { state.eventAge = clamp(age, 0, 180); draw(0); },
    setTravelKey(key: TravelKey, pressed: boolean) { if (pressed) buttonKeys.add(key); else buttonKeys.delete(key); },
    focusLandmark(name: Landmark) { const p = LANDMARKS[name]; focus.set(p[0], 3, p[1]); zoom = 2.5; updateProjection(); draw(0); },
    resetCamera() { clearInput(); azimuth = .55; elevation = .74; zoom = 1; focus.set(0, 3, WORLD.centerZ); updateProjection(); draw(0); },
    getStats,
    destroy() {
      if (destroyed) return;
      destroyed = true; cancelAnimationFrame(raf); observer.disconnect(); disposers.forEach(dispose => dispose());
      for (const id of pointers.keys()) if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
      clearInput(); canvas.style.touchAction = priorTouchAction; delete canvas.dataset.townStats;
      effects.dispose(); vehicles.dispose(); impacts.dispose(); for (const mesh of batchMeshes.values()) mesh.dispose(); actors.forEach(mesh => mesh.dispose());
      geometries.forEach(item => item.dispose()); materials.forEach(item => item.dispose());
      sun.shadow.dispose(); renderer.dispose(); scene.clear();
    },
  };
}
