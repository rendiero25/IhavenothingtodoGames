import * as THREE from 'three';
import type { EnemySpawn, FpsState } from './config';
import { touchLayout, type TouchRect } from './input';

export interface ArenaScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  enemyRoot: THREE.Group;
  projectileRoot: THREE.Group;
  arenaColliders: readonly THREE.Box3[];
  spawnPlayer: THREE.Vector3;
  setQuality(quality: RenderQuality): void;
  updateHud(state: FpsState, wave: number): void;
  triggerMuzzleFlash(nowMs: number, durationMs: number): void;
  updateEffects(nowMs: number): void;
  render(): void;
  resize(width: number, height: number, pixelRatio: number): void;
  dispose(): void;
}

const ARENA_HALF_WIDTH = 25;
const ARENA_HALF_DEPTH = 34;
const WALL_HEIGHT = 8;

export interface RenderQuality {
  lowPower: boolean;
  maxPixelRatio: 1.5 | 2;
}

export function selectRenderQuality(
  hardwareConcurrency: number,
  devicePixelRatio: number,
  mobile: boolean,
): RenderQuality {
  return {
    lowPower: hardwareConcurrency <= 4 || devicePixelRatio > 2,
    maxPixelRatio: mobile ? 1.5 : 2,
  };
}

export interface MotionProfile {
  shake: 0 | 1;
  recoil: 0.25 | 1;
  muzzleFlashMs: 35 | 90;
}

export function selectMotionProfile(reducedMotion: boolean): MotionProfile {
  return reducedMotion
    ? { shake: 0, recoil: 0.25, muzzleFlashMs: 35 }
    : { shake: 1, recoil: 1, muzzleFlashMs: 90 };
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function colliderFor(mesh: THREE.Mesh): THREE.Box3 {
  mesh.updateWorldMatrix(true, false);
  return new THREE.Box3().setFromObject(mesh);
}

function disposeMaterial(material: THREE.Material, disposed: Set<unknown>): void {
  if (disposed.has(material)) return;
  disposed.add(material);
  material.dispose();
}

/** Disposes a generated object tree while tolerating shared geometries and materials. */
export function disposeObject(root: THREE.Object3D): void {
  const disposed = new Set<unknown>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    if (!disposed.has(object.geometry)) {
      disposed.add(object.geometry);
      object.geometry.dispose();
    }
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) disposeMaterial(material, disposed);
  });
  root.clear();
}

/** Builds a low-poly enemy visual from one deterministic gameplay spawn. */
export function createEnemyObject(spawn: EnemySpawn): THREE.Group {
  const root = new THREE.Group();
  root.name = `enemy-${spawn.id}`;
  root.position.set(spawn.x, 0, spawn.z);
  root.rotation.y = spawn.yaw;
  root.userData = { spawnId: spawn.id, kind: spawn.kind, boss: spawn.boss };

  const scale = spawn.boss ? 1.45 : 1;
  const bodyGeometry = new THREE.BoxGeometry(1.1 * scale, 1.4 * scale, 0.75 * scale);
  const headGeometry = new THREE.BoxGeometry(0.72 * scale, 0.62 * scale, 0.66 * scale);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: spawn.boss ? 0xe06666 : 0xf28c5b,
    flatShading: true,
    roughness: 0.8,
  });
  const headMaterial = new THREE.MeshStandardMaterial({ color: 0xf4d6a4, flatShading: true, roughness: 0.9 });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.7 * scale;
  body.castShadow = true;
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.y = 1.68 * scale;
  head.castShadow = true;
  root.add(body, head);
  return root;
}

