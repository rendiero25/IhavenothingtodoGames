import type { Rect } from '../canvas';
export interface Obstacle extends Rect { scored: boolean; }
export function fallSpeed(level: number): number { return 160 + (level - 1) * 25; }
export function spawnMs(level: number): number { return Math.max(320, 800 - (level - 1) * 45); }
export function circleRectOverlap(cx: number, cy: number, r: number, rect: Rect): boolean {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  return (cx - nx) ** 2 + (cy - ny) ** 2 <= r * r;
}
