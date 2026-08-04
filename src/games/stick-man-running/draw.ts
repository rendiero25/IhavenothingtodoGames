import { ATTACK_ANIMATION_MS, FLOOR_Y, HIT_STUN_MS, LOGICAL_HEIGHT, LOGICAL_WIDTH } from './config';
import type { EffectState, EnemyState, GameState, PlayerState } from './logic';

const WIDTH = LOGICAL_WIDTH;
const HEIGHT = LOGICAL_HEIGHT;
const INK = '#171717';
const GRAPHITE = '#626262';
const PAPER = '#f7f7f7';
const RULE = '#d6d6d6';
const MARGIN = '#c8c8c8';
const CHARACTER_STROKE = 4;
const CHARACTER_DETAIL_STROKE = 2;
const OBSTACLES = [
  { x: 226, width: 58 },
  { x: 676, width: 58 },
] as const;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

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

function drawArena(ctx: CanvasRenderingContext2D, playerX: number): void {
  line(ctx, 16, FLOOR_Y, WIDTH - 16, FLOOR_Y, 5);
  line(ctx, 16, FLOOR_Y + 5, WIDTH - 16, FLOOR_Y + 5, 1, GRAPHITE);
  line(ctx, 30, FLOOR_Y - 1, 30, FLOOR_Y + 17, 3);
  line(ctx, WIDTH - 30, FLOOR_Y - 1, WIDTH - 30, FLOOR_Y + 17, 3);

  for (const obstacle of OBSTACLES) {
    const centre = obstacle.x + obstacle.width / 2;
    const nearby = Math.abs(playerX - centre) <= obstacle.width + 32;
    ctx.strokeStyle = GRAPHITE;
    ctx.lineWidth = nearby ? 3 : 2;
    ctx.strokeRect(obstacle.x, FLOOR_Y - 22, obstacle.width, 22);
    line(ctx, obstacle.x + 4, FLOOR_Y - 4, obstacle.x + 22, FLOOR_Y - 18, 1, GRAPHITE);
    line(ctx, obstacle.x + 24, FLOOR_Y - 4, obstacle.x + 48, FLOOR_Y - 18, 1, GRAPHITE);
    line(ctx, obstacle.x - 7, FLOOR_Y - 3, obstacle.x - 2, FLOOR_Y - 8, nearby ? 2 : 1, GRAPHITE);
    line(ctx, obstacle.x + obstacle.width + 2, FLOOR_Y - 8, obstacle.x + obstacle.width + 7, FLOOR_Y - 3, nearby ? 2 : 1, GRAPHITE);
    if (nearby) {
      line(ctx, obstacle.x - 10, FLOOR_Y - 13, obstacle.x - 3, FLOOR_Y - 17, 2, GRAPHITE);
      line(ctx, obstacle.x + obstacle.width + 3, FLOOR_Y - 17, obstacle.x + obstacle.width + 10, FLOOR_Y - 13, 2, GRAPHITE);
    }
  }
}

interface Point {
  x: number;
  y: number;
}

