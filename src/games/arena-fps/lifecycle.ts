type FrameRequester = (callback: FrameRequestCallback) => number;
type FrameCanceller = (frameId: number) => void;

/** Owns browser-frame and event cleanup for one FPS engine instance. */
export class EngineLifecycle {
  private frameId: number | null = null;
  private destroyed = false;
  private started = false;
  private readonly cleanups = new Set<() => void>();

  constructor(
    private readonly requestFrame: FrameRequester = requestAnimationFrame,
    private readonly cancelFrame: FrameCanceller = cancelAnimationFrame,
  ) {}

  track(cleanup: () => void): () => void {
    if (this.destroyed) {
      cleanup();
      return () => undefined;
    }

    this.cleanups.add(cleanup);
    return () => this.cleanups.delete(cleanup);
  }

  start(onFrame: FrameRequestCallback): void {
    if (this.destroyed || this.started) return;
    this.started = true;

    const frame: FrameRequestCallback = (time) => {
      if (this.destroyed) return;
      onFrame(time);
      if (!this.destroyed) this.frameId = this.requestFrame(frame);
    };

    this.frameId = this.requestFrame(frame);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    if (this.frameId !== null) {
      this.cancelFrame(this.frameId);
      this.frameId = null;
    }

    for (const cleanup of this.cleanups) cleanup();
    this.cleanups.clear();
  }
}

export interface WebGlContextRecoveryCallbacks {
  pause(): boolean;
  restore(): void;
  resume(): void;
  fatal(error: Error): void;
}

/** Owns one WebGL restoration attempt and its canvas event listeners. */
export class WebGlContextRecovery {
  private attached = false;
  private attempted = false;
  private awaitingRestore = false;
  private resumeAfterRestore = false;
  private fatal = false;

  constructor(
    private readonly target: EventTarget,
    private readonly callbacks: WebGlContextRecoveryCallbacks,
  ) {}

  attach(): void {
    if (this.attached || this.fatal) return;
    this.attached = true;
    this.target.addEventListener('webglcontextlost', this.onContextLost);
    this.target.addEventListener('webglcontextrestored', this.onContextRestored);
  }

  destroy(): void {
    if (!this.attached) return;
    this.attached = false;
    this.target.removeEventListener('webglcontextlost', this.onContextLost);
    this.target.removeEventListener('webglcontextrestored', this.onContextRestored);
  }

  private readonly onContextLost = (event: Event): void => {
    event.preventDefault();
    if (this.attempted) {
      this.fail();
      return;
    }
    this.attempted = true;
    this.awaitingRestore = true;
    this.resumeAfterRestore = this.callbacks.pause();
  };

  private readonly onContextRestored = (): void => {
    if (!this.awaitingRestore || this.fatal) return;
    try {
      this.callbacks.restore();
      this.awaitingRestore = false;
      if (this.resumeAfterRestore) this.callbacks.resume();
    } catch {
      this.fail();
    }
  };

  private fail(): void {
    if (this.fatal) return;
    this.fatal = true;
    this.awaitingRestore = false;
    this.destroy();
    this.callbacks.fatal(new Error('WEBGL_CONTEXT_LOST'));
  }
}
