import { BaseEngine } from '../base';
import { ARCADE, centerText, drawRoundRect, inRect, pointerPos } from '../canvas';
import type { Rect } from '../canvas';
import { sfx } from '../../core/sound';
import { makeNumQ, numTimeMs } from './logic';
import type { NumQ } from './logic';

export class MissingNumberEngine extends BaseEngine {
  private q!: NumQ;
  private timeLeft = 0;
  private optionRects: Rect[] = [];

  private onPointer = (e: PointerEvent) => {
    if (!this.isRunning) return;
    const { x, y } = pointerPos(this.canvas, e, this.w, this.h);
    const i = this.optionRects.findIndex((r) => inRect(x, y, r));
    if (i >= 0) this.answer(i);
  };

  private onKey = (e: KeyboardEvent) => {
    if (!this.isRunning) return;
    const i = ['1', '2', '3'].indexOf(e.key);
    if (i >= 0) this.answer(i);
  };

  protected setup(): void {
    this.levelEvery = 5;
    this.optionRects = [0, 1, 2].map((i) => ({ x: 40 + i * 140, y: 540, w: 120, h: 110 }));
    this.next();
    this.canvas.addEventListener('pointerdown', this.onPointer);
    window.addEventListener('keydown', this.onKey);
  }

  protected teardown(): void {
    this.canvas.removeEventListener('pointerdown', this.onPointer);
    window.removeEventListener('keydown', this.onKey);
  }

  private next(): void {
    this.q = makeNumQ(this.rand, this.level);
    this.timeLeft = numTimeMs(this.level);
  }

  private answer(i: number): void {
    if (this.q.options[i] === this.q.answer) {
      sfx.play('good');
      this.success(25 + Math.ceil(this.timeLeft / 300));
    } else {
      sfx.play('bad');
      this.fail();
      if (this.isFinished) return;
    }
    this.next();
  }

  protected update(dt: number): void {
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      sfx.play('bad');
      this.fail();
      if (this.isFinished) return;
      this.next();
    }
  }

  protected draw(): void {
    const c = this.ctx;
    c.fillStyle = ARCADE.bg;
    c.fillRect(0, 0, this.w, this.h);
    const frac = Math.max(0, this.timeLeft / numTimeMs(this.level));
    drawRoundRect(c, { x: 40, y: 60, w: 400, h: 14 }, 7, ARCADE.bgSoft);
    drawRoundRect(c, { x: 40, y: 60, w: 400 * frac, h: 14 }, 7, frac < 0.3 ? ARCADE.pink : ARCADE.yellow);
    const n = this.q.display.length;
    const bw = Math.min(90, (this.w - 60) / n - 10);
    const totalW = n * (bw + 10) - 10;
    const x0 = (this.w - totalW) / 2;
    this.q.display.forEach((v, i) => {
      const r: Rect = { x: x0 + i * (bw + 10), y: 260, w: bw, h: 80 };
      drawRoundRect(c, r, 14, v === null ? ARCADE.bgSoft : ARCADE.bg, v === null ? ARCADE.yellow : ARCADE.dim);
      centerText(c, v === null ? '?' : String(v), r.x + bw / 2, 300, '22px "Press Start 2P", monospace', v === null ? ARCADE.yellow : ARCADE.white);
    });
    this.q.options.forEach((o, i) => {
      const r = this.optionRects[i];
      drawRoundRect(c, r, 16, ARCADE.bgSoft, ARCADE.blue);
      centerText(c, String(o), r.x + r.w / 2, r.y + 58, '22px "Press Start 2P", monospace', ARCADE.blue);
    });
  }
}
