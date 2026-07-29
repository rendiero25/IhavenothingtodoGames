import { seededShuffle } from '../../core/rng';
export type Judgement = 'perfect' | 'good';
export function bpmForLevel(level: number): number { return Math.min(180, 90 + (level - 1) * 8); }
export function makeBar(rand: () => number, level: number): boolean[] {
  const density = Math.min(6, 2 + level);
  const extra = seededShuffle([1, 2, 3, 4, 5, 6, 7], rand).slice(0, density - 1);
  const bar = Array.from({ length: 8 }, () => false); bar[0] = true; for (const i of extra) bar[i] = true; return bar;
}
export function judge(deltaMs: number): Judgement | null { const d = Math.abs(deltaMs); if (d <= 50) return 'perfect'; if (d <= 130) return 'good'; return null; }
