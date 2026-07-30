import { describe, expect, it } from 'vitest';
import { actionForKey, InputController } from './input';

describe('actionForKey', () => {
  it('memetakan keyboard ke aksi FPS', () => {
    expect(actionForKey('KeyW')).toEqual({ kind: 'move', axis: 'forward', value: 1 });
    expect(actionForKey('KeyR')).toEqual({ kind: 'reload' });
    expect(actionForKey('Digit3')).toEqual({ kind: 'weapon', weapon: 'shotgun' });
  });

  it('memetakan arah berlawanan dan mengabaikan tombol yang tidak dipakai', () => {
    expect(actionForKey('KeyA')).toEqual({ kind: 'move', axis: 'right', value: -1 });
    expect(actionForKey('KeyS')).toEqual({ kind: 'move', axis: 'forward', value: -1 });
    expect(actionForKey('Space')).toBeNull();
  });

  it('memutar permintaan senjata pada touch switch melalui ketiga senjata', () => {
    const canvas = {
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
      setPointerCapture: () => undefined,
      releasePointerCapture: () => undefined,
    } as unknown as HTMLCanvasElement;
    const controller = new InputController(canvas);
    const handlers = controller as unknown as {
      onPointerDown(event: PointerEvent): void;
      onPointerUp(event: PointerEvent): void;
    };

    const switchTouch = (pointerId: number): void => {
      const event = {
        pointerId,
        pointerType: 'touch',
        clientX: 90,
        clientY: 90,
        preventDefault: () => undefined,
      } as unknown as PointerEvent;
      handlers.onPointerDown(event);
      handlers.onPointerUp(event);
    };

    switchTouch(1);
    expect(controller.snapshot().weaponRequested).toBe('pistol');
    controller.consumeFrame();
    switchTouch(2);
    expect(controller.snapshot().weaponRequested).toBe('rifle');
    controller.consumeFrame();
    switchTouch(3);
    expect(controller.snapshot().weaponRequested).toBe('shotgun');
    controller.consumeFrame();
    switchTouch(4);
    expect(controller.snapshot().weaponRequested).toBe('pistol');
  });
});
