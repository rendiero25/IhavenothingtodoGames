import { afterEach, describe, expect, it, vi } from 'vitest';
import { actionForKey, InputController, touchLayout, touchZone } from './input';

describe('actionForKey', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('memisahkan joystick, aim, fire, reload, dan switch', () => {
    expect(touchZone(30, 300, 800, 450)).toBe('move');
    expect(touchZone(700, 200, 800, 450)).toBe('aim');
    expect(touchZone(740, 390, 800, 450)).toBe('fire');
    expect(touchZone(640, 390, 800, 450)).toBe('reload');
    expect(touchZone(540, 390, 800, 450)).toBe('switch');
  });

  it.each([320, 360, 375, 800])(
    'menjaga pusat tombol touch aktif dan minimal 44px pada lebar %i',
    (width) => {
      const layout = touchLayout(width, 450);

      expect(layout.move.width).toBe(width * 0.45);
      expect(layout.aim.width).toBeCloseTo(width * 0.55);
      expect(layout.joystick.x + layout.joystick.width).toBeLessThanOrEqual(layout.move.width);
      for (const zone of ['switch', 'reload', 'fire'] as const) {
        const rect = layout[zone];
        expect(rect.width).toBeGreaterThanOrEqual(44);
        expect(rect.height).toBeGreaterThanOrEqual(44);
        expect(rect.x).toBeGreaterThanOrEqual(layout.move.width);
        expect(touchZone(rect.x + rect.width / 2, rect.y + rect.height / 2, width, 450)).toBe(zone);
      }

      expect(layout.aim.x).toBe(layout.move.width);
      expect(layout.aim.y + layout.aim.height).toBe(layout.switch.y);
      expect(
        touchZone(
          layout.aim.x + layout.aim.width / 2,
          layout.aim.y + layout.aim.height / 2,
          width,
          450,
        ),
      ).toBe('aim');
    },
  );

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
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 450 }),
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
        clientX: 540,
        clientY: 390,
        preventDefault: () => undefined,
      } as unknown as PointerEvent;
      handlers.onPointerDown(event);
      handlers.onPointerUp(event);
    };

    switchTouch(1);
    expect(controller.snapshot().weaponRequested).toBe('rifle');
    controller.consumeFrame();
    switchTouch(2);
    expect(controller.snapshot().weaponRequested).toBe('shotgun');
    controller.consumeFrame();
    switchTouch(3);
    expect(controller.snapshot().weaponRequested).toBe('pistol');
    controller.consumeFrame();
    switchTouch(4);
    expect(controller.snapshot().weaponRequested).toBe('rifle');
  });

  it('menembak ke posisi cursor desktop tanpa pointer lock', () => {
    const canvas = {
      setPointerCapture: () => undefined,
      getBoundingClientRect: () => ({ left: 100, top: 50, width: 800, height: 400 }),
      requestPointerLock: () => {
        throw new Error('pointer lock tidak boleh dipakai');
      },
    } as unknown as HTMLCanvasElement;
    const controller = new InputController(canvas);
    const handlers = controller as unknown as { onPointerDown(event: PointerEvent): void };
    const click = {
      button: 0,
      pointerId: 1,
      pointerType: 'mouse',
      clientX: 700,
      clientY: 150,
      preventDefault: () => undefined,
    } as unknown as PointerEvent;

    handlers.onPointerDown(click);

    expect(controller.snapshot()).toMatchObject({ firing: true, aimX: 0.5, aimY: 0.5 });
  });

  it('memakai cursor crosshair selama controller aktif lalu memulihkan cursor lama', () => {
    vi.stubGlobal('window', { addEventListener: () => undefined, removeEventListener: () => undefined });
    const canvas = {
      style: { cursor: 'default' },
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    } as unknown as HTMLCanvasElement;
    const controller = new InputController(canvas);

    controller.attach();
    expect(canvas.style.cursor).toBe('crosshair');

    controller.destroy();
    expect(canvas.style.cursor).toBe('default');
  });
});
