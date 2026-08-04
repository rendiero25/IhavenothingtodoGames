import type { GameEngine, GameOptions, GameResult } from '../types';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH, type GameState, type InputState } from './config';
import { drawNotebookScene } from './draw';
import { createInitialState, updateGame } from './logic';

type FrameCallback = (time: number) => void;
type FrameRequester = (callback: FrameCallback) => number;
type FrameCanceller = (frameId: number) => void;

interface ListenerTarget {
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

interface RemovableNode {
  remove(): void;
}

/** Owns every listener and generated node created by one engine instance. */
export class EngineResources {
  private readonly cleanups = new Set<() => void>();
  private destroyed = false;

  listen(
    target: ListenerTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void {
    if (this.destroyed) return;
    target.addEventListener(type, listener, options);
    this.cleanups.add(() => target.removeEventListener(type, listener, options));
  }

  ownNode(node: RemovableNode): void {
    if (this.destroyed) {
      node.remove();
      return;
    }
    this.cleanups.add(() => node.remove());
  }

  track(cleanup: () => void): void {
    if (this.destroyed) cleanup();
    else this.cleanups.add(cleanup);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    for (const cleanup of this.cleanups) cleanup();
    this.cleanups.clear();
  }
}

/** A pauseable frame loop that never accumulates elapsed time while paused. */
export class EngineFrameLoop {
  private frameId: number | null = null;
  private lastFrameAt: number | null = null;
  private running = false;
  private destroyed = false;

  constructor(
    private readonly requestFrame: FrameRequester = (callback) => globalThis.requestAnimationFrame(callback),
    private readonly cancelFrame: FrameCanceller = (frameId) => globalThis.cancelAnimationFrame(frameId),
  ) {}

  get isRunning(): boolean {
    return this.running;
  }

  start(onFrame: (dtMs: number) => void): void {
    if (this.destroyed || this.running) return;
    this.running = true;
    this.lastFrameAt = null;

    const tick: FrameCallback = (time) => {
      this.frameId = null;
      if (!this.running || this.destroyed) return;
      const dtMs = this.lastFrameAt === null ? 0 : Math.min(100, Math.max(0, time - this.lastFrameAt));
      this.lastFrameAt = time;
      onFrame(dtMs);
      if (this.running && !this.destroyed) this.frameId = this.requestFrame(tick);
    };

    this.frameId = this.requestFrame(tick);
  }

  pause(): void {
    if (!this.running && this.frameId === null) return;
    this.running = false;
    this.lastFrameAt = null;
    if (this.frameId !== null) {
      this.cancelFrame(this.frameId);
      this.frameId = null;
    }
  }

