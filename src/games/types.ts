import type { Locale } from '../i18n/dict';

export type GameId =
  | 'tap-panic'
  | 'bubble-sniper'
  | 'simon'
  | 'missing-number'
  | 'word-scramble'
  | 'quick-math'
  | 'dodge'
  | 'beat-tap'
  | 'arena-fps'
  | 'stick-man-running';

export type Category =
  | 'reflex'
  | 'aim'
  | 'memory'
  | 'logic'
  | 'word'
  | 'math'
  | 'dexterity'
  | 'rhythm'
  | 'shooter';

export type EndReason = 'lives' | 'timeup';

export interface GameResult {
  score: number;
  bestCombo: number;
  levelReached: number;
  durationMs: number;
  livesLeft: number;
  endReason: EndReason;
  stats: Record<string, number>;
}

export interface GameCallbacks {
  onScore(totalScore: number, combo: number): void;
  onLifeLost(): void;
  onGameOver(result: GameResult): void;
  onFatalError?(error: Error): void;
}

export interface GameOptions {
  seed: number;
  locale: Locale;
  startLives: number;
  roundMs?: number;
  callbacks: GameCallbacks;
}

export interface GameEngine {
  init(canvas: HTMLCanvasElement, opts: GameOptions): void;
  start(): void;
  pause(): void;
  resume(): void;
  destroy(): void;
}

export interface L10n {
  id: string;
  en: string;
}

export type IconKey =
  | 'zap'
  | 'target'
  | 'brain'
  | 'hash'
  | 'type'
  | 'calculator'
  | 'move'
  | 'music'
  | 'crosshair';

export type Accent = 'coral' | 'teal' | 'amber' | 'pink';
export type GameViewport = 'portrait' | 'landscape';

export interface GameMeta {
  id: GameId;
  category: Category;
  icon: IconKey;
  accent: Accent;
  viewport: GameViewport;
  name: L10n;
  tagline: L10n;
  howTo: L10n;
}
