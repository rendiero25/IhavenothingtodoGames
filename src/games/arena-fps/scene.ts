import * as THREE from 'three';
import type { EnemySpawn } from './config';

export interface ArenaScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  enemyRoot: THREE.Group;
  projectileRoot: THREE.Group;
  arenaColliders: readonly THREE.Box3[];
  spawnPlayer: THREE.Vector3;
  setQuality(lowPower: boolean): void;
  resize(width: number, height: number, pixelRatio: number): void;
  dispose(): void;
}

const ARENA_HALF_WIDTH = 25;
const ARENA_HALF_DEPTH = 34;
const WALL_HEIGHT = 8;

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

  let disposed = false;
  let lowPower = false;
  return {
    scene,
    camera,
    enemyRoot,
    projectileRoot,
    arenaColliders,
    spawnPlayer,
    setQuality(nextLowPower: boolean): void {
      lowPower = nextLowPower;
      directional.castShadow = !lowPower;
      renderer.shadowMap.enabled = !lowPower;
    },
    resize(width: number, height: number, pixelRatio: number): void {
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(Math.max(1, pixelRatio), lowPower ? 1 : 2));
      renderer.setSize(width, height, false);
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      disposeObject(scene);
    },
  };
}
