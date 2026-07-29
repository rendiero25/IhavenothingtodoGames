import { pick, randInt, seededShuffle } from '../../core/rng';

export interface NumQ {
  display: (number | null)[];
  options: number[];
  answer: number;
}

type Gen = (rand: () => number) => number[];

const gens: Record<string, Gen> = {
  arithmetic: (rand) => {
    const start = randInt(rand, 1, 15);
    const step = randInt(rand, 2, 9);
    return Array.from({ length: 5 }, (_, i) => start + i * step);
  },
  geometric: (rand) => {
    const start = randInt(rand, 1, 4);
    const ratio = randInt(rand, 2, 3);
    return Array.from({ length: 4 }, (_, i) => start * ratio ** i);
  },
  squares: (rand) => {
    const n0 = randInt(rand, 1, 5);
    return Array.from({ length: 4 }, (_, i) => (n0 + i) ** 2);
  },
  fib: (rand) => {
    const seq = [randInt(rand, 1, 5), randInt(rand, 1, 5)];
    while (seq.length < 5) seq.push(seq[seq.length - 1] + seq[seq.length - 2]);
    return seq;
  },
  zigzag: (rand) => {
    const up = randInt(rand, 3, 9);
    const down = randInt(rand, 1, up - 1);
    const seq = [randInt(rand, 10, 30)];
    for (let i = 0; i < 4; i++) seq.push(seq[i] + (i % 2 === 0 ? up : -down));
    return seq;
  },
};

function poolFor(level: number): Gen[] {
  if (level <= 2) return [gens.arithmetic];
  if (level === 3) return [gens.arithmetic, gens.geometric];
  if (level === 4) return [gens.arithmetic, gens.geometric, gens.squares];
  return Object.values(gens);
}

export function numTimeMs(level: number): number {
  return Math.max(3000, 8000 - (level - 1) * 500);
}

export function makeNumQ(rand: () => number, level: number): NumQ {
  const seq = pick(rand, poolFor(level))(rand);
  const hideIdx = level < 4 ? seq.length - 1 : randInt(rand, 1, seq.length - 1);
  const answer = seq[hideIdx];
  const display = seq.map((v, i) => (i === hideIdx ? null : v));
  const distractors = new Set<number>();
  while (distractors.size < 2) {
    const d = answer + randInt(rand, 1, 6) * (rand() < 0.5 ? -1 : 1);
    if (d !== answer) distractors.add(d);
  }
  const options = seededShuffle([answer, ...distractors], rand);
  return { display, options, answer };
}
