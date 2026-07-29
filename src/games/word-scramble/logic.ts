import { pick, seededShuffle } from '../../core/rng';

export function wordLenForLevel(level: number): number {
  return Math.min(7, 3 + Math.ceil(level / 2));
}

export function wordTimeMs(level: number): number {
  return Math.max(4000, 9000 - (level - 1) * 500);
}

export function pickWord(rand: () => number, list: readonly string[], len: number): string {
  const candidates = list.filter((w) => w.length === len);
  return candidates.length > 0 ? pick(rand, candidates) : pick(rand, list);
}

export function scramble(rand: () => number, word: string): string[] {
  const letters = word.split('');
  if (new Set(letters).size < 2) return letters;
  for (let i = 0; i < 20; i += 1) {
    const shuffled = seededShuffle(letters, rand);
    if (shuffled.join('') !== word) return shuffled;
  }
  return letters.reverse();
}
