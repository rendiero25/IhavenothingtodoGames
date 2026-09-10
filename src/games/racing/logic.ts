export type RacingMode = 'highway' | 'rally' | 'slipstream';
export interface Rival { x: number; z: number; passed: boolean }
export const clamp = (x: number, min: number, max: number): number => Math.max(min, Math.min(max, x));
export function bend(distance: number, mode: RacingMode): number {
  return Math.sin(distance / 850) * (mode === 'rally' ? 0.85 : 0.22);
}
export function crossing(previous: number, next: number): boolean { return previous < 0.9 && next >= 0.9; }
export function contact(player: number, rival: number): boolean { return Math.abs(player - rival) < 0.23; }
export function drafting(player: number, rivals: Rival[]): boolean {
  return rivals.some((r) => r.z > 0.45 && r.z < 0.82 && Math.abs(player - r.x) < 0.22);
}
