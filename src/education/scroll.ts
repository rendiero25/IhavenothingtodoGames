import type { EducationStop } from './types';

export type EducationScrollEntry = EducationStop & {
  top: number;
  height: number;
};

export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  if (value < 0) {
    return 0;
  }

  if (value > 1) {
    return 1;
  }

  return value;
}

export function getStopProgress(top: number, height: number, viewportHeight: number): number {
  if (!Number.isFinite(top) || !Number.isFinite(height) || !Number.isFinite(viewportHeight)) {
    return 0;
  }

  if (height <= 0 || viewportHeight <= 0) {
    return 0;
  }

  const rawProgress = (viewportHeight - top) / (viewportHeight + height);

  return clampProgress(rawProgress);
}

export function getActiveStopId(
  entries: readonly EducationScrollEntry[],
  viewportCenter: number,
): string | null {
  if (!Number.isFinite(viewportCenter) || entries.length === 0) {
    return null;
  }

  let activeId: string | null = null;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const entry of entries) {
    if (!Number.isFinite(entry.top) || !Number.isFinite(entry.height)) {
      continue;
    }

    const entryCenter = entry.top + entry.height / 2;
    const distance = Math.abs(entryCenter - viewportCenter);

    if (distance < closestDistance) {
      closestDistance = distance;
      activeId = entry.id;
    }
  }

  return activeId;
}
