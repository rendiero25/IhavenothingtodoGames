export function extendSequence(seq: readonly number[], rand: () => number): number[] {
  return [...seq, Math.floor(rand() * 4)];
}

export function playbackMs(round: number): number {
  return Math.max(260, Math.round(650 * Math.pow(0.96, round - 1)));
}