/** Creates the texture-free industrial arena used by the FPS runtime. */
export function createArenaScene(renderer: THREE.WebGLRenderer, seed: number): ArenaScene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x10161c);
  scene.fog = new THREE.Fog(0x10161c, 22, 78);

  const spawnPlayer = new THREE.Vector3(0, 1.7, 14);
  const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 120);
  camera.position.copy(spawnPlayer);

  const enemyRoot = new THREE.Group();
  enemyRoot.name = 'enemies';
  const projectileRoot = new THREE.Group();
  projectileRoot.name = 'projectiles';
  scene.add(enemyRoot, projectileRoot);

  const ambient = new THREE.HemisphereLight(0xc8def0, 0x1b2024, 1.7);
  const directional = new THREE.DirectionalLight(0xffe1bc, 2.2);
  directional.position.set(-12, 20, 8);
  directional.castShadow = true;
  directional.shadow.mapSize.set(1024, 1024);
  scene.add(ambient, directional);

  const floorGeometry = new THREE.PlaneGeometry(ARENA_HALF_WIDTH * 2, ARENA_HALF_DEPTH * 2, 1, 1);
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x343d42, roughness: 0.94, metalness: 0.15 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.name = 'arena-floor';
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const wallGeometry = new THREE.BoxGeometry(1, 1, 1);
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x49555a, roughness: 0.75, metalness: 0.35 });
  const wallSpecs = [
    { x: 0, z: -ARENA_HALF_DEPTH, sx: ARENA_HALF_WIDTH * 2 + 2, sz: 1 },
    { x: 0, z: ARENA_HALF_DEPTH, sx: ARENA_HALF_WIDTH * 2 + 2, sz: 1 },
    { x: -ARENA_HALF_WIDTH, z: 0, sx: 1, sz: ARENA_HALF_DEPTH * 2 },
    { x: ARENA_HALF_WIDTH, z: 0, sx: 1, sz: ARENA_HALF_DEPTH * 2 },
  ];
  const arenaColliders: THREE.Box3[] = [];
  for (const [index, spec] of wallSpecs.entries()) {
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.name = `arena-wall-${index}`;
    wall.position.set(spec.x, WALL_HEIGHT / 2, spec.z);
    wall.scale.set(spec.sx, WALL_HEIGHT, spec.sz);
    wall.receiveShadow = true;
    scene.add(wall);
    arenaColliders.push(colliderFor(wall));
  }

  const rand = seededRandom(seed);
  const containerGeometry = new THREE.BoxGeometry(1, 1, 1);
  const containerMaterials = [
    new THREE.MeshStandardMaterial({ color: 0x3d7288, roughness: 0.72, metalness: 0.45 }),
    new THREE.MeshStandardMaterial({ color: 0xba6845, roughness: 0.72, metalness: 0.35 }),
    new THREE.MeshStandardMaterial({ color: 0x747b4d, roughness: 0.72, metalness: 0.4 }),
  ];
  const containerCount = 8 + Math.floor(rand() * 7);
  for (let index = 0; index < containerCount; index += 1) {
    const container = new THREE.Mesh(containerGeometry, containerMaterials[Math.floor(rand() * containerMaterials.length)]);
    container.name = `arena-container-${index}`;
    const x = (rand() - 0.5) * 40;
    const z = (rand() - 0.5) * 52;
    const length = 3.2 + rand() * 2.8;
    container.position.set(x, 1.45, z);
    container.scale.set(length, 2.9, 2.35);
    container.rotation.y = rand() > 0.5 ? 0 : Math.PI / 2;
    container.castShadow = true;
    container.receiveShadow = true;
    scene.add(container);
    arenaColliders.push(colliderFor(container));
  }

  const hud = createHud(renderer.domElement);
  let disposed = false;
  let quality: RenderQuality = { lowPower: false, maxPixelRatio: 2 };
  let muzzleFlashUntil = 0;
  return {
    scene,
    camera,
    enemyRoot,
    projectileRoot,
    arenaColliders,
    spawnPlayer,
    setQuality(nextQuality: RenderQuality): void {
      quality = nextQuality;
      directional.castShadow = !quality.lowPower;
      renderer.shadowMap.enabled = !quality.lowPower;
      scene.fog = new THREE.Fog(0x10161c, quality.lowPower ? 16 : 22, quality.lowPower ? 52 : 78);
    },
    updateHud(state: FpsState, wave: number): void {
      hud?.update(state, wave);
    },
    triggerMuzzleFlash(nowMs: number, durationMs: number): void {
      muzzleFlashUntil = nowMs + durationMs;
      if (hud) hud.flash.visible = true;
    },
    updateEffects(nowMs: number): void {
      if (hud) hud.flash.visible = nowMs < muzzleFlashUntil;
    },
    render(): void {
      if (!hud) {
        renderer.render(scene, camera);
        return;
      }
      const autoClear = renderer.autoClear;
      renderer.autoClear = false;
      renderer.clear();
      renderer.render(scene, camera);
      renderer.clearDepth();
      renderer.render(hud.scene, hud.camera);
      renderer.autoClear = autoClear;
    },
    resize(width: number, height: number, pixelRatio: number): void {
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(Math.max(1, pixelRatio), quality.maxPixelRatio));
      renderer.setSize(width, height, false);
      hud?.resize(width, height);
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      directional.shadow.dispose();
      hud?.dispose();
      disposeObject(scene);
    },
  };
}

