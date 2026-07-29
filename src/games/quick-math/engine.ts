import { BaseEngine } from '../base';
import { ARCADE, centerText, drawRoundRect, inRect, pointerPos } from '../canvas';
import type { Rect } from '../canvas';
import { sfx } from '../../core/sound';
import { makeQuestion, questionTimeMs } from './logic';
import type { MathQ } from './logic';

export class QuickMathEngine extends BaseEngine {
  private q!: MathQ;
  private timeLeft = 0;
  private falseBtn: Rect = { x: 30, y: 560, w: 195, h: 110 };
  private trueBtn: Rect = { x: 255, y: 560, w: 195, h: 110 };

  private onPointer = (e: PointerEvent) => {
    if (!this.isRunning) return;
    const { x, y } = pointerPos(this.canvas, e, this.w, this.h);
    if (inRect(x, y, this.trueBtn)) this.answer(true);
    else if (inRect(x, y, this.falseBtn)) this.answer(false);
  };

  private onKey = (e: KeyboardEvent) => {
    if (!this.isRunning) return;
    if (e.key === 'ArrowRight') this.answer(true);
    if (e.key === 'ArrowLeft') this.answer(false);
  };

  protected setup(): void {
    this.q = makeQuestion(this.rand, this.level);
    this.timeLeft = questionTimeMs(this.level);
    this.canvas.addEventListener('pointerdown', this.onPointer);
    window.addEventListener('keydown', this.onKey);
  }

  protected teardown(): void {
    this.canvas.removeEventListener('pointerdown', this.onPointer);
    window.removeEventListener('keydown', this.onKey);
  }

  private answer(v: boolean): void {
    if (v === this.q.truth) {
      sfx.play('good');
      this.success(15 + Math.ceil(this.timeLeft / 250));
    } else {
      sfx.play('bad');
      this.fail();
      if (this.isFinished) return;
    }
    this.next();
  }

  private next(): void {
    this.q = makeQuestion(this.rand, this.level);
    this.timeLeft = questionTimeMs(this.level);
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
    const labels = this.opts.locale === 'id' ? ['SALAH', 'BENAR'] : ['FALSE', 'TRUE'];
    c.fillStyle = ARCADE.bg;
    c.fillRect(0, 0, this.w, this.h);
    const frac = Math.max(0, this.timeLeft / questionTimeMs(this.level));
    drawRoundRect(c, { x: 40, y: 60, w: 400, h: 14 }, 7, ARCADE.bgSoft);
    drawRoundRect(c, { x: 40, y: 60, w: 400 * frac, h: 14 }, 7, frac < 0.3 ? ARCADE.pink : ARCADE.yellow);
    centerText(c, `${this.q.a} ${this.q.op} ${this.q.b}`, this.w / 2, 280, '64px "Press Start 2P", monospace', ARCADE.white);
    centerText(c, `= ${this.q.shown}`, this.w / 2, 380, '54px "Press Start 2P", monospace', ARCADE.blue);
    drawRoundRect(c, this.falseBtn, 18, ARCADE.bgSoft, ARCADE.pink);
    drawRoundRect(c, this.trueBtn, 18, ARCADE.bgSoft, ARCADE.green);
    centerText(c, labels[0], this.falseBtn.x + this.falseBtn.w / 2, this.falseBtn.y + 55, '20px "Press Start 2P", monospace', ARCADE.pink);
    centerText(c, labels[1], this.trueBtn.x + this.trueBtn.w / 2, this.trueBtn.y + 55, '20px "Press Start 2P", monospace', ARCADE.green);
  }
}
