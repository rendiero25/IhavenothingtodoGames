import type { GameEngine, GameId, GameMeta } from './types';

export const GAMES: GameMeta[] = [
  // Diisi satu entri per task game (Task 11-18), urutan: tap-panic, quick-math,
  // simon, missing-number, word-scramble, bubble-sniper, dodge, beat-tap.
];

const loaders: Partial<Record<GameId, () => Promise<GameEngine>>> = {
  // Diisi per task game, contoh:
  // 'tap-panic': () => import('./tap-panic/engine').then((m) => new m.TapPanicEngine()),
};

export function getMeta(id: string): GameMeta | undefined {
  return GAMES.find((g) => g.id === id);
}

export async function loadEngine(id: GameId): Promise<GameEngine> {
  const loader = loaders[id];
  if (!loader) throw new Error(`Unknown game: ${id}`);
  return loader();
}
