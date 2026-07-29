import { pick, randInt } from '../../core/rng';

export type Op = '+' | '-' | '×';

export interface MathQ {
  a: number;
  b: number;
  op: Op;
  shown: number;
  truth: boolean;
}

export function questionTimeMs(level: number): number {
  return Math.max(1800, 5000 - (level - 1) * 320);
}

export function makeQuestion(rand: () => number, level: number): MathQ {
  const ops: Op[] = level < 2 ? ['+'] : level < 4 ? ['+', '-'] : ['+', '-', '×'];
  const op = pick(rand, ops);
  const max = op === '×' ? Math.min(12, 4 + level) : Math.min(60, 8 + level * 5);
  let a = randInt(rand, 1, max);
  let b = randInt(rand, 1, max);
  if (op === '-' && b > a) [a, b] = [b, a];
  const real = op === '+' ? a + b : op === '-' ? a - b : a * b;
  const truth = rand() < 0.5;
  let shown = real;
  if (!truth) {
    shown = real + randInt(rand, 1, 3) * (rand() < 0.5 ? -1 : 1);
    if (shown === real) shown = real + 1;
  }
  return { a, b, op, shown, truth };
}
