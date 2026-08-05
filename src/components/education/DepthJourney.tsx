import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import {
  getActiveStopId,
  getScrollAnchorDelta,
  getStopProgress,
  type EducationScrollEntry,
} from '../../education/scroll';
import type { EducationStop } from '../../education/types';
import { useI18n } from '../../i18n';
import { DepthRuler, getDepthLabel } from './DepthRuler';
import { DiscoveryCard } from './DiscoveryCard';
import { LayerBand } from './LayerBand';
import { ObjectScene } from './ObjectScene';

const OBSERVER_ROOT_MARGIN = '-45% 0px -45% 0px';

interface EducationScrollAnchor {
  stopId: string;
  top: number;
  scrollY: number;
}

const JOURNEY_MOTION_STYLES = `
@keyframes journey-reveal {
  0% {
    opacity: 0;
    transform: translate3d(0, 16px, 0);
  }

  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

@keyframes journey-settle {
  0% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }

  100% {
    opacity: 0.72;
    transform: translate3d(0, 10px, 0);
  }
}

@keyframes journey-idle {
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }

  50% {
    transform: translate3d(0, -2px, 0);
  }
}

[data-reduced-motion='false'] .journey-reveal {
  animation: journey-reveal 360ms ease-out both;
}

[data-reduced-motion='false'] .journey-settle {
  animation: journey-settle 320ms ease-out both;
}

[data-reduced-motion='false'] .journey-idle {
  animation: journey-idle 6s ease-in-out infinite;
}

[data-reduced-motion='true'] .journey-reveal,
[data-reduced-motion='true'] .journey-settle,
[data-reduced-motion='true'] .journey-idle {
  animation: none !important;
  transform: none !important;
}
`;

export interface DepthJourneyProps {
  stops: readonly EducationStop[];
}

