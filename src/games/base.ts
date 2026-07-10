import { mulberry32 } from '../core/rng';
import { comboMultiplier } from '../core/score';
import { setupCanvas } from './canvas';
import type { EndReason, GameEngine, GameOptions } from './types';

export abstract class BaseEngine implements GameEngine {
  protected canvas!: HTMLCanvasElement;
  protected ctx!: CanvasRenderingContext2D;
  protected opts!: GameOptions;
  protected rand: () => number = Math.random;
  protected readonly w = 480;
  protected readonly h = 720;
  protected score = 0;
  protected combo = 0;
  protected bestCombo = 0;
  protected level = 1;
  protected mistakes = 0;
  protected elapsed = 0;
  protected levelEvery = 8;
  private successes = 0;
  private raf = 0;
  private last = 0;
  private running = false;
  private finished = false;

  init(canvas: HTMLCanvasElement, opts: GameOptions): void {
    this.canvas = canvas;
    this.opts = opts;
    this.ctx = setupCanvas(canvas, this.w, this.h);
    this.rand = mulberry32(opts.seed);
    this.setup();
    this.draw();
  }

  start(): void {
    if (this.finished || this.running) return;
    this.running = true;
    this.last = performance.now();
    const tick = (now: number) => {
      if (!this.running) return;
      const dt = Math.min(50, now - this.last);
      this.last = now;
      this.elapsed += dt;
      if (this.opts.roundMs && this.elapsed >= this.opts.roundMs) {
        this.end('timeup');
        return;
      }
      this.update(dt);
      if (this.finished) return;
      this.draw();
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  pause(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  resume(): void {
    this.start();
  }

  destroy(): void {
    this.pause();
    this.finished = true;
    this.teardown();
  }

  protected get isRunning(): boolean {
    return this.running;
  }

  protected get isFinished(): boolean {
    return this.finished;
  }

  protected success(points: number): void {
    if (this.finished) return;
    this.combo += 1;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.score += points * comboMultiplier(this.combo);
    this.successes += 1;
    if (this.successes % this.levelEvery === 0) this.level += 1;
    this.opts.callbacks.onScore(this.score, this.combo);
  }

  protected resetCombo(): void {
    this.combo = 0;
    this.opts.callbacks.onScore(this.score, this.combo);
  }

  protected fail(): void {
    if (this.finished) return;
    this.combo = 0;
    this.mistakes += 1;
    this.opts.callbacks.onScore(this.score, this.combo);
    this.opts.callbacks.onLifeLost();
    if (this.mistakes >= this.opts.startLives) this.end('lives');
  }

  protected end(reason: EndReason): void {
    if (this.finished) return;
    this.finished = true;
    this.pause();
    this.opts.callbacks.onGameOver({
      score: this.score,
      bestCombo: this.bestCombo,
      levelReached: this.level,
      durationMs: Math.round(this.elapsed),
      livesLeft: Math.max(0, this.opts.startLives - this.mistakes),
      endReason: reason,
      stats: this.stats(),
    });
  }

  protected stats(): Record<string, number> {
    return {};
  }

  protected abstract setup(): void;
  protected abstract update(dt: number): void;
  protected abstract draw(): void;
  protected teardown(): void {}
}
