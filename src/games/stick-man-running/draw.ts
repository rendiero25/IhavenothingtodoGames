import { FLOOR_Y, LOGICAL_HEIGHT, LOGICAL_WIDTH } from './config';
import type { EffectState, EnemyState, GameState, PickupState, PlayerState } from './logic';

const WIDTH = LOGICAL_WIDTH;
const HEIGHT = LOGICAL_HEIGHT;
const INK = '#171717';
const GRAPHITE = '#626262';
const PAPER = '#f7f7f7';
const RULE = '#d6d6d6';
const MARGIN = '#c8c8c8';

function line(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width = 3,
  colour = INK,
): void {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineWidth = width;
  ctx.strokeStyle = colour;
  ctx.stroke();
}

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, width = 3): void {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.lineWidth = width;
  ctx.strokeStyle = INK;
  ctx.stroke();
}

function lifeRatio(effect: EffectState): number {
  return Math.max(0, Math.min(1, effect.life / Math.max(1, effect.maxLife)));
}

function inkDot(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = INK;
  ctx.fill();
}

function drawPaper(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = PAPER;
  ctx.fillRect(-16, -16, WIDTH + 32, HEIGHT + 32);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.strokeStyle = RULE;
  ctx.lineWidth = 1;
  for (let y = 48; y < HEIGHT + 16; y += 30) line(ctx, -16, y, WIDTH + 16, y, 1, RULE);
  line(ctx, 70, -16, 70, HEIGHT + 16, 1, MARGIN);

  ctx.strokeStyle = '#d8d8d8';
  ctx.lineWidth = 1;
  for (let x = 126; x < WIDTH; x += 184) {
    line(ctx, x, 12, x + 19, 17, 1, '#d8d8d8');
    line(ctx, x + 12, 20, x + 35, 16, 1, '#d8d8d8');
  }
}