interface HudRuntime {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  flash: THREE.Mesh;
  update(state: FpsState, wave: number): void;
  resize(width: number, height: number): void;
  dispose(): void;
}

function createHud(canvas: HTMLCanvasElement): HudRuntime | null {
  if (typeof document === 'undefined') return null;

  const hudScene = new THREE.Scene();
  const hudCamera = new THREE.OrthographicCamera(0, 1, 1, 0, -10, 10);
  const sharedPlane = new THREE.PlaneGeometry(1, 1);
  const sharedCircle = new THREE.CircleGeometry(0.5, 32);
  const textures: THREE.Texture[] = [];
  const materials: THREE.Material[] = [];
  const roots = {
    crosshair: new THREE.Group(),
    panels: new THREE.Group(),
    touch: new THREE.Group(),
  };
  hudScene.add(roots.crosshair, roots.panels, roots.touch);

  const plane = (
    material: THREE.Material,
    parent: THREE.Object3D,
    width: number,
    height: number,
  ): THREE.Mesh => {
    materials.push(material);
    const mesh = new THREE.Mesh(sharedPlane, material);
    mesh.scale.set(width, height, 1);
    parent.add(mesh);
    return mesh;
  };

  const crosshairMaterial = new THREE.MeshBasicMaterial({
    color: 0xf6fbff,
    transparent: true,
    opacity: 0.92,
    depthTest: false,
    depthWrite: false,
  });
  const crosshairHorizontal = plane(crosshairMaterial, roots.crosshair, 28, 2);
  const crosshairVertical = plane(crosshairMaterial, roots.crosshair, 2, 28);

  const flashMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd27a,
    transparent: true,
    opacity: 0.38,
    depthTest: false,
    depthWrite: false,
  });
  materials.push(flashMaterial);
  const flash = new THREE.Mesh(sharedCircle, flashMaterial);
  flash.scale.setScalar(54);
  flash.visible = false;
  hudScene.add(flash);

  const createTextPanel = (): {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    mesh: THREE.Mesh;
  } | null => {
    const textCanvas = document.createElement('canvas');
    textCanvas.width = 512;
    textCanvas.height = 128;
    const context = textCanvas.getContext('2d');
    if (!context) return null;
    const texture = new THREE.CanvasTexture(textCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    textures.push(texture);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const mesh = plane(material, roots.panels, 1, 1);
    return { canvas: textCanvas, context, mesh };
  };

  const wavePanel = createTextPanel();
  const ammoPanel = createTextPanel();
  let lastHudSignature = '';

  const controlMaterial = new THREE.MeshBasicMaterial({
    color: 0x8fe7ff,
    transparent: true,
    opacity: 0.16,
    depthTest: false,
    depthWrite: false,
  });
  materials.push(controlMaterial);
  const joystick = new THREE.Mesh(sharedCircle, controlMaterial);
  joystick.scale.setScalar(88);
  roots.touch.add(joystick);

  const aimMaterial = new THREE.MeshBasicMaterial({
    color: 0x8fe7ff,
    transparent: true,
    opacity: 0.035,
    depthTest: false,
    depthWrite: false,
  });
  const aimZone = plane(aimMaterial, roots.touch, 1, 1);
  const buttons = [0, 1, 2].map(() => {
    const button = new THREE.Mesh(sharedCircle, controlMaterial);
    button.scale.setScalar(68);
    roots.touch.add(button);
    return button;
  });

  const labelMeshes = ['SW', 'R', 'FIRE'].map((label) => {
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 128;
    labelCanvas.height = 64;
    const context = labelCanvas.getContext('2d');
    if (!context) return null;
    context.clearRect(0, 0, 128, 64);
    context.fillStyle = '#f6fbff';
    context.font = '700 26px monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(label, 64, 34);
    const texture = new THREE.CanvasTexture(labelCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    textures.push(texture);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    return plane(material, roots.touch, 58, 30);
  });

  const isMobile =
    navigator.maxTouchPoints > 0 ||
    (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches);
  roots.touch.visible = isMobile;

  const resize = (width: number, height: number): void => {
    const layout = touchLayout(width, height);
    const center = (rect: TouchRect): { x: number; y: number } => ({
      x: rect.x + rect.width / 2,
      y: height - rect.y - rect.height / 2,
    });
    hudCamera.left = 0;
    hudCamera.right = width;
    hudCamera.top = height;
    hudCamera.bottom = 0;
    hudCamera.updateProjectionMatrix();

    const centerX = width / 2;
    const centerY = height / 2;
    crosshairHorizontal.position.set(centerX, centerY, 2);
    crosshairVertical.position.set(centerX, centerY, 2);
    flash.position.set(centerX, centerY, 1);

    if (wavePanel) {
      wavePanel.mesh.scale.set(260, 65, 1);
      wavePanel.mesh.position.set(138, height - 42, 1);
    }
    if (ammoPanel) {
      ammoPanel.mesh.scale.set(360, 90, 1);
      ammoPanel.mesh.position.set(width - 188, isMobile ? 154 : 55, 1);
    }

    const joystickCenter = center(layout.joystick);
    joystick.scale.set(layout.joystick.width, layout.joystick.height, 1);
    joystick.position.set(joystickCenter.x, joystickCenter.y, 1);
    const aimCenter = center(layout.aim);
    aimZone.scale.set(layout.aim.width, layout.aim.height, 1);
    aimZone.position.set(aimCenter.x, aimCenter.y, 0);
    const actionRects = [layout.switch, layout.reload, layout.fire];
    for (const [index, button] of buttons.entries()) {
      const rect = actionRects[index];
      const actionCenter = center(rect);
      button.scale.set(rect.width, rect.height, 1);
      button.position.set(actionCenter.x, actionCenter.y, 2);
      labelMeshes[index]?.position.set(actionCenter.x, actionCenter.y, 3);
    }
  };

  resize(Math.max(1, canvas.clientWidth || canvas.width), Math.max(1, canvas.clientHeight || canvas.height));

  return {
    scene: hudScene,
    camera: hudCamera,
    flash,
    update(state: FpsState, wave: number): void {
      const ammo = state.loadout[state.activeWeapon];
      const reserve = Number.isFinite(ammo.reserve) ? String(ammo.reserve) : '∞';
      const signature = `${wave}|${state.activeWeapon}|${ammo.magazine}|${reserve}`;
      if (signature === lastHudSignature) return;
      lastHudSignature = signature;

      if (wavePanel) {
        const { context, canvas: panelCanvas } = wavePanel;
        context.clearRect(0, 0, panelCanvas.width, panelCanvas.height);
        context.fillStyle = 'rgba(8, 14, 20, 0.72)';
        context.fillRect(0, 0, panelCanvas.width, panelCanvas.height);
        context.fillStyle = '#8fe7ff';
        context.font = '700 48px monospace';
        context.textBaseline = 'middle';
        context.fillText(`WAVE ${wave}`, 24, 68);
        (wavePanel.mesh.material as THREE.MeshBasicMaterial).map!.needsUpdate = true;
      }

      if (ammoPanel) {
        const { context, canvas: panelCanvas } = ammoPanel;
        context.clearRect(0, 0, panelCanvas.width, panelCanvas.height);
        context.fillStyle = 'rgba(8, 14, 20, 0.8)';
        context.fillRect(0, 0, panelCanvas.width, panelCanvas.height);
        context.textAlign = 'right';
        context.textBaseline = 'middle';
        context.fillStyle = '#f6fbff';
        context.font = '700 32px monospace';
        context.fillText(state.activeWeapon.toUpperCase(), 488, 38);
        context.fillStyle = ammo.magazine === 0 ? '#ff8a70' : '#8fe7ff';
        context.font = '700 42px monospace';
        context.fillText(`${ammo.magazine} / ${reserve}`, 488, 80);
        context.fillStyle = '#f6fbff';
        context.font = '700 21px monospace';
        context.fillText('RELOAD', 488, 111);
        (ammoPanel.mesh.material as THREE.MeshBasicMaterial).map!.needsUpdate = true;
      }
    },
    resize,
    dispose(): void {
      for (const texture of textures) texture.dispose();
      for (const material of new Set(materials)) material.dispose();
      sharedPlane.dispose();
      sharedCircle.dispose();
      hudScene.clear();
    },
  };
}
