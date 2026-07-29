import { useEffect, useState } from 'react';
import { hashString, mulberry32, seededShuffle } from './rng';

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function dailySeed(key: string): number {
  return hashString(`ihnttd:${key}`);
}

export function dailyLineup<T extends string>(key: string, allIds: readonly T[], count = 5): T[] {
  return seededShuffle(allIds, mulberry32(dailySeed(key))).slice(0, count);
}

export function stageSeed(key: string, index: number): number {
  return hashString(`${key}#${index}`);
}

export interface DailyRun<T extends string> {
  readonly dateKey: string;
  readonly lineup: readonly T[];
}

export function dailyRunSnapshot<T extends string>(
  key: string,
  allIds: readonly T[],
  count = 5,
): DailyRun<T> {
  const lineup = Object.freeze(dailyLineup(key, allIds, count));
  return Object.freeze({ dateKey: key, lineup });
}

export function msUntilNextLocalDay(d = new Date()): number {
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  return Math.max(0, next.getTime() - d.getTime());
}

export function useCurrentDateKey(): string {
  const [key, setKey] = useState(() => todayKey());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      setKey(todayKey());
      clearTimeout(timer);
      timer = setTimeout(refresh, msUntilNextLocalDay() + 50);
    };
    const onVisibility = () => {
      if (!document.hidden) refresh();
    };

    timer = setTimeout(refresh, msUntilNextLocalDay() + 50);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return key;
}