function drawArena(ctx: CanvasRenderingContext2D): void {
  line(ctx, 30, FLOOR_Y, WIDTH - 30, FLOOR_Y, 5);
  line(ctx, 30, FLOOR_Y + 5, WIDTH - 30, FLOOR_Y + 5, 1, GRAPHITE);
  line(ctx, 30, FLOOR_Y - 1, 30, FLOOR_Y + 17, 3);
  line(ctx, WIDTH - 30, FLOOR_Y - 1, WIDTH - 30, FLOOR_Y + 17, 3);

  for (const obstacle of [240, 690]) {
    ctx.strokeStyle = GRAPHITE;
    ctx.lineWidth = 2;
    ctx.strokeRect(obstacle, FLOOR_Y - 22, 58, 22);
    line(ctx, obstacle + 4, FLOOR_Y - 4, obstacle + 22, FLOOR_Y - 18, 1, GRAPHITE);
    line(ctx, obstacle + 24, FLOOR_Y - 4, obstacle + 48, FLOOR_Y - 18, 1, GRAPHITE);
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, player: PlayerState, time: number): void {
  const dir = player.facing;
  const attacking = player.comboStep > 0;
  const recoil = attacking ? -dir * player.comboStep * 2 : 0;
  const footY = player.y;
  const hipY = footY - 34;
  const shoulderY = footY - 74;
  const headY = footY - 102;
  const stride = Math.min(10, Math.abs(player.vx) / 30) * dir;

  ctx.save();
  ctx.globalAlpha = time < player.invulnerableUntil && Math.floor(time / 80) % 2 === 1 ? 0.42 : 1;
  circle(ctx, player.x + recoil, headY, 16, 3.5);
  line(ctx, player.x + recoil, headY + 16, player.x + recoil, hipY, 4);
  line(ctx, player.x + recoil, shoulderY, player.x + recoil + dir * (attacking ? 44 + player.comboStep * 12 : 27), shoulderY + (attacking ? -4 : 18), 4);
  line(ctx, player.x + recoil, shoulderY + 4, player.x + recoil - dir * 25, shoulderY + 24, 3);
  line(ctx, player.x + recoil, hipY, player.x + recoil + 18 + stride, footY, 4);
  line(ctx, player.x + recoil, hipY, player.x + recoil - 18 - stride, footY, 4);
  if (player.weapon) drawWeapon(ctx, player.x + recoil + dir * 28, shoulderY - 1, dir, player.weapon);
  ctx.restore();
}

function drawWeapon(ctx: CanvasRenderingContext2D, x: number, y: number, dir: number, weapon: PickupState['kind']): void {
  ctx.save();
  ctx.strokeStyle = INK;
  ctx.fillStyle = PAPER;
  if (weapon === 'ruler') {
    line(ctx, x, y, x + dir * 54, y - 3, 5);
    for (let notch = 10; notch < 50; notch += 10) line(ctx, x + dir * notch, y - 4, x + dir * notch, y - 10, 1);
  } else if (weapon === 'eraser') {
    ctx.lineWidth = 3;
    ctx.strokeRect(x + (dir < 0 ? -26 : 0), y - 11, 26, 17);
    line(ctx, x + dir * 4, y - 8, x + dir * 20, y + 3, 1, GRAPHITE);
  } else if (weapon === 'pencil') {
    line(ctx, x, y, x + dir * 43, y - 18, 4);
    line(ctx, x + dir * 43, y - 18, x + dir * 48, y - 19, 1);
  } else {
    ctx.beginPath();
    ctx.ellipse(x + dir * 12, y - 6, 12, 7, dir * 0.55, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x + dir * 20, y - 12, 8, 5, dir * 0.55, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/** Draw only the controllable stickman, useful for isolated pose previews. */
export function drawStickMan(ctx: CanvasRenderingContext2D, state: GameState, _reducedMotion = false): void {
  drawPlayer(ctx, state.player, state.time);
}

function drawEnemy(ctx: CanvasRenderingContext2D, enemy: EnemyState, time: number): void {
  const scale = enemy.kind === 'boss' ? 1.55 : enemy.kind === 'blocker' ? 1.18 : 1;
  const footY = enemy.y;
  const headY = footY - 92 * scale;
  const torsoY = footY - 47 * scale;
  const dir = enemy.facing;
  const stunned = time < enemy.stunUntil;
  ctx.save();
  ctx.translate(enemy.x, footY);
  ctx.scale(scale, scale);
  ctx.translate(-enemy.x, -footY);
  ctx.globalAlpha = stunned ? 0.6 : 1;
  circle(ctx, enemy.x, headY, 15, enemy.kind === 'blocker' ? 5 : 3);
  line(ctx, enemy.x, headY + 15, enemy.x, torsoY, enemy.kind === 'blocker' ? 5 : 3.5);
  line(ctx, enemy.x, torsoY, enemy.x + dir * 18, footY, 3.5);
  line(ctx, enemy.x, torsoY, enemy.x - dir * 18, footY, 3.5);

  if (enemy.kind === 'runner') {
    line(ctx, enemy.x, headY + 39, enemy.x + dir * 31, headY + 48, 3);
    line(ctx, enemy.x + dir * 19, footY - 25, enemy.x + dir * 44, footY - 7, 2, GRAPHITE);
  } else if (enemy.kind === 'blocker') {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.strokeRect(enemy.x + (dir < 0 ? -26 : 3), torsoY - 8, 23, 35);
    line(ctx, enemy.x + dir * 8, headY + 37, enemy.x + dir * 30, headY + 40, 4);
  } else if (enemy.kind === 'thrower') {
    line(ctx, enemy.x, headY + 38, enemy.x + dir * 36, headY + 20, 3);
    ctx.strokeStyle = GRAPHITE;
    ctx.strokeRect(enemy.x + dir * 30 - 7, headY + 13, 14, 10);
    if (enemy.telegraph > 0) {
      ctx.setLineDash([5, 5]);
      line(ctx, enemy.x + dir * 38, headY + 18, enemy.x + dir * 94, headY + 8, 2, GRAPHITE);
      ctx.setLineDash([]);
    }
  } else {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.strokeRect(enemy.x - 22, headY - 20, 44, 38);
    line(ctx, enemy.x - 28, torsoY - 10, enemy.x + 28, torsoY - 10, 4);
    line(ctx, enemy.x - 31, torsoY + 10, enemy.x + 31, torsoY + 10, 3, GRAPHITE);
  }

  drawDamageHatching(ctx, enemy.x, headY, 30, 1 - enemy.hp / Math.max(1, enemy.maxHp));
  if (enemy.telegraph > 0) drawTelegraph(ctx, enemy.x, footY - 50 * scale, enemy.kind, enemy.telegraph);
  ctx.restore();
}

function drawDamageHatching(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, damage: number): void {
  const count = Math.ceil(Math.max(0, damage) * 6);
  for (let index = 0; index < count; index += 1) {
    const offset = index * 6 - size / 2;
    line(ctx, x + offset, y + 13, x + offset + 11, y + 25, 1.4, GRAPHITE);
  }
}

function drawTelegraph(ctx: CanvasRenderingContext2D, x: number, y: number, kind: EnemyState['kind'], amount: number): void {
  const pulse = Math.min(1, amount / 300);
  ctx.save();
  ctx.globalAlpha = 0.45 + pulse * 0.4;
  ctx.strokeStyle = GRAPHITE;
  ctx.lineWidth = kind === 'boss' ? 4 : 2;
  if (kind === 'runner') {
    line(ctx, x - 35, y + 16, x - 60, y + 8, 2, GRAPHITE);
    line(ctx, x + 35, y + 16, x + 60, y + 8, 2, GRAPHITE);
  } else if (kind === 'blocker') {
    ctx.strokeRect(x - 31, y - 32, 62, 64);
  } else if (kind === 'thrower') {
    ctx.setLineDash([5, 5]);
    line(ctx, x - 66, y - 18, x + 66, y - 18, 2, GRAPHITE);
    ctx.setLineDash([]);
  } else {
    ctx.beginPath();
    ctx.ellipse(x, y + 42, 54 + pulse * 11, 12 + pulse * 5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPickup(ctx: CanvasRenderingContext2D, pickup: PickupState): void {
  if (!pickup.active) return;
  const y = pickup.y - 16;
  ctx.save();
  ctx.strokeStyle = INK;
  ctx.fillStyle = PAPER;
  ctx.lineWidth = 3;
  if (pickup.kind === 'ruler') {
    ctx.strokeRect(pickup.x - 28, y - 7, 56, 14);
    for (let notch = -18; notch <= 18; notch += 9) line(ctx, pickup.x + notch, y - 7, pickup.x + notch, y - 1, 1);
  } else if (pickup.kind === 'eraser') {
    ctx.strokeRect(pickup.x - 17, y - 13, 34, 25);
    line(ctx, pickup.x - 13, y - 10, pickup.x + 11, y + 8, 1, GRAPHITE);
  } else if (pickup.kind === 'pencil') {
    line(ctx, pickup.x - 24, y + 12, pickup.x + 22, y - 13, 5);
    line(ctx, pickup.x + 22, y - 13, pickup.x + 29, y - 16, 1);
  } else {
    ctx.beginPath();
    ctx.ellipse(pickup.x - 5, y, 15, 8, -0.55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(pickup.x + 7, y - 8, 10, 5, -0.55, 0, Math.PI * 2);
    ctx.stroke();
  }
  line(ctx, pickup.x - 33, pickup.y + 5, pickup.x + 33, pickup.y + 5, 1, GRAPHITE);
  ctx.restore();
}

function drawEffects(ctx: CanvasRenderingContext2D, effects: EffectState[], reducedMotion: boolean): void {
  for (const effect of effects) {
    if (reducedMotion && effect.kind === 'page-shift') continue;
    const shortenedLife = reducedMotion ? effect.life - effect.maxLife * 0.5 : effect.life;
    const ratio = Math.max(0, Math.min(1, shortenedLife / Math.max(1, effect.maxLife * (reducedMotion ? 0.5 : 1))));
    if (ratio <= 0) continue;
    const size = effect.strength * (reducedMotion ? 0.55 : 1) * (0.55 + ratio * 0.45);
    ctx.save();
    ctx.globalAlpha = ratio;
    if (effect.kind === 'dust') {
      for (let dot = 0; dot < 4; dot += 1) inkDot(ctx, effect.x + dot * 5 - 8, effect.y - Math.abs(dot - 2) * 3, Math.max(1, size / 8));
    } else if (effect.kind === 'impact') {
      for (let ray = 0; ray < 8; ray += 1) {
        const angle = (Math.PI * 2 * ray) / 8;
        line(ctx, effect.x + Math.cos(angle) * size * 0.22, effect.y + Math.sin(angle) * size * 0.22, effect.x + Math.cos(angle) * size, effect.y + Math.sin(angle) * size, 2);
      }
    } else if (effect.kind === 'burst') {
      for (let dot = 0; dot < 7; dot += 1) {
        const angle = (Math.PI * 2 * dot) / 7 + 0.25;
        inkDot(ctx, effect.x + Math.cos(angle) * size * 0.65, effect.y + Math.sin(angle) * size * 0.48, Math.max(1.5, size / 10));
      }
    } else {
      line(ctx, effect.x - size, effect.y - size / 3, effect.x + size, effect.y + size / 3, 2, GRAPHITE);
      line(ctx, effect.x - size * 0.65, effect.y + size / 3, effect.x + size * 0.65, effect.y - size / 3, 1, GRAPHITE);
    }
    ctx.restore();
  }
}

/** Draw the complete 960x540 notebook brawler scene without mutating gameplay state. */
export function drawNotebookScene(ctx: CanvasRenderingContext2D, state: GameState, reducedMotion = false): void {
  const pageShift = reducedMotion
    ? 0
    : state.effects.reduce((shift, effect) => effect.kind === 'page-shift' ? shift + lifeRatio(effect) * effect.strength * 0.08 : shift, 0);
  ctx.save();
  ctx.translate(pageShift, pageShift * 0.32);
  drawPaper(ctx);
  drawArena(ctx);
  for (const pickup of state.pickups) drawPickup(ctx, pickup);
  for (const enemy of state.enemies) drawEnemy(ctx, enemy, state.time);
  drawStickMan(ctx, state, reducedMotion);
  drawEffects(ctx, state.effects, reducedMotion);

  ctx.restore();
}