function drawPlayer(ctx: CanvasRenderingContext2D, player: PlayerState, time: number, reducedMotion: boolean): void {
  const attacking = player.attackStep > 0;
  const dir = attacking ? player.attackFacing : player.facing;
  const motionScale = reducedMotion ? 0.35 : 1;
  const speedRatio = clamp(Math.abs(player.vx) / 280, 0, 1);
  const runCycle = Math.sin(time / 78);
  const attackAge = attacking ? clamp((time - player.attackStartedAt) / ATTACK_ANIMATION_MS, 0, 1) : 0;
  const anticipation = attacking ? 1 - clamp(attackAge / 0.2, 0, 1) : 0;
  const strike = attacking
    ? clamp((attackAge - 0.16) / 0.22, 0, 1) * (1 - clamp((attackAge - 0.58) / 0.42, 0, 1) * 0.35)
    : 0;
  const recovery = attacking ? clamp((attackAge - 0.5) / 0.5, 0, 1) : 0;
  const stride = runCycle * speedRatio * 18 * motionScale;
  const bounce = player.grounded
    ? (speedRatio > 0.2 ? Math.abs(runCycle) * 2.5 : Math.sin(time / 260) * 1.2) * motionScale
    : 0;
  const finisherLift = player.attackStep === 3
    ? Math.sin(Math.PI * clamp((attackAge - 0.1) / 0.9, 0, 1)) * 28 * motionScale
    : 0;
  const forwardShift = attacking
    ? dir * (-anticipation * 11 + strike * (player.attackStep === 3 ? 19 : 9)) * motionScale
    : 0;
  const bodyLean = attacking
    ? dir * ((player.attackStep === 3 ? 0.17 : 0.1) * strike - (player.attackStep === 2 ? 0.12 : 0.08) * anticipation)
    : dir * speedRatio * 0.045 * motionScale;
  const footY = player.y - bounce - finisherLift;
  const baseX = player.x + forwardShift;
  const hip: Point = { x: 0, y: -34 };
  const shoulder: Point = { x: -dir * 3, y: -74 };
  const head: Point = { x: -dir * 5, y: -102 };

  const punchHand: Point = !attacking
    ? { x: dir * 28, y: -56 }
    : player.attackStep === 1
      ? { x: dir * (20 + 44 * strike - 17 * anticipation), y: -62 - 7 * strike }
      : player.attackStep === 2
        ? { x: dir * (18 + 60 * strike - 19 * anticipation), y: -82 - 13 * strike }
        : { x: dir * (24 + 20 * strike), y: -57 - 12 * strike };
  const punchElbow: Point = !attacking
    ? { x: dir * 17, y: -54 }
    : player.attackStep === 1
      ? { x: dir * (14 + 24 * strike - 9 * anticipation), y: -53 }
      : player.attackStep === 2
        ? { x: dir * (4 + 20 * strike), y: -46 - 10 * strike }
        : { x: dir * (13 + 7 * strike), y: -58 };
  const counterElbow: Point = player.attackStep === 2
    ? { x: -dir * (17 + 11 * strike), y: -91 }
    : { x: -dir * (16 + stride * 0.18), y: -53 + recovery * 8 };
  const counterHand: Point = player.attackStep === 2
    ? { x: -dir * (31 + 16 * strike), y: -102 + recovery * 12 }
    : { x: -dir * (29 + stride * 0.26), y: -35 + recovery * 10 };

  ctx.save();
  ctx.translate(baseX, footY);
  ctx.rotate(bodyLean);
  ctx.globalAlpha = time < player.invulnerableUntil && Math.floor(time / 80) % 2 === 1 ? 0.42 : 1;

  if (player.attackStep === 3) {
    const supportKnee: Point = { x: -dir * 13, y: -13 };
    const supportFoot: Point = { x: -dir * 22, y: 0 };
    const kickKnee: Point = { x: dir * (22 + 9 * strike), y: -52 - 12 * strike };
    const kickFoot: Point = { x: dir * (53 + 64 * strike), y: -65 - 29 * strike };
    line(ctx, hip.x, hip.y, supportKnee.x, supportKnee.y, CHARACTER_STROKE);
    line(ctx, supportKnee.x, supportKnee.y, supportFoot.x, supportFoot.y, CHARACTER_STROKE);
    line(ctx, hip.x, hip.y, kickKnee.x, kickKnee.y, CHARACTER_STROKE);
    line(ctx, kickKnee.x, kickKnee.y, kickFoot.x, kickFoot.y, CHARACTER_STROKE);
    if (strike > 0.18) {
      line(ctx, kickFoot.x - dir * 25, kickFoot.y + 10, kickFoot.x - dir * 65, kickFoot.y + 20, CHARACTER_DETAIL_STROKE, GRAPHITE);
      line(ctx, kickFoot.x - dir * 22, kickFoot.y + 18, kickFoot.x - dir * 52, kickFoot.y + 35, CHARACTER_DETAIL_STROKE, GRAPHITE);
    }
  } else {
    const frontKnee: Point = { x: dir * (15 + stride * 0.42), y: -12 - anticipation * 8 };
    const frontFoot: Point = { x: dir * (25 + stride * 0.7), y: 0 };
    const backKnee: Point = { x: -dir * (15 - stride * 0.42), y: -11 + anticipation * 8 };
    const backFoot: Point = { x: -dir * (25 - stride * 0.7), y: 0 };
    line(ctx, hip.x, hip.y, frontKnee.x, frontKnee.y, CHARACTER_STROKE);
    line(ctx, frontKnee.x, frontKnee.y, frontFoot.x, frontFoot.y, CHARACTER_STROKE);
    line(ctx, hip.x, hip.y, backKnee.x, backKnee.y, CHARACTER_STROKE);
    line(ctx, backKnee.x, backKnee.y, backFoot.x, backFoot.y, CHARACTER_STROKE);
  }

  line(ctx, head.x, head.y + 16, hip.x, hip.y, CHARACTER_STROKE);
  circle(ctx, head.x, head.y, 16, CHARACTER_STROKE);
  line(ctx, shoulder.x, shoulder.y, counterElbow.x, counterElbow.y, CHARACTER_STROKE);
  line(ctx, counterElbow.x, counterElbow.y, counterHand.x, counterHand.y, CHARACTER_STROKE);
  line(ctx, shoulder.x, shoulder.y, punchElbow.x, punchElbow.y, CHARACTER_STROKE);
  line(ctx, punchElbow.x, punchElbow.y, punchHand.x, punchHand.y, CHARACTER_STROKE);

  if (attacking && strike > 0.16 && player.attackStep < 3) {
    line(ctx, punchHand.x - dir * 20, punchHand.y + 5, punchHand.x - dir * 50, punchHand.y + 10, CHARACTER_DETAIL_STROKE, GRAPHITE);
    line(ctx, punchHand.x - dir * 12, punchHand.y + 13, punchHand.x - dir * 34, punchHand.y + 22, CHARACTER_DETAIL_STROKE, GRAPHITE);
  }
  ctx.restore();
}

