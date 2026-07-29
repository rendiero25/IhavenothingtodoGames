import { BaseEngine } from '../base';
import { ARCADE, pointerPos } from '../canvas';
import { sfx } from '../../core/sound';
import { decoyChance, spawnInterval, targetHitRadius, targetPoints, targetTtl } from './logic';
import type { TapTarget } from './logic';

export class TapPanicEngine extends BaseEngine {
  private targets: TapTarget[] = [];
  private spawnTimer = 0;
  private onPointer = (e: PointerEvent) => {
    if (!this.isRunning) return;
    const { x, y } = pointerPos(this.canvas, e, this.w, this.h);
    const bounds = this.canvas.getBoundingClientRect();
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      const remaining = 1 - t.age / t.ttl;
      const r = t.r0 * (0.35 + 0.65 * remaining);
      const hitRadius = targetHitRadius(r, bounds.width, bounds.height);
      if ((x - t.x) ** 2 + (y - t.y) ** 2 <= hitRadius ** 2) {
        this.targets.splice(i, 1);
        if (t.decoy) {
          sfx.play('bad');
          this.fail();
        } else {
          sfx.play('good');
          this.success(targetPoints(remaining));
        }
        return;
      }
    }
  };

  protected setup(): void {
    this.canvas.addEventListener('pointerdown', this.onPointer);
  }

  protected teardown(): void {
    this.canvas.removeEventListener('pointerdown', this.onPointer);
  }

  protected update(dt: number): void {
    this.spawnTimer += dt;
    if (this.spawnTimer >= spawnInterval(this.level)) {
      this.spawnTimer = 0;
      this.targets.push({
        x: 60 + this.rand() * (this.w - 120),
        y: 80 + this.rand() * (this.h - 160),
        age: 0,
        ttl: targetTtl(this.level),
        r0: 42,
        decoy: this.rand() < decoyChance(this.level),
      });
    }
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      t.age += dt;
      if (t.age >= t.ttl) {
        this.targets.splice(i, 1);
        if (!t.decoy) {
          sfx.play('bad');
          this.fail();
          if (this.isFinished) return;
        }
      }
    }
  }

  protected draw(): void {
    const c = this.ctx;
    c.fillStyle = ARCADE.bg;
    c.fillRect(0, 0, this.w, this.h);
    for (const t of this.targets) {
      const remaining = 1 - t.age / t.ttl;
      const r = t.r0 * (0.35 + 0.65 * remaining);
      c.beginPath();
      c.arc(t.x, t.y, r, 0, Math.PI * 2);
      c.fillStyle = ARCADE.bgSoft;
      c.fill();
      c.lineWidth = 4;
      c.strokeStyle = t.decoy ? ARCADE.pink : ARCADE.green;
      c.stroke();
      if (t.decoy) {
        c.strokeStyle = ARCADE.pink;
        c.lineWidth = 3;
        const k = r * 0.4;
        c.beginPath();
        c.moveTo(t.x - k, t.y - k);
        c.lineTo(t.x + k, t.y + k);
        c.moveTo(t.x + k, t.y - k);
        c.lineTo(t.x - k, t.y + k);
        c.stroke();
      } else {
        c.beginPath();
        c.arc(t.x, t.y, Math.max(2, r * remaining * 0.5), 0, Math.PI * 2);
        c.fillStyle = ARCADE.green;
        c.fill();
      }
    }
  }
}
