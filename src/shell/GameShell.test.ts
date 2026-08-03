import { afterEach, describe, expect, it, vi } from 'vitest';
import * as gameShell from './GameShell';

type SessionLifecycle = {
  schedule(callback: () => void, delayMs: number): void;
  stop(): boolean;
};

describe('GameShell session lifecycle', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('membatalkan callback lama dan menolak callback baru setelah fatal stop', () => {
    vi.useFakeTimers();
    const createSessionLifecycle = Reflect.get(gameShell, 'createSessionLifecycle') as
      | (() => SessionLifecycle)
      | undefined;
    expect(createSessionLifecycle).toBeTypeOf('function');

    const callback = vi.fn();
    const lifecycle = createSessionLifecycle!();
    lifecycle.schedule(callback, 700);

    expect(lifecycle.stop()).toBe(true);
    expect(lifecycle.stop()).toBe(false);
    lifecycle.schedule(callback, 0);
    vi.runAllTimers();

    expect(callback).not.toHaveBeenCalled();
  });
});
