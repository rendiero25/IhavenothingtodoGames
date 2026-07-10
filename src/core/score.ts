import type { DictKey } from '../i18n/dict';

export function comboMultiplier(combo: number): number {
  return 1 + Math.min(4, Math.floor(combo / 5));
}

const TIERS: Array<[number, DictKey]> = [
  [8000, 'title.t4'],
  [4000, 'title.t3'],
  [1500, 'title.t2'],
  [500, 'title.t1'],
  [0, 'title.t0'],
];

export function titleKeyFor(score: number): DictKey {
  for (const [min, key] of TIERS) if (score >= min) return key;
  return 'title.t0';
}

export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