/** Draw only the controllable stickman, useful for isolated pose previews. */
export function drawStickMan(ctx: CanvasRenderingContext2D, state: GameState, _reducedMotion = false): void {
  drawPlayer(ctx, state.player, state.time, _reducedMotion);
}

function drawEnemy(ctx: CanvasRenderingContext2D, enemy: EnemyState, time: number): void {
  const scale = enemy.kind === 'boss' ? 1.55 : enemy.kind === 'blocker' ? 1.18 : 1;
  const footY = enemy.y;
  const headY = footY - 92 * scale;
  const torsoY = footY - 47 * scale;
  const dir = enemy.facing;
  const stunned = time < enemy.stunUntil;
  const stunAmount = stunned ? clamp((enemy.stunUntil - time) / HIT_STUN_MS, 0, 1) : 0;
  const knockDirection = enemy.vx < 0 ? -1 : 1;
  const lift = stunAmount * 18;
  const characterStroke = CHARACTER_STROKE / scale;
  const characterDetailStroke = CHARACTER_DETAIL_STROKE / scale;
  ctx.save();
  ctx.translate(enemy.x, footY - lift);
  ctx.rotate(knockDirection * stunAmount * 0.3);
  ctx.scale(scale, scale);
  ctx.translate(-enemy.x, -footY);
  ctx.globalAlpha = stunned ? 0.6 : 1;
  if (stunned) {
    line(ctx, enemy.x - knockDirection * 26, footY - 44, enemy.x - knockDirection * 54, footY - 52, characterDetailStroke, GRAPHITE);
    line(ctx, enemy.x - knockDirection * 22, footY - 29, enemy.x - knockDirection * 44, footY - 23, characterDetailStroke, GRAPHITE);
  }
  circle(ctx, enemy.x, headY, 15, characterStroke);
  line(ctx, enemy.x, headY + 15, enemy.x, torsoY, characterStroke);
  line(ctx, enemy.x, torsoY, enemy.x + dir * 18, footY, characterStroke);
  line(ctx, enemy.x, torsoY, enemy.x - dir * 18, footY, characterStroke);

  if (enemy.kind === 'runner') {
    line(ctx, enemy.x, headY + 39, enemy.x + dir * 31, headY + 48, characterStroke);
    line(ctx, enemy.x + dir * 19, footY - 25, enemy.x + dir * 44, footY - 7, characterDetailStroke, GRAPHITE);
  } else if (enemy.kind === 'blocker') {
    ctx.strokeStyle = INK;
    ctx.lineWidth = characterStroke;
    ctx.strokeRect(enemy.x + (dir < 0 ? -26 : 3), torsoY - 8, 23, 35);
    line(ctx, enemy.x + dir * 8, headY + 37, enemy.x + dir * 30, headY + 40, characterStroke);
  } else if (enemy.kind === 'kicker') {
    line(ctx, enemy.x, headY + 38, enemy.x + dir * 30, headY + 24, characterStroke);
    line(ctx, enemy.x + dir * 18, footY - 25, enemy.x + dir * 42, footY - 54, characterStroke);
    if (enemy.telegraph > 0) {
      ctx.setLineDash([5, 5]);
      line(ctx, enemy.x + dir * 38, footY - 54, enemy.x + dir * 92, footY - 72, characterDetailStroke, GRAPHITE);
      ctx.setLineDash([]);
    }
  } else {
    ctx.strokeStyle = INK;
    ctx.lineWidth = characterStroke;
    ctx.strokeRect(enemy.x - 22, headY - 20, 44, 38);
    line(ctx, enemy.x - 28, torsoY - 10, enemy.x + 28, torsoY - 10, characterStroke);
    line(ctx, enemy.x - 31, torsoY + 10, enemy.x + 31, torsoY + 10, characterDetailStroke, GRAPHITE);
  }

  drawDamageHatching(ctx, enemy.x, headY, 30, 1 - enemy.hp / Math.max(1, enemy.maxHp), characterDetailStroke);
  if (enemy.telegraph > 0) drawTelegraph(ctx, enemy.x, footY - 50 * scale, enemy.kind, enemy.telegraph);
  ctx.restore();
}

