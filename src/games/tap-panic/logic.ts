export interface TapTarget {
  x: number;
  y: number;
  age: number;
  ttl: number;
  r0: number;
  decoy: boolean;
}

export function spawnInterval(level: number): number {
  return Math.max(450, 1100 - (level - 1) * 60);
}

export function targetTtl(level: number): number {
  return Math.max(650, 1600 - (level - 1) * 90);
}

export function decoyChance(level: number): number {
  return level >= 4 ? 0.18 : 0;
}

export function targetPoints(remaining: number): number {
  return 20 + Math.round(30 * remaining);
}
