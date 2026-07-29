import { BaseEngine } from '../base';
import { ARCADE, centerText, drawRoundRect, inRect, pointerPos } from '../canvas';
import type { Rect } from '../canvas';
import { sfx } from '../../core/sound';
import { extendSequence, playbackMs } from './logic';

const PAD_COLORS = [ARCADE.green, ARCADE.pink, ARCADE.yellow, ARCADE.blue];

type SimonState = 'show' | 'input' | 'gap';

export class SimonEngine extends BaseEngine {
  private seq: number[] = [];
  private state: SimonState = 'gap';
  private showIdx = 0;
  private inputIdx = 0;
  private stepTimer = 0;
  private litPad = -1;
  private pads: Rect[] = [];

  private onPointer = (e: PointerEvent) => {
    if (!this.isRunning || this.state !== 'input') return;
    const { x, y } = pointerPos(this.canvas, e, this.w, this.h);
    const i = this.pads.findIndex((p) => inRect(x, y, p));
    if (i >= 0) this.press(i);
  };

  private onKey = (e: KeyboardEvent) => {
    if (!this.isRunning || this.state !== 'input') return;
    const i = ['1', '2', '3', '4'].indexOf(e.key);
    if (i >= 0) this.press(i);
  };

  protected setup(): void {
    this.levelEvery = 3;
    const s = 190;
    const gap = 26;
    const x0 = (this.w - s * 2 - gap) / 2;
    const y0 = 160;
    this.pads = [
      { x: x0, y: y0, w: s, h: s },
      { x: x0 + s + gap, y: y0, w: s, h: s },
      { x: x0, y: y0 + s + gap, w: s, h: s },
      { x: x0 + s + gap, y: y0 + s + gap, w: s, h: s },
    ];
    this.seq = extendSequence([], this.rand);
    this.state = 'gap';
    this.stepTimer = 600;
    this.canvas.addEventListener('pointerdown', this.onPointer);
    window.addEventListener('keydown', this.onKey);
  }

  protected teardown(): void {
    this.canvas.removeEventListener('pointerdown', this.onPointer);
    window.removeEventListener('keydown', this.onKey);
  }

  private press(i: number): void {
    this.litPad = i;
    this.stepTimer = 180;
    if (i === this.seq[this.inputIdx]) {
      sfx.play('tap');
      this.inputIdx += 1;
      if (this.inputIdx >= this.seq.length) {
        sfx.play('good');
        this.success(this.seq.length * 30);
        this.seq = extendSequence(this.seq, this.rand);
        this.state = 'gap';
        this.stepTimer = 700;
      }
    } else {
      sfx.play('bad');
      this.fail();
      if (this.isFinished) return;
      this.state = 'gap';
      this.stepTimer = 900;
    }
  }

  protected update(dt: number): void {
    this.stepTimer -= dt;
    if (this.stepTimer > 0) return;
    if (this.state === 'gap') {
      this.state = 'show';
      this.showIdx = 0;
      this.litPad = this.seq[0];
      this.stepTimer = playbackMs(this.seq.length);
    } else if (this.state === 'show') {
      this.showIdx += 1;
      if (this.showIdx >= this.seq.length) {
        this.state = 'input';
        this.inputIdx = 0;
        this.litPad = -1;
      } else {
        this.litPad = this.seq[this.showIdx];
        this.stepTimer = playbackMs(this.seq.length);
      }
    } else {
      this.litPad = -1;
    }
  }

  protected draw(): void {
    const c = this.ctx;
    c.fillStyle = ARCADE.bg;
    c.fillRect(0, 0, this.w, this.h);
    centerText(c, `R${this.seq.length}`, this.w / 2, 90, '28px "Press Start 2P", monospace', ARCADE.white);
    this.pads.forEach((p, i) => {
      const lit = this.litPad === i && (this.state === 'show' || this.stepTimer > 0);
      c.globalAlpha = lit ? 1 : 0.35;
      drawRoundRect(c, p, 24, PAD_COLORS[i]);
      c.globalAlpha = 1;
    });
    if (this.state === 'input') {
      centerText(c, `${this.inputIdx}/${this.seq.length}`, this.w / 2, 640, '16px "Press Start 2P", monospace', ARCADE.dim);
    }
  }
}
