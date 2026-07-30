import * as THREE from 'three';
import { mulberry32 } from '../../core/rng';
import { sfx } from '../../core/sound';
import type { EndReason, GameEngine, GameOptions } from '../types';
import { WEAPONS, type EnemyKind, type EnemySpawn, type FpsState, type WeaponId } from './config';
import { InputController } from './input';
import { EngineLifecycle } from './lifecycle';
import {
  buildFpsResult,
  createFpsState,
  damagePlayer,
  fire,
  frameDeltas,
  refillWaveReserves,
  registerHit,
  reload,
  switchWeapon,
} from './logic';
import { createArenaScene, createEnemyObject, disposeObject, type ArenaScene } from './scene';
import { createWave } from './waves';

interface EnemyRuntime {
  spawn: EnemySpawn;
  object: THREE.Group;
  health: number;
  nextAttackAt: number;
  strafeSign: -1 | 1;
}

const PLAYER_SPEED = 5;
const LOOK_SENSITIVITY = 0.0025;
const WAVE_DELAY_MS = 1500;
const PLAYER_COLLIDER_SIZE = new THREE.Vector3(0.72, 1.8, 0.72);

const ENEMY_BEHAVIOR: Record<
  EnemyKind,
  { speed: number; cooldownMs: number; range: number; preferredDistance: number }
> = {
  drone: { speed: 2.3, cooldownMs: 1300, range: 30, preferredDistance: 8 },
  runner: { speed: 5.1, cooldownMs: 850, range: 1.55, preferredDistance: 0 },
  turret: { speed: 0, cooldownMs: 1550, range: 42, preferredDistance: 0 },
  soldier: { speed: 2.4, cooldownMs: 1200, range: 32, preferredDistance: 12 },
  zombie: { speed: 1.65, cooldownMs: 1150, range: 1.65, preferredDistance: 0 },
};

function isLowPowerDevice(): boolean {
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return (memory !== undefined && memory <= 4) || navigator.hardwareConcurrency <= 4;
}

function attackCooldown(spawn: EnemySpawn): number {
  const base = ENEMY_BEHAVIOR[spawn.kind].cooldownMs;
  return spawn.boss ? base * 0.8 : base;
}

/** Low-poly, texture-free arena combat runtime. */
export class FpsEngine implements GameEngine {
  private opts: GameOptions | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private arena: ArenaScene | null = null;
  private input: InputController | null = null;
  private lifecycle: EngineLifecycle | null = null;
  private raycaster: THREE.Raycaster | null = null;
  private state: FpsState | null = null;
  private readonly enemies = new Map<string, EnemyRuntime>();
  private readonly enemyPool: THREE.Group[] = [];
  private random: () => number = Math.random;
  private wave = 1;
  private elapsed = 0;
  private nextWaveAt: number | null = null;
  private lastFrameAt: number | null = null;
  private readonly lastShotAt: Record<WeaponId, number> = {
    pistol: Number.NEGATIVE_INFINITY,
    rifle: Number.NEGATIVE_INFINITY,
    shotgun: Number.NEGATIVE_INFINITY,
  };
  private yaw = 0;
  private pitch = 0;
  private paused = true;
  private finished = false;
  private destroyed = false;

