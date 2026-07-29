import { minimumTouchRadius } from '../canvas';

export interface Bubble { x: number; baseY: number; dir: 1 | -1; phase: number; r: number; skull: boolean; }
export function bubbleSpeed(level: number): number { return 90 + (level - 1) * 12; }
export function spawnMs(level: number): number { return Math.max(600, 1400 - (level - 1) * 70); }
export function bubbleRadius(level: number): number { return Math.max(16, 26 - (level - 1) * 1.5); }
export function skullChance(level: number): number { return level >= 3 ? 0.2 : 0; }
export function hitPoints(level: number): number { return 15 + level * 3; }
export function bubbleHitRadius(radius: number, displayWidth: number, displayHeight: number): number {
  return Math.max(radius + 8, minimumTouchRadius(displayWidth, displayHeight));
}
