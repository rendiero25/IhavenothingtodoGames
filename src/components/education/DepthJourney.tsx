import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { EDUCATION_JOURNEY_ASSET } from '../../education/assets';
import type { EducationStop } from '../../education/types';
import { useI18n } from '../../i18n';

const STOP_FOCUS: Record<string, number> = {
  'surface-life': 0,
  'root-zone': 4,
  'soil-organisms': 13,
  'utility-corridor': 23,
  'groundwater-aquifer': 31,
  'subway-depth': 41,
  'cave-fossils': 51,
  'deep-mine': 60,
  'deep-borehole': 68,
  'moho-boundary': 73,
  'upper-mantle': 80,
  'outer-core': 90,
  'inner-core': 100,
};

const JOURNEY_MOTION_STYLES = `
@keyframes education-copy-fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.education-earth-stage {
  background-position: center top;
  background-repeat: no-repeat;
  background-size: 300vw auto;
}

@media (min-width: 640px) {
  .education-earth-stage {
    background-size: 180vw auto;
  }
}

@media (min-width: 1024px) {
  .education-earth-stage {
    background-size: 100vw auto;
  }
}

[data-reduced-motion='false'] .education-copy-enter {
  animation: education-copy-fade-in 620ms ease-out both;
}

[data-reduced-motion='true'] .education-copy-enter {
  opacity: 1;
  animation: none !important;
}

@media (prefers-reduced-motion: reduce) {
  .education-copy-enter {
    opacity: 1;
    animation: none !important;
  }
}
`;

export interface DepthJourneyProps {
  stops: readonly EducationStop[];
  introTitle?: string;
  introDescription?: string;
}

export function DepthJourney({ stops, introTitle, introDescription }: DepthJourneyProps) {
  const { locale } = useI18n();
  const reducedMotion = useReducedMotion() ?? false;
  const sectionRefs = useRef(new Map<string, HTMLElement>());
  const [activeIndex, setActiveIndex] = useState(0);
  const stopIdsKey = stops.map((stop) => stop.id).join('\u0000');
  const activeStop = stops[activeIndex] ?? stops[0];
  const isSurface = activeIndex === 0;
  const activeTitle = isSurface && introTitle ? introTitle : activeStop?.title[locale] ?? '';
  const activeDescription = isSurface && introDescription
    ? introDescription
    : activeStop?.fact[locale] ?? '';
  const activeFocus = activeStop ? STOP_FOCUS[activeStop.id] ?? 50 : 0;

  useEffect(() => {
    setActiveIndex(0);
  }, [stopIdsKey]);

  useEffect(() => {
    if (stops.length === 0 || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const activeEntry = entries.find((entry) => entry.isIntersecting);
        if (!activeEntry) return;

        const nextIndex = Number(activeEntry.target.getAttribute('data-stop-index'));
        if (!Number.isInteger(nextIndex)) return;

        setActiveIndex((currentIndex) => currentIndex === nextIndex ? currentIndex : nextIndex);
      },
      { rootMargin: '-48% 0px -48% 0px', threshold: 0 },
    );

    for (const stop of stops) {
      const section = sectionRefs.current.get(stop.id);
      if (section) observer.observe(section);
    }

    return () => observer.disconnect();
  }, [stopIdsKey, stops]);

  if (!activeStop) return null;

  return (
    <div
      className="relative min-w-0 bg-[#080a0a]"
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
      data-journey-count={stops.length}
      data-active-stop-id={activeStop.id}
      data-active-focus={activeFocus}
    >
      <style>{JOURNEY_MOTION_STYLES}</style>

      <div
        aria-hidden="true"
        className={`education-earth-stage sticky top-0 z-0 h-[100svh] overflow-hidden bg-[#080a0a] ${reducedMotion ? '' : 'transition-[background-position] duration-700 ease-out'}`}
        style={{
          backgroundImage: `url(${EDUCATION_JOURNEY_ASSET})`,
          backgroundPosition: isSurface ? 'center top' : `center ${activeFocus}%`,
        }}
      >

        <div
          className={`pointer-events-none absolute inset-0 z-10 flex px-6 pb-12 sm:px-10 sm:pb-16 lg:px-[8vw] ${isSurface ? 'items-start pt-[18svh] sm:pt-[20svh] lg:pt-[22svh]' : 'items-center'}`}
        >
          <div
            key={`${activeStop.id}-${locale}`}
            className={`education-copy-enter w-full ${isSurface ? 'max-w-5xl' : 'ml-auto max-w-xl lg:w-[36vw]'}`}
            style={{ textShadow: '0 2px 18px rgb(0 0 0 / 0.98), 0 1px 4px rgb(0 0 0 / 1)' }}
          >
            <p
              className={`text-balance font-pixel tracking-[-0.065em] text-white ${isSurface ? 'text-[clamp(3.4rem,10vw,9.5rem)] leading-[0.82]' : 'text-[clamp(2.4rem,5vw,5.8rem)] leading-[0.88]'}`}
            >
              {activeTitle}
            </p>
            <p className={`max-w-2xl text-white/82 ${isSurface ? 'mt-8 text-base leading-8 sm:text-xl sm:leading-9' : 'mt-7 text-base leading-8 sm:text-lg'}`}>
              {activeDescription}
            </p>
          </div>
        </div>
      </div>

      <ol className="pointer-events-none relative z-10 -mt-[100svh] m-0 list-none p-0">
        {stops.map((stop, index) => (
          <li key={stop.id} className="min-h-[100svh]">
            <article
              id={`education-stop-${stop.id}`}
              ref={(node) => {
                if (node) {
                  sectionRefs.current.set(stop.id, node);
                } else {
                  sectionRefs.current.delete(stop.id);
                }
              }}
              data-stop-id={stop.id}
              data-stop-index={index}
              aria-labelledby={`education-stop-title-${stop.id}`}
              aria-describedby={`education-stop-description-${stop.id}`}
              className="h-[100svh]"
            >
              <h2 id={`education-stop-title-${stop.id}`} className="sr-only">
                {stop.title[locale]}
              </h2>
              <p id={`education-stop-description-${stop.id}`} className="sr-only">
                {stop.fact[locale]}
              </p>
            </article>
          </li>
        ))}
      </ol>
    </div>
  );
}
