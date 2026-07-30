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