function drawDamageHatching(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, damage: number, stroke: number): void {
  const count = Math.ceil(Math.max(0, damage) * 6);
  for (let index = 0; index < count; index += 1) {
    const offset = index * 6 - size / 2;
    line(ctx, x + offset, y + 13, x + offset + 11, y + 25, stroke, GRAPHITE);
  }
}

function drawTelegraph(ctx: CanvasRenderingContext2D, x: number, y: number, kind: EnemyState['kind'], amount: number): void {
  const pulse = clamp(amount, 0, 1);
  ctx.save();
  ctx.globalAlpha = 0.45 + pulse * 0.4;
  ctx.strokeStyle = GRAPHITE;
  ctx.lineWidth = kind === 'boss' ? 4 : 2;
  if (kind === 'runner') {
    line(ctx, x - 35, y + 16, x - 60, y + 8, 2, GRAPHITE);
    line(ctx, x + 35, y + 16, x + 60, y + 8, 2, GRAPHITE);
  } else if (kind === 'blocker') {
    ctx.strokeRect(x - 31, y - 32, 62, 64);
  } else if (kind === 'kicker') {
    ctx.setLineDash([5, 5]);
    line(ctx, x - 54, y + 12, x + 54, y - 42, 2, GRAPHITE);
    ctx.setLineDash([]);
  } else {
    ctx.beginPath();
    ctx.ellipse(x, y + 42, 54 + pulse * 11, 12 + pulse * 5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawEffects(ctx: CanvasRenderingContext2D, effects: EffectState[], reducedMotion: boolean): void {
  for (const effect of effects) {
    if (reducedMotion && effect.kind === 'page-shift') continue;
    const shortenedLife = reducedMotion ? effect.life - effect.maxLife * 0.5 : effect.life;
    const ratio = Math.max(0, Math.min(1, shortenedLife / Math.max(1, effect.maxLife * (reducedMotion ? 0.5 : 1))));
    if (ratio <= 0) continue;
    const size = effect.strength * 24 * (reducedMotion ? 0.55 : 1) * (0.55 + ratio * 0.45);
    ctx.save();
    ctx.globalAlpha = ratio;
    if (effect.kind === 'dust') {
      for (let dot = 0; dot < 6; dot += 1) {
        const spread = (dot - 2.5) * size * 0.38;
        inkDot(ctx, effect.x + spread, effect.y - 2 - Math.abs(dot - 2.5) * 2, Math.max(1, size / 14));
      }
      ctx.strokeStyle = GRAPHITE;
      ctx.beginPath();
      ctx.ellipse(effect.x, effect.y + 1, size * 0.9, Math.max(2, size * 0.16), 0, Math.PI, Math.PI * 2);
      ctx.lineWidth = 1.5;
      ctx.stroke();
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

function drawHitStopCue(ctx: CanvasRenderingContext2D, state: GameState, reducedMotion: boolean): void {
  if (state.hitStopMs <= 0) return;
  const impact = [...state.effects].reverse().find((effect) => effect.kind === 'impact');
  if (!impact) return;
  const strength = reducedMotion ? 0.55 : 1;
  ctx.save();
  ctx.globalAlpha = 0.75 * strength;
  circle(ctx, impact.x, impact.y, 18 * impact.strength, 2.5);
  circle(ctx, impact.x, impact.y, 25 * impact.strength, 1);
  ctx.restore();
}

function cameraOffset(state: GameState, reducedMotion: boolean): number {
  if (reducedMotion) return 0;
  const positionLead = -(state.player.x - WIDTH / 2) * 0.025;
  const velocityLead = -clamp(state.player.vx / 280, -1, 1) * 8;
  return clamp(positionLead + velocityLead, -12, 12);
}

/** Draw the complete 960x540 notebook brawler scene without mutating gameplay state. */
export function drawNotebookScene(ctx: CanvasRenderingContext2D, state: GameState, reducedMotion = false): void {
  const pageShift = reducedMotion
    ? 0
    : state.effects.reduce((shift, effect) => effect.kind === 'page-shift' ? shift + lifeRatio(effect) * effect.strength * 0.08 : shift, 0);
  ctx.save();
  ctx.translate(pageShift, pageShift * 0.32);
  drawPaper(ctx);
  ctx.translate(cameraOffset(state, reducedMotion), 0);
  drawArena(ctx, state.player.x);
  for (const enemy of state.enemies) drawEnemy(ctx, enemy, state.time);
  drawStickMan(ctx, state, reducedMotion);
  drawEffects(ctx, state.effects, reducedMotion);
  drawHitStopCue(ctx, state, reducedMotion);

  ctx.restore();
}
