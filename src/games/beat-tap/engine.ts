import { BaseEngine } from '../base';
import { ARCADE, centerText } from '../canvas';
import { sfx } from '../../core/sound';
import { bpmForLevel, judge, makeBar } from './logic';

interface Note { time: number; judged: boolean; }
const TRAVEL_MS = 1400;
const MISS_MS = 130;

export class BeatTapEngine extends BaseEngine {
  private notes: Note[] = [];
  private nextBarAt = 1600;
  private flash = '';
  private flashUntil = 0;
  private readonly hitY = 560;
  private onTap = () => { if (this.isRunning) this.tryHit(); };
  private onKey = (e: KeyboardEvent) => { if (!this.isRunning || e.repeat || e.key !== ' ') return; e.preventDefault(); this.tryHit(); };
  protected setup(): void { this.canvas.addEventListener('pointerdown', this.onTap); window.addEventListener('keydown', this.onKey); }
  protected teardown(): void { this.canvas.removeEventListener('pointerdown', this.onTap); window.removeEventListener('keydown', this.onKey); }
  private tryHit(): void {
    let best: Note | null = null;
    for (const note of this.notes) if (!note.judged && (!best || Math.abs(note.time - this.elapsed) < Math.abs(best.time - this.elapsed))) best = note;
    const judgement = best ? judge(this.elapsed - best.time) : null;
    if (best && judgement) { best.judged = true; sfx.play(judgement === 'perfect' ? 'good' : 'tap'); this.success(judgement === 'perfect' ? 30 : 15); this.setFlash(judgement.toUpperCase()); }
    else { sfx.play('tick'); this.resetCombo(); this.setFlash('...'); }
  }
  private setFlash(flash: string): void { this.flash = flash; this.flashUntil = this.elapsed + 450; }
  protected update(_dt: number): void {
    const beatMs = 60000 / bpmForLevel(this.level);
    while (this.nextBarAt < this.elapsed + 2200) { const bar = makeBar(this.rand, this.level); bar.forEach((on, slot) => { if (on) this.notes.push({ time: this.nextBarAt + (slot * beatMs) / 2, judged: false }); }); this.nextBarAt += beatMs * 4; }
    for (let i = this.notes.length - 1; i >= 0; i -= 1) { const note = this.notes[i]; if (!note.judged && this.elapsed - note.time > MISS_MS) { note.judged = true; sfx.play('bad'); this.setFlash('MISS'); this.fail(); if (this.isFinished) return; } if (this.elapsed - note.time > 600) this.notes.splice(i, 1); }
  }
  protected draw(): void {
    const c = this.ctx; c.fillStyle = ARCADE.bg; c.fillRect(0, 0, this.w, this.h); c.strokeStyle = ARCADE.bgSoft; c.lineWidth = 4; c.beginPath(); c.moveTo(this.w / 2, 0); c.lineTo(this.w / 2, this.h); c.stroke();
    c.beginPath(); c.arc(this.w / 2, this.hitY, 34, 0, Math.PI * 2); c.strokeStyle = ARCADE.pink; c.stroke();
    for (const note of this.notes) { if (note.judged) continue; const progress = 1 - (note.time - this.elapsed) / TRAVEL_MS; if (progress < 0) continue; const y = -30 + (this.hitY + 30) * progress; c.beginPath(); c.arc(this.w / 2, y, 22, 0, Math.PI * 2); c.fillStyle = ARCADE.green; c.fill(); }
    centerText(c, `${bpmForLevel(this.level)} BPM`, this.w / 2, 60, '14px "Press Start 2P", monospace', ARCADE.dim);
    if (this.elapsed < this.flashUntil) centerText(c, this.flash, this.w / 2, 640, '18px "Press Start 2P", monospace', this.flash === 'PERFECT' ? ARCADE.green : this.flash === 'MISS' ? ARCADE.pink : ARCADE.yellow);
  }
}
