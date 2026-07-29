import { BaseEngine } from '../base';
import { ARCADE, drawRoundRect, pointerPos } from '../canvas';
import { sfx } from '../../core/sound';
import { circleRectOverlap, fallSpeed, spawnMs } from './logic';
import type { Obstacle } from './logic';

export class DodgeEngine extends BaseEngine {
  private px = 240; private targetX = 240; private readonly py = 640; private readonly pr = 16;
  private obstacles: Obstacle[] = []; private spawnTimer = 0; private invuln = 0; private keyDir = 0;
  private onMove = (e: PointerEvent) => { this.targetX = pointerPos(this.canvas, e, this.w, this.h).x; };
  private onKeyDown = (e: KeyboardEvent) => { if (e.key === 'ArrowLeft') this.keyDir = -1; if (e.key === 'ArrowRight') this.keyDir = 1; };
  private onKeyUp = (e: KeyboardEvent) => { if (e.key === 'ArrowLeft' && this.keyDir === -1) this.keyDir = 0; if (e.key === 'ArrowRight' && this.keyDir === 1) this.keyDir = 0; };
  protected setup(): void { this.levelEvery = 10; this.canvas.addEventListener('pointermove', this.onMove); this.canvas.addEventListener('pointerdown', this.onMove); window.addEventListener('keydown', this.onKeyDown); window.addEventListener('keyup', this.onKeyUp); }
  protected teardown(): void { this.canvas.removeEventListener('pointermove', this.onMove); this.canvas.removeEventListener('pointerdown', this.onMove); window.removeEventListener('keydown', this.onKeyDown); window.removeEventListener('keyup', this.onKeyUp); }
  protected update(dt: number): void {
    if (this.keyDir !== 0) this.targetX = this.px + this.keyDir * 0.45 * dt * 1.4;
    this.px += (this.targetX - this.px) * Math.min(1, dt / 80); this.px = Math.max(this.pr, Math.min(this.w - this.pr, this.px)); this.invuln = Math.max(0, this.invuln - dt);
    this.spawnTimer += dt;
    if (this.spawnTimer >= spawnMs(this.level)) { this.spawnTimer = 0; const w = 40 + this.rand() * 60; this.obstacles.push({ x: this.rand() * (this.w - w), y: -30, w, h: 22, scored: false }); }
    const speed = fallSpeed(this.level);
    for (let i = this.obstacles.length - 1; i >= 0; i -= 1) {
      const obstacle = this.obstacles[i]; obstacle.y += (speed / 1000) * dt;
      if (!obstacle.scored && obstacle.y > this.py + this.pr) { obstacle.scored = true; this.success(5); }
      if (obstacle.y > this.h + 40) this.obstacles.splice(i, 1);
      else if (this.invuln <= 0 && circleRectOverlap(this.px, this.py, this.pr, obstacle)) { sfx.play('bad'); this.fail(); if (this.isFinished) return; this.invuln = 1200; }
    }
  }
  protected draw(): void {
    const c = this.ctx; c.fillStyle = ARCADE.bg; c.fillRect(0, 0, this.w, this.h); for (const obstacle of this.obstacles) drawRoundRect(c, obstacle, 8, ARCADE.yellow);
    if (this.invuln > 0 && Math.floor(this.invuln / 100) % 2 === 0) return;
    c.beginPath(); c.arc(this.px, this.py, this.pr, 0, Math.PI * 2); c.fillStyle = ARCADE.green; c.fill(); c.fillStyle = ARCADE.bg; c.fillRect(this.px - 6, this.py - 5, 3, 6); c.fillRect(this.px + 3, this.py - 5, 3, 6);
  }
}