  init(canvas: HTMLCanvasElement, opts: GameOptions): void {
    if (this.renderer || this.destroyed) return;
    this.opts = opts;
    const lowPower = isLowPowerDevice();

    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !lowPower,
        powerPreference: 'high-performance',
      });
    } catch {
      this.opts = null;
      throw new Error('WEBGL_UNAVAILABLE');
    }

    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.arena = createArenaScene(this.renderer, opts.seed);
    this.arena.setQuality(lowPower);
    this.input = new InputController(canvas);
    this.raycaster = new THREE.Raycaster();
    this.state = createFpsState(opts.startLives);
    this.random = mulberry32((opts.seed ^ 0xa5f1523d) >>> 0);
    this.lifecycle = new EngineLifecycle();
    this.input.attach();
    this.lifecycle.track(() => this.input?.destroy());

    const resize = (): void => {
      if (!this.arena) return;
      const width = Math.max(1, canvas.clientWidth || canvas.width);
      const height = Math.max(1, canvas.clientHeight || canvas.height);
      this.arena.resize(width, height, window.devicePixelRatio || 1);
    };
    window.addEventListener('resize', resize);
    this.lifecycle.track(() => window.removeEventListener('resize', resize));
    resize();

    this.arena.camera.rotation.order = 'YXZ';
    this.arena.camera.position.copy(this.arena.spawnPlayer);
    this.spawnWave(1);
    this.renderer.render(this.arena.scene, this.arena.camera);
  }

  start(): void {
    if (!this.lifecycle || !this.renderer || !this.arena || !this.input || !this.state || this.finished) return;
    this.paused = false;
    this.input.setPaused(false);
    this.lastFrameAt = null;
    this.lifecycle.start((time) => this.onFrame(time));
  }

  pause(): void {
    if (this.finished || this.destroyed) return;
    this.paused = true;
    this.lastFrameAt = null;
    this.input?.setPaused(true);
  }

  resume(): void {
    if (this.finished || this.destroyed || !this.lifecycle) return;
    this.paused = false;
    this.lastFrameAt = null;
    this.input?.setPaused(false);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.paused = true;
    this.lifecycle?.destroy();
    this.input?.destroy();
    for (const object of this.enemyPool) disposeObject(object);
    this.enemyPool.length = 0;
    this.enemies.clear();
    this.arena?.dispose();
    this.renderer?.dispose();
    this.renderer?.forceContextLoss();
    this.opts = null;
    this.renderer = null;
    this.arena = null;
    this.input = null;
    this.lifecycle = null;
    this.raycaster = null;
    this.state = null;
  }

  private onFrame(time: number): void {
    if (!this.renderer || !this.arena || this.destroyed || this.finished) return;
    if (this.paused) {
      this.lastFrameAt = null;
      return;
    }

    if (this.lastFrameAt === null) {
      this.lastFrameAt = time;
      this.renderer.render(this.arena.scene, this.arena.camera);
      return;
    }

    const { elapsedMs, simulationMs } = frameDeltas(this.lastFrameAt, time);
    this.lastFrameAt = time;
    this.elapsed += elapsedMs;
    if (this.opts?.roundMs !== undefined && this.elapsed >= this.opts.roundMs) {
      this.elapsed = this.opts.roundMs;
      this.finish('timeup');
      return;
    }

    this.updateInput(simulationMs);
    this.updateEnemies(simulationMs);
    this.updateWave();
    if (!this.finished) this.renderer.render(this.arena.scene, this.arena.camera);
  }

  private updateInput(deltaMs: number): void {
    if (!this.input || !this.arena || !this.state) return;
    const input = this.input.snapshot();
    this.yaw -= input.lookX * LOOK_SENSITIVITY;
    this.pitch = THREE.MathUtils.clamp(this.pitch - input.lookY * LOOK_SENSITIVITY, -1.2, 1.2);
    this.arena.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');

    const moveLength = Math.hypot(input.moveX, input.moveZ);
    if (moveLength > 0) {
      const scale = PLAYER_SPEED * (deltaMs / 1000) / Math.max(1, moveLength);
      const x = (input.moveX * Math.cos(this.yaw) - input.moveZ * Math.sin(this.yaw)) * scale;
      const z = (input.moveX * Math.sin(this.yaw) - input.moveZ * Math.cos(this.yaw)) * scale;
      this.movePlayer(x, z);
    }

    if (input.weaponRequested) this.state = switchWeapon(this.state, input.weaponRequested);
    if (input.reloadRequested) this.state = reload(this.state);
    if (input.firing) this.tryFire();
    this.input.consumeFrame();
  }

  private movePlayer(x: number, z: number): void {
    if (!this.arena) return;
    const camera = this.arena.camera;
    const nextX = camera.position.clone();
    nextX.x += x;
    if (!this.playerCollides(nextX)) camera.position.x = nextX.x;

    const nextZ = camera.position.clone();
    nextZ.z += z;
    if (!this.playerCollides(nextZ)) camera.position.z = nextZ.z;
  }

  private playerCollides(position: THREE.Vector3): boolean {
    if (!this.arena) return true;
    const center = new THREE.Vector3(position.x, PLAYER_COLLIDER_SIZE.y / 2, position.z);
    const playerBox = new THREE.Box3().setFromCenterAndSize(center, PLAYER_COLLIDER_SIZE);
    return this.arena.arenaColliders.some((collider) => collider.intersectsBox(playerBox));
  }

  private tryFire(): void {
    if (!this.state || !this.arena || !this.raycaster) return;
    const weapon = this.state.activeWeapon;
    const spec = WEAPONS[weapon];
    if (this.elapsed - this.lastShotAt[weapon] < spec.intervalMs) return;

    const fired = fire(this.state, this.elapsed);
    if (fired === this.state) return;
    this.state = fired;
    this.lastShotAt[weapon] = this.elapsed;
    sfx.play('tick');
    this.arena.camera.updateMatrixWorld(true);

    for (let pellet = 0; pellet < spec.pellets; pellet += 1) {
      const spreadX = (this.random() * 2 - 1) * spec.spread;
      const spreadY = (this.random() * 2 - 1) * spec.spread;
      this.raycaster.setFromCamera(new THREE.Vector2(spreadX, spreadY), this.arena.camera);
      const first = this.raycaster.intersectObjects(this.arena.scene.children, true)[0];
      const enemyId = first?.object.userData.enemyId as string | undefined;
      if (!enemyId) continue;
      const enemy = this.enemies.get(enemyId);
      if (!enemy) continue;
      this.hitEnemy(enemy, first.object.userData.hitPart === 'head', spec.damage);
    }
  }

  private hitEnemy(enemy: EnemyRuntime, headshot: boolean, damage: number): void {
    if (!this.state || !this.opts) return;
    const actualDamage = damage * (headshot ? 2 : 1);
    enemy.health = Math.max(0, enemy.health - actualDamage);
    const killed = enemy.health === 0;
    const points = killed ? (headshot ? 100 : 50) : headshot ? 20 : 10;
    this.state = registerHit(this.state, headshot, killed, points);
    sfx.play(killed ? 'good' : 'tap');

    if (killed) {
      this.retireEnemy(enemy);
      this.opts.callbacks.onScore(this.state.score, this.state.combo);
      if (this.enemies.size === 0) this.nextWaveAt = this.elapsed + WAVE_DELAY_MS;
    }
  }

  private updateEnemies(deltaMs: number): void {
    if (!this.arena || this.finished) return;
    const player = this.arena.camera.position;
    for (const enemy of [...this.enemies.values()]) {
      const behavior = ENEMY_BEHAVIOR[enemy.spawn.kind];
      const dx = player.x - enemy.object.position.x;
      const dz = player.z - enemy.object.position.z;
      const distance = Math.hypot(dx, dz);
      if (distance <= 0.001) continue;
      const nx = dx / distance;
      const nz = dz / distance;
      const step = behavior.speed * (deltaMs / 1000);

      switch (enemy.spawn.kind) {
        case 'drone':
          if (distance > behavior.preferredDistance + 1) this.moveEnemy(enemy, nx * step, nz * step);
          else if (distance < behavior.preferredDistance - 1) this.moveEnemy(enemy, -nx * step, -nz * step);
          break;
        case 'runner':
        case 'zombie':
          this.moveEnemy(enemy, nx * step, nz * step);
          break;
        case 'soldier':
          this.moveEnemy(enemy, -nz * step * enemy.strafeSign, nx * step * enemy.strafeSign);
          break;
        case 'turret':
          break;
      }

      enemy.object.rotation.y = Math.atan2(dx, dz);
      if (
        distance <= behavior.range &&
        this.elapsed >= enemy.nextAttackAt &&
        this.hasLineOfSight(enemy.object.position, player)
      ) {
        enemy.nextAttackAt = this.elapsed + attackCooldown(enemy.spawn);
        this.takeDamage();
        if (this.finished) return;
      }
    }
  }

  private moveEnemy(enemy: EnemyRuntime, x: number, z: number): void {
    enemy.object.position.x = THREE.MathUtils.clamp(enemy.object.position.x + x, -23.8, 23.8);
    enemy.object.position.z = THREE.MathUtils.clamp(enemy.object.position.z + z, -32.8, 32.8);
  }

  private hasLineOfSight(from: THREE.Vector3, target: THREE.Vector3): boolean {
    if (!this.arena) return false;
    const origin = new THREE.Vector3(from.x, from.y + 1.15, from.z);
    const toPlayer = target.clone().sub(origin);
    const distance = toPlayer.length();
    const ray = new THREE.Ray(origin, toPlayer.normalize());
    const hit = new THREE.Vector3();
    return !this.arena.arenaColliders.some((collider) => {
      const intersection = ray.intersectBox(collider, hit);
      return intersection !== null && intersection.distanceTo(origin) < distance;
    });
  }

  private takeDamage(): void {
    if (!this.state || !this.opts) return;
    const damaged = damagePlayer(this.state, this.elapsed);
    if (damaged.lives === this.state.lives) return;
    this.state = damaged;
    this.opts.callbacks.onLifeLost();
    if (this.state.lives <= 0) this.finish('lives');
  }

  private updateWave(): void {
    if (this.nextWaveAt === null || this.elapsed < this.nextWaveAt || !this.state) return;
    this.nextWaveAt = null;
    this.state = refillWaveReserves(this.state);
    this.wave += 1;
    this.spawnWave(this.wave);
  }

  private spawnWave(wave: number): void {
    if (!this.arena) return;
    for (const spawn of createWave(this.opts?.seed ?? 0, wave)) {
      const object = this.takeEnemyObject(spawn);
      const runtime: EnemyRuntime = {
        spawn,
        object,
        health: spawn.health,
        nextAttackAt: this.elapsed + attackCooldown(spawn) * (0.35 + this.random() * 0.65),
        strafeSign: this.random() < 0.5 ? -1 : 1,
      };
      this.enemies.set(spawn.id, runtime);
      this.arena.enemyRoot.add(object);
    }
  }

  private takeEnemyObject(spawn: EnemySpawn): THREE.Group {
    const object =
      this.enemyPool.pop() ??
      createEnemyObject({
        ...spawn,
        boss: false,
      });
    object.visible = true;
    object.name = `enemy-${spawn.id}`;
    object.position.set(spawn.x, spawn.kind === 'drone' ? 1.8 : 0, spawn.z);
    object.rotation.set(0, spawn.yaw, 0);
    object.scale.setScalar(spawn.boss ? 1.6 : 1);
    object.userData = { spawnId: spawn.id, kind: spawn.kind, boss: spawn.boss };
    let meshIndex = 0;
    object.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.userData = {
        enemyId: spawn.id,
        hitPart: meshIndex === 0 ? 'body' : 'head',
      };
      meshIndex += 1;
    });
    return object;
  }

  private retireEnemy(enemy: EnemyRuntime): void {
    this.enemies.delete(enemy.spawn.id);
    enemy.object.removeFromParent();
    enemy.object.visible = false;
    this.enemyPool.push(enemy.object);
  }

  private finish(endReason: EndReason): void {
    if (this.finished || !this.state || !this.opts) return;
    this.finished = true;
    this.paused = true;
    this.input?.setPaused(true);
    this.lifecycle?.destroy();
    this.opts.callbacks.onGameOver(buildFpsResult(this.state, this.wave, this.elapsed, endReason));
  }
}
