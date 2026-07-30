import type { WeaponId } from './config';

export interface InputSnapshot {
  moveX: number;
  moveZ: number;
  lookX: number;
  lookY: number;
  firing: boolean;
  reloadRequested: boolean;
  weaponRequested: WeaponId | null;
}

export type InputAction =
  | { kind: 'move'; axis: 'forward' | 'right'; value: -1 | 1 }
  | { kind: 'reload' }
  | { kind: 'weapon'; weapon: WeaponId };

const KEY_ACTIONS: Readonly<Record<string, InputAction>> = {
  KeyW: { kind: 'move', axis: 'forward', value: 1 },
  KeyS: { kind: 'move', axis: 'forward', value: -1 },
  KeyD: { kind: 'move', axis: 'right', value: 1 },
  KeyA: { kind: 'move', axis: 'right', value: -1 },
  KeyR: { kind: 'reload' },
  Digit1: { kind: 'weapon', weapon: 'pistol' },
  Digit2: { kind: 'weapon', weapon: 'rifle' },
  Digit3: { kind: 'weapon', weapon: 'shotgun' },
};

const TOUCH_WEAPONS: readonly WeaponId[] = ['pistol', 'rifle', 'shotgun'];
const TOUCH_BUTTON_SIZE = 100;

export function actionForKey(code: string): InputAction | null {
  return KEY_ACTIONS[code] ?? null;
}

export type TouchZone = 'move' | 'aim' | 'fire' | 'reload' | 'switch';

export function touchZone(x: number, y: number, width: number, height: number): TouchZone {
  if (x <= width * 0.45) return 'move';
  if (y < height * 0.72) return 'aim';
  if (x >= width - TOUCH_BUTTON_SIZE) return 'fire';
  if (x >= width - TOUCH_BUTTON_SIZE * 2) return 'reload';
  if (x >= width - TOUCH_BUTTON_SIZE * 3) return 'switch';
  return 'aim';
}

type TouchMode = TouchZone;

/** Converts desktop and touch controls into one per-frame FPS input snapshot. */
export class InputController {
  private attached = false;
  private paused = false;
  private moveX = 0;
  private moveZ = 0;
  private lookX = 0;
  private lookY = 0;
  private firing = false;
  private reloadRequested = false;
  private weaponRequested: WeaponId | null = null;
  private touchWeaponIndex = 0;
  private readonly pressedKeys = new Set<string>();
  private readonly touchModes = new Map<number, TouchMode>();
  private readonly touchStarts = new Map<number, { x: number; y: number }>();
  private fallbackDragPointer: number | null = null;
  private fallbackDragPoint: { x: number; y: number } | null = null;

  constructor(private readonly canvas: HTMLCanvasElement) {}

  attach(): void {
    if (this.attached) return;
    this.attached = true;

    this.canvas.addEventListener('contextmenu', this.onContextMenu);
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointercancel', this.onPointerUp);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  snapshot(): InputSnapshot {
    return {
      moveX: this.moveX,
      moveZ: this.moveZ,
      lookX: this.lookX,
      lookY: this.lookY,
      firing: this.firing,
      reloadRequested: this.reloadRequested,
      weaponRequested: this.weaponRequested,
    };
  }

  consumeFrame(): void {
    this.lookX = 0;
    this.lookY = 0;
    this.reloadRequested = false;
    this.weaponRequested = null;
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    if (paused) this.resetTransientInput();
  }

  destroy(): void {
    if (!this.attached) return;
    this.attached = false;
    this.canvas.removeEventListener('contextmenu', this.onContextMenu);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerUp);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.resetTransientInput();
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    const action = actionForKey(event.code);
    if (!action) return;
    event.preventDefault();
    if (this.paused) return;

    if (action.kind === 'move') {
      this.pressedKeys.add(event.code);
      this.updateKeyboardMove();
    } else if (action.kind === 'reload') {
      this.reloadRequested = true;
    } else {
      this.weaponRequested = action.weapon;
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    const action = actionForKey(event.code);
    if (!action) return;
    event.preventDefault();
    this.pressedKeys.delete(event.code);
    this.updateKeyboardMove();
  };

  private readonly onContextMenu = (event: MouseEvent): void => event.preventDefault();

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (this.paused) return;
    event.preventDefault();
    this.canvas.setPointerCapture?.(event.pointerId);