  destroy(): void {
    if (this.destroyed) return;
    this.pause();
    this.destroyed = true;
  }
}

const KEY_ACTIONS = new Map<string, 'left' | 'right' | 'jump'>([
  ['ArrowLeft', 'left'],
  ['KeyA', 'left'],
  ['ArrowRight', 'right'],
  ['KeyD', 'right'],
  ['ArrowUp', 'jump'],
  ['KeyW', 'jump'],
  ['Space', 'jump'],
]);

const CONTROL_LABELS = {
  id: { left: 'Bergerak ke kiri', right: 'Bergerak ke kanan', jump: 'Lompat', punch: 'Pukul' },
  en: { left: 'Move left', right: 'Move right', jump: 'Jump', punch: 'Punch' },
} as const;

type ControlAction = keyof typeof CONTROL_LABELS.en;

interface CanvasPunchEvent {
  button: number;
  pointerType: string;
  preventDefault(): void;
}

/** Canvas attacks are mouse-only; touch and stylus input belong to the DOM controls. */
export function handleCanvasPunch(
  event: CanvasPunchEvent,
  enabled: boolean,
  punch: () => void,
): void {
  if (!enabled || event.pointerType !== 'mouse' || event.button !== 0) return;
  event.preventDefault();
  punch();
}

function configureCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  canvas.width = Math.round(LOGICAL_WIDTH * dpr);
  canvas.height = Math.round(LOGICAL_HEIGHT * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('CANVAS_2D_UNAVAILABLE');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

/** Canvas 2D runtime for the deterministic notebook side-brawler. */
export class StickManRunningEngine implements GameEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private opts: GameOptions | null = null;
  private state: GameState | null = null;
  private loop: EngineFrameLoop | null = null;
  private resources: EngineResources | null = null;
  private reducedMotion = false;
  private initialized = false;
  private destroyed = false;
  private finished = false;
  private fatalEmitted = false;
  private gameOverEmitted = false;
  private input: InputState = this.emptyInput();
  private readonly activePointers = new Map<number, ControlAction>();

  init(canvas: HTMLCanvasElement, opts: GameOptions): void {
    if (this.initialized || this.destroyed) return;
    this.initialized = true;
    this.canvas = canvas;
    this.opts = opts;
    this.resources = new EngineResources();
    this.loop = new EngineFrameLoop();

    try {
      this.ctx = configureCanvas(canvas);
      this.state = createInitialState(opts.seed, opts.startLives);
      this.attachInput();
      this.attachEnvironmentListeners();
      this.createTouchControls();
      this.draw();
      if (this.state.gameOver) this.finish('lives');
    } catch (error) {
      this.emitFatal(error);
    }
  }

  start(): void {
    if (!this.readyToRun()) return;
    this.loop?.start((dtMs) => this.onFrame(dtMs));
  }

  pause(): void {
    this.loop?.pause();
    this.clearInput();
  }

  resume(): void {
    this.start();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.finished = true;
    this.loop?.destroy();
    this.resources?.destroy();
    this.activePointers.clear();
    this.clearInput();
    this.canvas = null;
    this.ctx = null;
    this.opts = null;
    this.state = null;
    this.loop = null;
    this.resources = null;
  }

  private readyToRun(): boolean {
    return Boolean(
      this.initialized
      && !this.destroyed
      && !this.finished
      && this.canvas
      && this.ctx
      && this.opts
      && this.state
      && this.loop,
    );
  }

  private onFrame(dtMs: number): void {
    if (!this.readyToRun() || !this.state || !this.opts) return;
    try {
      const previous = this.state;
      this.state = updateGame(previous, this.consumeInput(), dtMs, this.opts.seed);
      this.emitStateChanges(previous, this.state);
      this.draw();

      if (this.opts.roundMs && this.state.time >= this.opts.roundMs) {
        this.finish('timeup');
      } else if (this.state.gameOver) {
        this.finish('lives');
      }
    } catch (error) {
      this.emitFatal(error);
    }
  }

  private emitStateChanges(previous: GameState, next: GameState): void {
    if (!this.opts) return;
    if (previous.score !== next.score || previous.combo !== next.combo) {
      this.opts.callbacks.onScore(next.score, next.combo);
    }
    const lostLives = Math.max(0, previous.lives - next.lives);
    for (let index = 0; index < lostLives; index += 1) this.opts.callbacks.onLifeLost();
  }

  private finish(endReason: GameResult['endReason']): void {
    if (this.gameOverEmitted || this.destroyed || !this.state || !this.opts) return;
    this.gameOverEmitted = true;
    this.finished = true;
    this.loop?.pause();
    this.clearInput();
    this.opts.callbacks.onGameOver({
      score: this.state.score,
      bestCombo: this.state.bestCombo,
      levelReached: this.state.wave,
      durationMs: Math.round(this.state.time),
      livesLeft: this.state.lives,
      endReason,
      stats: {
        wave: this.state.wave,
        enemiesRemaining: this.state.enemies.length,
        pickupsRemaining: this.state.pickups.filter((pickup) => pickup.active).length,
      },
    });
  }

  private emitFatal(error: unknown): void {
    if (this.fatalEmitted || this.destroyed) return;
    this.fatalEmitted = true;
    this.finished = true;
    this.loop?.destroy();
    this.resources?.destroy();
    this.activePointers.clear();
    this.clearInput();
    const normalized = error instanceof Error ? error : new Error(String(error));
    try {
      this.opts?.callbacks.onFatalError?.(normalized);
    } catch {
      // The host callback is outside the engine lifecycle.
    }
  }

  private draw(): void {
    if (!this.ctx || !this.state) return;
    drawNotebookScene(this.ctx, this.state, this.reducedMotion);
  }

  private attachEnvironmentListeners(): void {
    if (!this.resources || !this.canvas) return;
    const resize = (): void => {
      if (!this.canvas || this.destroyed) return;
      try {
        this.ctx = configureCanvas(this.canvas);
        this.draw();
      } catch (error) {
        this.emitFatal(error);
      }
    };
    const onVisibilityChange = (): void => {
      if (document.hidden) this.pause();
    };
    this.resources.listen(window, 'resize', resize);
    this.resources.listen(document, 'visibilitychange', onVisibilityChange);

    if (typeof matchMedia === 'function') {
      const query = matchMedia('(prefers-reduced-motion: reduce)');
      this.reducedMotion = query.matches;
      const onMotionChange = (event: MediaQueryListEvent): void => {
        this.reducedMotion = event.matches;
        this.draw();
      };
      this.resources.listen(query, 'change', onMotionChange as EventListener);
    }
  }

  private attachInput(): void {
    if (!this.resources || !this.canvas) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      const action = KEY_ACTIONS.get(event.code);
      if (!action || !this.loop?.isRunning) return;
      event.preventDefault();
      if (action === 'left') this.input.left = true;
      else if (action === 'right') this.input.right = true;
      else if (!event.repeat) this.input.jumpPressed = true;
    };
    const onKeyUp = (event: KeyboardEvent): void => {
      const action = KEY_ACTIONS.get(event.code);
      if (!action) return;
      if (this.loop?.isRunning) event.preventDefault();
      if (action === 'left') this.input.left = false;
      if (action === 'right') this.input.right = false;
    };
    const onPointerDown = (event: PointerEvent): void => {
      handleCanvasPunch(event, this.loop?.isRunning === true, () => {
        this.input.punchPressed = true;
      });
    };
    this.resources.listen(window, 'keydown', onKeyDown as EventListener);
    this.resources.listen(window, 'keyup', onKeyUp as EventListener);
    this.resources.listen(window, 'blur', () => this.clearInput());
    this.resources.listen(this.canvas, 'pointerdown', onPointerDown as EventListener);
  }