export function DepthJourney({ stops }: DepthJourneyProps) {
  const { locale } = useI18n();
  const reducedMotion = useReducedMotion() ?? false;
  const sectionRefs = useRef(new Map<string, HTMLElement>());
  const scrollAnchorRef = useRef<EducationScrollAnchor | null>(null);
  const previousLocaleRef = useRef(locale);
  const [activeStopId, setActiveStopId] = useState(stops[0]?.id ?? '');
  const [progressById, setProgressById] = useState<Record<string, number>>({});
  const stopIdsKey = useMemo(() => stops.map((stop) => stop.id).join('\u0000'), [stops]);

  const refreshJourneyState = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const viewportHeight = window.innerHeight;
    const entries: EducationScrollEntry[] = [];
    const nextProgress: Record<string, number> = {};

    for (const stop of stops) {
      const section = sectionRefs.current.get(stop.id);

      if (!section) {
        nextProgress[stop.id] = 0;
        continue;
      }

      const rect = section.getBoundingClientRect();
      entries.push({
        ...stop,
        top: rect.top,
        height: rect.height,
      });
      nextProgress[stop.id] = getStopProgress(rect.top, rect.height, viewportHeight);
    }

    const nextActiveStopId = getActiveStopId(entries, viewportHeight / 2) ?? stops[0]?.id ?? '';
    const activeSection = sectionRefs.current.get(nextActiveStopId);

    if (activeSection) {
      const activeRect = activeSection.getBoundingClientRect();
      scrollAnchorRef.current = {
        stopId: nextActiveStopId,
        top: activeRect.top,
        scrollY: Number.isFinite(window.scrollY) ? window.scrollY : 0,
      };
    }

    setActiveStopId((current) => (current === nextActiveStopId ? current : nextActiveStopId));
    setProgressById(nextProgress);
  }, [stops]);

  useEffect(() => {
    setActiveStopId(stops[0]?.id ?? '');
    setProgressById(
      Object.fromEntries(stops.map((stop) => [stop.id, 0])) as Record<string, number>,
    );
    scrollAnchorRef.current = null;
  }, [stopIdsKey]);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const previousLocale = previousLocaleRef.current;
    previousLocaleRef.current = locale;

    if (previousLocale === locale) {
      return;
    }

    const anchor = scrollAnchorRef.current;

    if (anchor) {
      const section = sectionRefs.current.get(anchor.stopId);

      if (section) {
        const nextTop = section.getBoundingClientRect().top;
        const correction = getScrollAnchorDelta(anchor.top, nextTop);

        if (correction !== 0 && typeof window.scrollBy === 'function') {
          window.scrollBy({ top: correction, left: 0, behavior: 'auto' });
        }

        scrollAnchorRef.current = {
          ...anchor,
          top: section.getBoundingClientRect().top,
          scrollY: Number.isFinite(window.scrollY) ? window.scrollY : anchor.scrollY,
        };
      } else if (typeof window.scrollTo === 'function') {
        window.scrollTo({ top: anchor.scrollY, left: 0, behavior: 'auto' });
      }

      setActiveStopId(anchor.stopId);
    }

    const frame = window.requestAnimationFrame(() => {
      refreshJourneyState();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [locale, refreshJourneyState]);

  useEffect(() => {
    if (stops.length === 0 || typeof window === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      () => {
        refreshJourneyState();
      },
      {
        root: null,
        rootMargin: OBSERVER_ROOT_MARGIN,
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );

    for (const stop of stops) {
      const section = sectionRefs.current.get(stop.id);
      if (section) {
        observer.observe(section);
      }
    }

    const handleViewportChange = () => {
      refreshJourneyState();
    };

    window.addEventListener('scroll', handleViewportChange, { passive: true });
    window.addEventListener('resize', handleViewportChange);
    refreshJourneyState();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleViewportChange);
      window.removeEventListener('resize', handleViewportChange);
    };
  }, [refreshJourneyState, stops]);

  const activeStop = useMemo(
    () => stops.find((stop) => stop.id === activeStopId) ?? stops[0] ?? null,
    [activeStopId, stops],
  );

  const handleSelectStop = useCallback(
    (stopId: string) => {
      setActiveStopId(stopId);
      const section = sectionRefs.current.get(stopId);

      if (section && typeof window !== 'undefined') {
        scrollAnchorRef.current = {
          stopId,
          top: section.getBoundingClientRect().top,
          scrollY: Number.isFinite(window.scrollY) ? window.scrollY : 0,
        };
      }

      section?.scrollIntoView({
        block: 'center',
        inline: 'nearest',
        behavior: reducedMotion ? 'auto' : 'smooth',
      });
    },
    [reducedMotion],
  );

  if (!activeStop) {
    return null;
  }

  const activeProgress = progressById[activeStop.id] ?? 0;

  return (
    <div className="min-w-0" data-reduced-motion={reducedMotion ? 'true' : 'false'}>
      <style>{JOURNEY_MOTION_STYLES}</style>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(12rem,15rem)_minmax(0,1fr)_minmax(18rem,24rem)] lg:gap-8">
        <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <DepthRuler stops={stops} activeStopId={activeStop.id} onSelect={handleSelectStop} />
        </aside>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="journey-reveal">
            <LayerBand layer={activeStop.layer} active progress={activeProgress} />
          </div>

          <div key={`scene-${activeStop.id}`} className="journey-reveal">
            <ObjectScene stop={activeStop} active reducedMotion={reducedMotion} />
          </div>

          <div key={`card-${activeStop.id}`} className="journey-reveal">
            <DiscoveryCard stop={activeStop} />
          </div>
        </aside>

        <div className="min-w-0">
          <ol className="space-y-5">
            {stops.map((stop) => {
              const isActive = stop.id === activeStop.id;
              const depthLabel = getDepthLabel(stop.depthMeters, locale);

              return (
                <li key={stop.id}>
                  <section
                    id={`education-stop-${stop.id}`}
                    ref={(node) => {
                      if (node) {
                        sectionRefs.current.set(stop.id, node);
                      } else {
                        sectionRefs.current.delete(stop.id);
                      }
                    }}
                    data-stop-id={stop.id}
                    data-active={isActive ? 'true' : 'false'}
                    aria-labelledby={`education-stop-title-${stop.id}`}
                    className={[
                      'rounded-[2rem] border px-5 py-8 scroll-mt-24 sm:px-6 sm:py-10',
                      'min-h-[52svh] lg:min-h-[64svh]',
                      'transition-[opacity,transform,border-color] duration-300 motion-reduce:transition-none',
                      isActive ? 'border-ink/22 bg-paper text-ink journey-reveal' : 'border-ink/12 text-ink/70 journey-settle',
                    ].join(' ')}
                  >
                    <div className="flex h-full flex-col justify-center gap-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="max-w-2xl">
                          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink/62">
                            {depthLabel}
                          </p>
                          <h3
                            id={`education-stop-title-${stop.id}`}
                            className="mt-3 text-balance font-geist text-[clamp(1.75rem,3vw,2.75rem)] leading-tight"
                          >
                            {stop.title[locale]}
                          </h3>
                        </div>
                        <span
                          className={[
                            'inline-flex min-h-11 items-center rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em]',
                            isActive ? 'border-ink/22 text-ink journey-idle' : 'border-ink/12 text-ink/58',
                          ].join(' ')}
                        >
                          {stop.layer}
                        </span>
                      </div>

                      <p className="max-w-2xl text-sm leading-7 text-current/92">{stop.fact[locale]}</p>
                    </div>
                  </section>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
