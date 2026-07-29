import { BaseEngine } from '../base';
import { ARCADE, centerText, drawRoundRect, inRect, pointerPos } from '../canvas';
import type { Rect } from '../canvas';
import { sfx } from '../../core/sound';
import { pickWord, scramble, wordLenForLevel, wordTimeMs } from './logic';
import { WORDS_ID } from './words-id';
import { WORDS_EN } from './words-en';

interface Tile { letter: string; taken: boolean; rect: Rect; }

export class WordScrambleEngine extends BaseEngine {
  private word = '';
  private tiles: Tile[] = [];
  private progress = 0;
  private timeLeft = 0;
  private onPointer = (e: PointerEvent) => {
    if (!this.isRunning) return;
    const { x, y } = pointerPos(this.canvas, e, this.w, this.h);
    const tile = this.tiles.find((t) => !t.taken && inRect(x, y, t.rect));
    if (tile) this.tryLetter(tile);
  };
  private onKey = (e: KeyboardEvent) => {
    if (!this.isRunning || e.key.length !== 1) return;
    const tile = this.tiles.find((t) => !t.taken && t.letter === e.key.toLowerCase());
    if (tile) this.tryLetter(tile);
  };
  protected setup(): void { this.levelEvery = 4; this.nextWord(); this.canvas.addEventListener('pointerdown', this.onPointer); window.addEventListener('keydown', this.onKey); }
  protected teardown(): void { this.canvas.removeEventListener('pointerdown', this.onPointer); window.removeEventListener('keydown', this.onKey); }
  private nextWord(): void {
    const list = this.opts.locale === 'id' ? WORDS_ID : WORDS_EN;
    this.word = pickWord(this.rand, list, wordLenForLevel(this.level));
    const letters = scramble(this.rand, this.word);
    const size = 56; const gap = 10; const x0 = (this.w - (letters.length * (size + gap) - gap)) / 2;
    this.tiles = letters.map((letter, i) => ({ letter, taken: false, rect: { x: x0 + i * (size + gap), y: 400, w: size, h: size } }));
    this.progress = 0; this.timeLeft = wordTimeMs(this.level);
  }
  private tryLetter(tile: Tile): void {
    if (tile.letter === this.word[this.progress]) {
      sfx.play('tap'); tile.taken = true; this.progress += 1;
      if (this.progress >= this.word.length) { sfx.play('good'); this.success(this.word.length * 25 + Math.ceil(this.timeLeft / 300)); this.nextWord(); }
      return;
    }
    sfx.play('bad'); this.fail();
    if (this.isFinished) return;
    this.tiles.forEach((t) => { t.taken = false; }); this.progress = 0;
  }
  protected update(dt: number): void { this.timeLeft -= dt; if (this.timeLeft <= 0) { sfx.play('bad'); this.fail(); if (!this.isFinished) this.nextWord(); } }
  protected draw(): void {
    const c = this.ctx; c.fillStyle = ARCADE.bg; c.fillRect(0, 0, this.w, this.h);
    const frac = Math.max(0, this.timeLeft / wordTimeMs(this.level));
    drawRoundRect(c, { x: 40, y: 60, w: 400, h: 14 }, 7, ARCADE.bgSoft); drawRoundRect(c, { x: 40, y: 60, w: 400 * frac, h: 14 }, 7, frac < 0.3 ? ARCADE.pink : ARCADE.yellow);
    const slotW = 44; const gap = 8; const x0 = (this.w - (this.word.length * (slotW + gap) - gap)) / 2;
    for (let i = 0; i < this.word.length; i += 1) { const r: Rect = { x: x0 + i * (slotW + gap), y: 230, w: slotW, h: 56 }; drawRoundRect(c, r, 10, ARCADE.bgSoft, i < this.progress ? ARCADE.green : ARCADE.dim); if (i < this.progress) centerText(c, this.word[i].toUpperCase(), r.x + slotW / 2, r.y + 30, '20px "Press Start 2P", monospace', ARCADE.green); }
    for (const tile of this.tiles) { c.globalAlpha = tile.taken ? 0.2 : 1; drawRoundRect(c, tile.rect, 12, ARCADE.bgSoft, ARCADE.yellow); centerText(c, tile.letter.toUpperCase(), tile.rect.x + tile.rect.w / 2, tile.rect.y + 30, '22px "Press Start 2P", monospace', ARCADE.yellow); c.globalAlpha = 1; }
  }
}
