import { mulberry32 } from '../../core/rng';
import type { EnemyKind, EnemySpawn } from './config';

export type { EnemyKind, EnemySpawn } from './config';

const UNLOCKS: readonly EnemyKind[] = ['drone', 'runner', 'turret', 'soldier', 'zombie'];
const HEALTH: Record<EnemyKind, number> = { drone: 60, runner: 45, turret: 100, soldier: 120, zombie: 80 };
const ZONES = [
  { x: -18, z: -12 },
  { x: 18, z: -12 },
  { x: -18, z: 28 },
  { x: 18, z: 28 },
] as const;

function position(rand: () => number, index: number): Pick<EnemySpawn, 'x' | 'z'> {
  const zone = ZONES[index % ZONES.length];
  const x = zone.x + (rand() - 0.5) * 8;
  const z = zone.z + (rand() - 0.5) * 8;
  return { x, z };
}

export function createWave(seed: number, wave: number): EnemySpawn[] {
  const safeWave = Math.max(1, Math.floor(wave));
  const count = Math.min(12, safeWave);
  const rand = mulberry32((seed ^ Math.imul(safeWave, 0x9e3779b1)) >>> 0);
  const available = UNLOCKS.slice(0, Math.min(UNLOCKS.length, safeWave));
  const bossIndex = safeWave % 5 === 0 ? Math.floor(rand() * count) : -1;

  return Array.from({ length: count }, (_, index) => {
    const kind = available[Math.floor(rand() * available.length)];
    const boss = index === bossIndex;
    return {
      id: `wave-${safeWave}-${index}`,
      kind,
      ...position(rand, index),
      yaw: rand() * Math.PI * 2,
      health: boss ? 300 + safeWave * 25 : HEALTH[kind],
      boss,
    };
  });
}
