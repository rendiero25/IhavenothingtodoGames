export const W = 960;
export const H = 540;
export const GROUND = 410;
export const END = 3740;
export const ledges: [number, number][] = [[0, 760], [875, 1500], [1615, 2220], [2440, 3070], [3185, 3820]];
export const thorns: [number, number][] = [[1180, 1230], [1810, 1860], [2830, 2880], [3380, 3430]];
const checkpoints = [90, 920, 1660, 2500, 3240];

export interface Input { left: boolean; right: boolean; jump: boolean; interact: boolean }
export interface State {
  x: number; y: number; vx: number; vy: number; lives: number; checkpoint: number;
  grounded: boolean; bridge: boolean; finished: boolean; dead: boolean; time: number;
  jumpBuffer: number; coyote: number; deaths: number;
}
export const createState = (lives: number): State => ({
  x: 90, y: GROUND, vx: 0, vy: 0, lives, checkpoint: 90, grounded: true,
  bridge: false, finished: false, dead: false, time: 0, jumpBuffer: 0, coyote: 0, deaths: 0,
});
export function step(s: State, input: Input, dt: number): void {
  if (s.finished || s.dead) return;
  s.time += dt;
  if (input.interact && Math.abs(s.x - 2080) < 65 && s.y >= GROUND - 80) s.bridge = true;
  s.jumpBuffer = input.jump ? 0.12 : Math.max(0, s.jumpBuffer - dt);
  s.coyote = s.grounded ? 0.1 : Math.max(0, s.coyote - dt);
  if (s.jumpBuffer > 0 && s.coyote > 0) { s.vy = -660; s.grounded = false; s.coyote = 0; s.jumpBuffer = 0; }
  const direction = Number(input.right) - Number(input.left);
  s.vx += (direction * 290 - s.vx) * Math.min(1, dt * (direction ? 12 : 18));
  s.x = Math.max(16, Math.min(END + 25, s.x + s.vx * dt));
  const oldY = s.y;
  s.vy = Math.min(900, s.vy + 1750 * dt);
  s.y += s.vy * dt;
  const overGround = ledges.some(([a, b]) => s.x >= a && s.x <= b) || (s.bridge && s.x >= 2220 && s.x <= 2440);
  if (s.vy >= 0 && oldY <= GROUND && s.y >= GROUND && overGround) { s.y = GROUND; s.vy = 0; s.grounded = true; }
  else s.grounded = false;
  for (const x of checkpoints) if (s.x >= x && s.grounded) s.checkpoint = x;
  if (thorns.some(([a, b]) => s.x >= a && s.x <= b && s.y > GROUND - 25) || s.y > H + 75) {
    s.lives--; s.deaths++;
    if (s.lives <= 0) s.dead = true;
    else { s.x = s.checkpoint; s.y = GROUND; s.vx = 0; s.vy = 0; s.grounded = true; }
  }
  if (s.x >= END && s.grounded) s.finished = true;
}
