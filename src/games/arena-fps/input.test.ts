import { describe, expect, it } from 'vitest';
import { actionForKey } from './input';

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
});