  private createTouchControls(): void {
    if (!this.resources || !this.canvas?.parentElement) return;
    const container = document.createElement('div');
    container.dataset.stickManControls = 'true';
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(4, minmax(44px, 1fr))';
    container.style.gap = '8px';
    container.style.paddingTop = '8px';
    container.style.touchAction = 'none';
    container.setAttribute('role', 'group');
    container.setAttribute('aria-label', this.opts?.locale === 'id' ? 'Kontrol permainan' : 'Game controls');

    if (typeof matchMedia === 'function') {
      const pointerQuery = matchMedia('(any-pointer: coarse)');
      const syncVisibility = (): void => {
        container.hidden = !pointerQuery.matches;
        container.style.display = pointerQuery.matches ? 'grid' : 'none';
      };
      syncVisibility();
      this.resources.listen(pointerQuery, 'change', syncVisibility as EventListener);
    }

    const labels = CONTROL_LABELS[this.opts?.locale === 'id' ? 'id' : 'en'];
    const controls: readonly [ControlAction, string][] = [
      ['left', '\u2190'],
      ['right', '\u2192'],
      ['jump', '\u2191'],
      ['punch', this.opts?.locale === 'id' ? 'PUKUL' : 'PUNCH'],
    ];
    for (const [action, text] of controls) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = text;
      button.setAttribute('aria-label', labels[action]);
      button.style.minWidth = '44px';
      button.style.minHeight = '44px';
      button.style.border = '1px solid #171717';
      button.style.borderRadius = '4px';
      button.style.background = '#f7f7f7';
      button.style.color = '#171717';
      button.style.font = '600 12px Geist Mono, monospace';
      button.style.touchAction = 'none';
      button.style.cursor = 'pointer';
      this.bindControlButton(button, action);
      container.append(button);
    }
    this.canvas.parentElement.append(container);
    this.resources.ownNode(container);
  }

  private bindControlButton(button: HTMLButtonElement, action: ControlAction): void {
    if (!this.resources) return;
    const release = (event: PointerEvent): void => {
      if (this.activePointers.get(event.pointerId) !== action) return;
      event.preventDefault();
      this.activePointers.delete(event.pointerId);
      if (action === 'left') this.input.left = false;
      if (action === 'right') this.input.right = false;
    };
    const press = (event: PointerEvent): void => {
      if (event.button !== 0 || !this.loop?.isRunning) return;
      event.preventDefault();
      this.activePointers.set(event.pointerId, action);
      if (typeof button.setPointerCapture === 'function') button.setPointerCapture(event.pointerId);
      if (action === 'left') this.input.left = true;
      else if (action === 'right') this.input.right = true;
      else if (action === 'jump') this.input.jumpPressed = true;
      else this.input.punchPressed = true;
    };
    this.resources.listen(button, 'pointerdown', press as EventListener);
    this.resources.listen(button, 'pointerup', release as EventListener);
    this.resources.listen(button, 'pointercancel', release as EventListener);
    this.resources.listen(button, 'lostpointercapture', release as EventListener);
    this.resources.listen(button, 'contextmenu', (event) => event.preventDefault());
  }

  private consumeInput(): InputState {
    const snapshot = { ...this.input };
    this.input.jumpPressed = false;
    this.input.punchPressed = false;
    return snapshot;
  }

  private clearInput(): void {
    this.input = this.emptyInput();
    this.activePointers.clear();
  }

  private emptyInput(): InputState {
    return { left: false, right: false, jumpPressed: false, punchPressed: false };
  }
}