    if (event.pointerType === 'touch') {
      this.startTouch(event);
      return;
    }

    if (event.button === 0) {
      this.firing = true;
      void this.canvas.requestPointerLock?.();
      return;
    }

    if (event.button === 2 && document.pointerLockElement !== this.canvas) {
      this.fallbackDragPointer = event.pointerId;
      this.fallbackDragPoint = { x: event.clientX, y: event.clientY };
    }
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (this.paused) return;
    if (event.pointerType === 'touch') {
      this.moveTouch(event);
      return;
    }

    if (document.pointerLockElement === this.canvas) {
      this.lookX += event.movementX;
      this.lookY += event.movementY;
    } else if (event.pointerId === this.fallbackDragPointer && this.fallbackDragPoint) {
      this.lookX += event.clientX - this.fallbackDragPoint.x;
      this.lookY += event.clientY - this.fallbackDragPoint.y;
      this.fallbackDragPoint = { x: event.clientX, y: event.clientY };
    }
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    this.canvas.releasePointerCapture?.(event.pointerId);
    if (event.pointerType === 'touch') {
      this.endTouch(event.pointerId);
      return;
    }
    if (event.button === 0) this.firing = false;
    if (event.pointerId === this.fallbackDragPointer) {
      this.fallbackDragPointer = null;
      this.fallbackDragPoint = null;
    }
  };

  private startTouch(event: PointerEvent): void {
    const bounds = this.canvas.getBoundingClientRect();
    const localX = event.clientX - bounds.left;
    const localY = event.clientY - bounds.top;
    const mode = touchZone(localX, localY, bounds.width, bounds.height);

    if (mode === 'move' || mode === 'aim') {
      this.touchModes.set(event.pointerId, mode);
      this.touchStarts.set(event.pointerId, { x: localX, y: localY });
      return;
    }

    this.touchModes.set(event.pointerId, mode);
    if (mode === 'fire') this.firing = true;
    if (mode === 'reload') this.reloadRequested = true;
    if (mode === 'switch') {
      this.weaponRequested = TOUCH_WEAPONS[this.touchWeaponIndex];
      this.touchWeaponIndex = (this.touchWeaponIndex + 1) % TOUCH_WEAPONS.length;
    }
  }

  private moveTouch(event: PointerEvent): void {
    const mode = this.touchModes.get(event.pointerId);
    const start = this.touchStarts.get(event.pointerId);
    if (!mode || !start) return;
    const bounds = this.canvas.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;

    if (mode === 'move') {
      const deltaX = x - start.x;
      const deltaY = y - start.y;
      const length = Math.hypot(deltaX, deltaY);
      const scale = length > 48 ? 48 / length : 1;
      this.moveX = (deltaX * scale) / 48;
      this.moveZ = (-deltaY * scale) / 48;
    } else if (mode === 'aim') {
      this.lookX += x - start.x;
      this.lookY += y - start.y;
      this.touchStarts.set(event.pointerId, { x, y });
    }
  }

  private endTouch(pointerId: number): void {
    const mode = this.touchModes.get(pointerId);
    this.touchModes.delete(pointerId);
    this.touchStarts.delete(pointerId);
    if (mode === 'move') {
      this.moveX = 0;
      this.moveZ = 0;
    }
    if (mode === 'fire') this.firing = false;
  }

  private updateKeyboardMove(): void {
    if (this.touchModes.has(this.findTouchByMode('move'))) return;
    this.moveX = Number(this.pressedKeys.has('KeyD')) - Number(this.pressedKeys.has('KeyA'));
    this.moveZ = Number(this.pressedKeys.has('KeyW')) - Number(this.pressedKeys.has('KeyS'));
  }

  private findTouchByMode(mode: TouchMode): number {
    for (const [pointerId, pointerMode] of this.touchModes) if (pointerMode === mode) return pointerId;
    return -1;
  }

  private resetTransientInput(): void {
    this.pressedKeys.clear();
    this.touchModes.clear();
    this.touchStarts.clear();
    this.fallbackDragPointer = null;
    this.fallbackDragPoint = null;
    this.moveX = 0;
    this.moveZ = 0;
    this.lookX = 0;
    this.lookY = 0;
    this.firing = false;
    this.reloadRequested = false;
    this.weaponRequested = null;
  }
}
