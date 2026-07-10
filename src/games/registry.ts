import type { GameEngine, GameId, GameMeta } from './types';

export const GAMES: GameMeta[] = [
  // Diisi satu entri per task game (Task 11-18), urutan: tap-panic, quick-math,
  // simon, missing-number, word-scramble, bubble-sniper, dodge, beat-tap.
  {
    id: 'tap-panic',
    category: 'reflex',
    icon: 'zap',
    accent: 'coral',
    name: { id: 'Tap Panic', en: 'Tap Panic' },
    tagline: { id: 'Tap sebelum lingkarannya kabur.', en: 'Tap before the circle vanishes.' },
    howTo: {
      id: 'Tap target hijau secepatnya. Jangan sentuh yang pink!',
      en: 'Tap green targets fast. Never touch the pink ones!',
    },
  },
];

const loaders: Partial<Record<GameId, () => Promise<GameEngine>>> = {
  // Diisi per task game.
  'tap-panic': () => import('./tap-panic/engine').then((m) => new m.TapPanicEngine()),
};

export function getMeta(id: string): GameMeta | undefined {
  return GAMES.find((g) => g.id === id);
}

export async function loadEngine(id: GameId): Promise<GameEngine> {
  const loader = loaders[id];
  if (!loader) throw new Error(`Unknown game: ${id}`);
  return loader();
}
