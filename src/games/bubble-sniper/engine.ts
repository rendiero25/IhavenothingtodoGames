import { BaseEngine } from '../base';
import { ARCADE, pointerPos } from '../canvas';
import { sfx } from '../../core/sound';
import { bubbleHitRadius, bubbleRadius, bubbleSpeed, hitPoints, skullChance, spawnMs } from './logic';
import type { Bubble } from './logic';

export class BubbleSniperEngine extends BaseEngine {
  private bubbles: Bubble[] = [];
  private spawnTimer = 0;
  private nextDir: 1 | -1 = 1;
  private onPointer = (e: PointerEvent) => {
    if (!this.isRunning) return;
    const { x, y } = pointerPos(this.canvas, e, this.w, this.h);
    const bounds = this.canvas.getBoundingClientRect();
    for (let i = this.bubbles.length - 1; i >= 0; i -= 1) {
      const bubble = this.bubbles[i];
      const hitRadius = bubbleHitRadius(bubble.r, bounds.width, bounds.height);
      if ((x - bubble.x) ** 2 + (y - this.yOf(bubble)) ** 2 <= hitRadius ** 2) {
        this.bubbles.splice(i, 1);
        if (bubble.skull) { sfx.play('bad'); this.fail(); } else { sfx.play('good'); this.success(hitPoints(this.level)); }
        return;
      }
    }
  };
  private yOf(bubble: Bubble): number { return bubble.baseY + 28 * Math.sin(bubble.phase + bubble.x * 0.02); }
  protected setup(): void { this.canvas.addEventListener('pointerdown', this.onPointer); }
  protected teardown(): void { this.canvas.removeEventListener('pointerdown', this.onPointer); }
  protected update(dt: number): void {
    this.spawnTimer += dt;
    if (this.spawnTimer >= spawnMs(this.level)) {
      this.spawnTimer = 0;
      const r = bubbleRadius(this.level); const dir = this.nextDir; this.nextDir = dir === 1 ? -1 : 1;
      this.bubbles.push({ x: dir === 1 ? -r : this.w + r, baseY: 110 + this.rand() * (this.h - 260), dir, phase: this.rand() * Math.PI * 2, r, skull: this.rand() < skullChance(this.level) });
    }
    const velocity = bubbleSpeed(this.level);
    for (let i = this.bubbles.length - 1; i >= 0; i -= 1) {
      const bubble = this.bubbles[i]; bubble.x += ((bubble.dir * velocity) / 1000) * dt; bubble.phase += dt * 0.004;
      const out = bubble.dir === 1 ? bubble.x > this.w + bubble.r : bubble.x < -bubble.r;
      if (out) { this.bubbles.splice(i, 1); if (!bubble.skull) { sfx.play('bad'); this.fail(); if (this.isFinished) return; } }
    }
  }
  protected draw(): void {
    const c = this.ctx; c.fillStyle = ARCADE.bg; c.fillRect(0, 0, this.w, this.h);
    for (const bubble of this.bubbles) {
      const y = this.yOf(bubble); c.beginPath(); c.arc(bubble.x, y, bubble.r, 0, Math.PI * 2); c.fillStyle = ARCADE.bgSoft; c.fill(); c.lineWidth = 4; c.strokeStyle = bubble.skull ? ARCADE.pink : ARCADE.blue; c.stroke();
      if (bubble.skull) { c.fillStyle = ARCADE.pink; c.fillRect(bubble.x - bubble.r * 0.45, y - 3, bubble.r * 0.3, 3); c.fillRect(bubble.x + bubble.r * 0.15, y - 3, bubble.r * 0.3, 3); }
      else { c.beginPath(); c.arc(bubble.x - bubble.r * 0.3, y - bubble.r * 0.3, Math.max(2, bubble.r * 0.18), 0, Math.PI * 2); c.fillStyle = ARCADE.white; c.fill(); }
    }
  }
}
