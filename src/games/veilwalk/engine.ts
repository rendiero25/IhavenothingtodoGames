import type { GameEngine, GameOptions, GameResult } from '../types';
import { draw, makeSky } from './draw';
export { prepareForest } from './draw';
import { createState, END, H, step, W, type Input, type State } from './logic';

const keyAction: Record<string, keyof Input> = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'jump', KeyW: 'jump', Space: 'jump', KeyE: 'interact', Enter: 'interact',
};

export class VeilwalkEngine implements GameEngine {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private opts!: GameOptions;
  private state!: State;
  private sky!: HTMLCanvasElement;
  private input: Input = { left: false, right: false, jump: false, interact: false };
  private down = new Set<string>();
  private controls: HTMLElement | null = null;
  private frame = 0;
  private last = 0;
  private acc = 0;
  private running = false;
  private ended = false;
  private reducedMotion = false;
  private lastScore = -1;

  init(canvas: HTMLCanvasElement, opts: GameOptions): void {
    this.canvas = canvas; this.opts = opts; this.state = createState(opts.startLives);
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.sky = makeSky();
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.addEventListener('keydown', this.keydown);
    window.addEventListener('keyup', this.keyup);
    window.addEventListener('blur', this.blur);
    this.addControls();
    this.render();
  }

  private keydown = (e: KeyboardEvent) => {
    const action = keyAction[e.code]; if (!action) return;
    e.preventDefault();
    if (e.repeat && (action === 'jump' || action === 'interact')) return;
    this.down.add(e.code);
    if (action === 'jump' || action === 'interact') this.input[action] = true;
    else this.input[action] = true;
  };
  private keyup = (e: KeyboardEvent) => {
    const action = keyAction[e.code]; if (!action) return;
    e.preventDefault(); this.down.delete(e.code);
    if (action === 'left' || action === 'right') this.input[action] = [...this.down].some((code) => keyAction[code] === action);
  };
  private blur = () => { this.down.clear(); this.input = { left: false, right: false, jump: false, interact: false }; };

  private addControls(): void {
    if (!window.matchMedia('(pointer: coarse)').matches) return;
    const root = document.createElement('div');
    root.style.cssText = 'position:absolute;inset:0;z-index:8;pointer-events:none;display:flex;align-items:end;justify-content:space-between;padding:12px;gap:8px';
    const group = (buttons: [string, keyof Input][]) => {
      const holder = document.createElement('div'); holder.style.cssText = 'display:flex;gap:8px;pointer-events:auto';
      for (const [label, action] of buttons) {
        const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
        button.setAttribute('aria-label', action === 'left' ? (this.opts.locale === 'id' ? 'Kiri' : 'Left') : action === 'right' ? (this.opts.locale === 'id' ? 'Kanan' : 'Right') : action === 'jump' ? (this.opts.locale === 'id' ? 'Lompat' : 'Jump') : (this.opts.locale === 'id' ? 'Aksi' : 'Action'));
        button.className = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';
        button.style.cssText = 'width:52px;height:52px;border:1px solid #d9dcc8a8;background:#080b0ecc;color:#f4f2df;font:600 21px monospace;touch-action:none;user-select:none;cursor:pointer';
        button.onpointerdown = (e) => { e.preventDefault(); button.setPointerCapture(e.pointerId); this.input[action] = true; };
        button.onpointerup = button.onpointercancel = () => { if (action === 'left' || action === 'right') this.input[action] = false; };
        holder.append(button);
      }
      return holder;
    };
    root.append(group([['◀', 'left'], ['▶', 'right']]), group([['✦', 'interact'], ['↑', 'jump']]));
    (window.innerWidth < 640 ? this.canvas.parentElement?.parentElement : this.canvas.parentElement)?.append(root);
    this.controls = root;
  }

  private render(): void {
    const camera = Math.max(0, Math.min(END - W + 120, this.state.x - W * .32));
    draw(this.ctx, this.sky, this.state, camera, this.opts.locale, this.reducedMotion);
  }

  private tick = (now: number) => {
    if (!this.running) return;
    this.acc += Math.min(0.067, (now - this.last) / 1000); this.last = now;
    let loops = 0;
    while (this.acc >= 1 / 60 && loops++ < 4) {
      const lives = this.state.lives;
      step(this.state, this.input, 1 / 60); this.acc -= 1 / 60;
      const score = Math.floor(this.state.x / END * 10) * 100;
      if (score > this.lastScore) { this.lastScore = score; this.opts.callbacks.onScore(score, 0); }
      this.input.jump = false; this.input.interact = false;
      if (this.state.lives < lives) this.opts.callbacks.onLifeLost();
      if (this.state.finished || this.state.dead) { this.finish(); break; }
    }
    if (loops >= 4) this.acc = 0;
    this.render();
    if (this.running) this.frame = requestAnimationFrame(this.tick);
  };

  private finish(): void {
    if (this.ended) return;
    this.ended = true; this.running = false;
    const s = this.state;
    const result: GameResult = {
      score: Math.round(Math.min(END, s.x) / END * 1000 + (s.finished ? 500 + s.lives * 100 : 0)),
      bestCombo: 0, levelReached: s.finished ? 5 : Math.min(5, 1 + Math.floor(s.x / 800)),
      durationMs: Math.round(s.time * 1000), livesLeft: s.lives,
      endReason: s.finished ? 'complete' : 'lives', stats: { deaths: s.deaths, bridge: Number(s.bridge) },
    };
    this.opts.callbacks.onScore(result.score, 0);
    this.opts.callbacks.onGameOver(result);
  }

  start(): void { if (this.ended || this.running) return; this.running = true; this.last = performance.now(); this.frame = requestAnimationFrame(this.tick); }
  pause(): void { this.running = false; cancelAnimationFrame(this.frame); this.acc = 0; this.blur(); }
  resume(): void { this.start(); }
  destroy(): void {
    this.pause(); this.ended = true;
    window.removeEventListener('keydown', this.keydown); window.removeEventListener('keyup', this.keyup); window.removeEventListener('blur', this.blur);
    this.controls?.remove(); this.controls = null;
  }
}
