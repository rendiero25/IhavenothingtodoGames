import type { EducationCategory, EducationStop, EducationVisual } from '../../education/types';
import { useI18n } from '../../i18n';

export interface ObjectSceneProps {
  stop: EducationStop;
  active: boolean;
  reducedMotion: boolean;
}

const SCENE_KEYFRAMES = `
@keyframes scene-reveal {
  0% {
    opacity: 0;
    transform: translate3d(0, 12px, 0) scale(0.985);
  }

  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
}

@keyframes scene-settle {
  0% {
    opacity: 0.96;
    transform: translate3d(0, 0, 0) scale(1);
  }

  100% {
    opacity: 0.9;
    transform: translate3d(0, 6px, 0) scale(0.992);
  }
}

@keyframes scene-idle {
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }

  50% {
    transform: translate3d(0, -4px, 0);
  }
}
`;

const VISUAL_KIND_TO_RENDERER = {
  cutaway: 'surface',
  roots: 'network',
  'soil-food-web': 'network',
  pipes: 'network',
  'water-table': 'water',
  tunnel: 'tunnel',
  'fossil-wall': 'strata',
  'mine-shaft': 'shaft',
  drill: 'shaft',
  boundary: 'boundary',
  'mantle-flow': 'flow',
  'liquid-core': 'core',
  'solid-core': 'core',
} as const satisfies Record<string, string>;

type VisualRendererKind = (typeof VISUAL_KIND_TO_RENDERER)[keyof typeof VISUAL_KIND_TO_RENDERER] | 'line';

const CATEGORY_TOKENS: Record<EducationCategory, string> = {
  life: 'moss',
  human: 'signal',
  geology: 'strata',
  tech: 'circuit',
};

export function getVisualRendererKind(visual: EducationVisual): VisualRendererKind {
  return VISUAL_KIND_TO_RENDERER[visual.kind as keyof typeof VISUAL_KIND_TO_RENDERER] ?? 'line';
}

export function getCategoryToken(category: EducationCategory): string {
  return CATEGORY_TOKENS[category];
}

export function getVisualLabel(visual: EducationVisual, locale: 'id' | 'en'): string {
  return visual.label[locale];
}

function sceneClassName(active: boolean, reducedMotion: boolean) {
  if (reducedMotion) return 'opacity-100';
  return active
    ? 'opacity-100 transition duration-500 ease-out motion-safe:animate-[scene-reveal_560ms_ease-out]'
    : 'opacity-90 transition duration-500 ease-out motion-safe:animate-[scene-settle_4.8s_ease-in-out_infinite]';
}

function renderScene(kind: VisualRendererKind) {
  const stroke = 'currentColor';

  switch (kind) {
    case 'surface':
      return (
        <svg viewBox="0 0 240 160" className="h-full w-full" aria-hidden="true">
          <rect x="16" y="76" width="208" height="56" rx="18" fill="none" stroke={stroke} strokeWidth="4" />
          <path d="M36 78C70 48 104 48 136 78" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
          <path d="M120 42V78" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
          <path d="M120 42C108 34 98 34 88 42" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
          <path d="M120 52C130 42 142 42 152 52" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case 'network':
      return (
        <svg viewBox="0 0 240 160" className="h-full w-full" aria-hidden="true">
          <path d="M120 18V58" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
          <path d="M120 58C88 64 72 86 64 126" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
          <path d="M120 58C148 68 168 90 178 126" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
          <path d="M120 72C108 84 96 100 92 128" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M120 72C136 84 146 100 152 128" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="64" cy="126" r="10" fill="none" stroke={stroke} strokeWidth="4" />
          <circle cx="178" cy="126" r="10" fill="none" stroke={stroke} strokeWidth="4" />
        </svg>
      );
    case 'water':
      return (
        <svg viewBox="0 0 240 160" className="h-full w-full" aria-hidden="true">
          <rect x="22" y="34" width="196" height="92" rx="18" fill="none" stroke={stroke} strokeWidth="4" />
          <path d="M42 86C58 72 76 72 92 86C108 100 126 100 142 86C158 72 176 72 198 86" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
          <path d="M42 104C58 92 76 92 92 104C108 116 126 116 142 104C158 92 176 92 198 104" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      );
    case 'tunnel':
      return (
        <svg viewBox="0 0 240 160" className="h-full w-full" aria-hidden="true">
          <path d="M44 126V86C44 52 76 24 120 24C164 24 196 52 196 86V126" fill="none" stroke={stroke} strokeWidth="4" />
          <path d="M72 126V94C72 72 92 54 120 54C148 54 168 72 168 94V126" fill="none" stroke={stroke} strokeWidth="3.5" />
          <path d="M84 126H156" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
          <circle cx="120" cy="92" r="6" fill="currentColor" />
        </svg>
      );
    case 'strata':
      return (
        <svg viewBox="0 0 240 160" className="h-full w-full" aria-hidden="true">
          <rect x="28" y="26" width="184" height="108" rx="16" fill="none" stroke={stroke} strokeWidth="4" />
          <path d="M48 60C76 54 98 66 120 60C146 54 166 46 192 60" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M48 88C74 80 96 94 122 88C148 82 170 74 192 88" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M48 114C70 108 96 118 122 114C146 110 168 102 192 114" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M86 74C98 64 112 64 124 74C112 84 98 84 86 74Z" fill="none" stroke={stroke} strokeWidth="3.5" />
        </svg>
      );
    case 'shaft':
      return (
        <svg viewBox="0 0 240 160" className="h-full w-full" aria-hidden="true">
          <rect x="88" y="18" width="64" height="124" rx="16" fill="none" stroke={stroke} strokeWidth="4" />
          <path d="M120 18V142" fill="none" stroke={stroke} strokeWidth="3.5" strokeDasharray="8 8" />
          <path d="M60 36H180" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
          <path d="M72 56H96" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
          <path d="M144 106H168" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case 'boundary':
      return (
        <svg viewBox="0 0 240 160" className="h-full w-full" aria-hidden="true">
          <path d="M26 48H214" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
          <path d="M26 86H214" fill="none" stroke={stroke} strokeWidth="4" strokeDasharray="10 8" strokeLinecap="round" />
          <path d="M26 124H214" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
          <circle cx="120" cy="86" r="16" fill="none" stroke={stroke} strokeWidth="4" />
        </svg>
      );
    case 'flow':
      return (
        <svg viewBox="0 0 240 160" className="h-full w-full" aria-hidden="true">
          <path d="M56 50C86 16 152 16 184 50" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
          <path d="M56 110C86 144 152 144 184 110" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
          <path d="M70 82H170" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
          <path d="M154 68L170 82L154 96" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M86 42L72 54" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
          <path d="M154 118L168 106" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case 'core':
      return (
        <svg viewBox="0 0 240 160" className="h-full w-full" aria-hidden="true">
          <circle cx="120" cy="80" r="54" fill="none" stroke={stroke} strokeWidth="4" />
          <circle cx="120" cy="80" r="34" fill="none" stroke={stroke} strokeWidth="4" strokeDasharray="9 7" />
          <circle cx="120" cy="80" r="14" fill="currentColor" />
        </svg>
      );
    case 'line':
    default:
      return (
        <svg viewBox="0 0 240 160" className="h-full w-full" aria-hidden="true">
          <rect x="24" y="28" width="192" height="104" rx="18" fill="none" stroke={stroke} strokeWidth="4" />
          <path d="M52 104L92 64L124 92L180 52" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="52" cy="104" r="5" fill="currentColor" />
          <circle cx="92" cy="64" r="5" fill="currentColor" />
          <circle cx="124" cy="92" r="5" fill="currentColor" />
          <circle cx="180" cy="52" r="5" fill="currentColor" />
        </svg>
      );
  }
}

export function ObjectScene({ stop, active, reducedMotion }: ObjectSceneProps) {
  const { locale } = useI18n();
  const rendererKind = getVisualRendererKind(stop.visual);
  const categoryToken = getCategoryToken(stop.category);
  const idleClassName = reducedMotion ? '' : 'motion-safe:animate-[scene-idle_6s_ease-in-out_infinite]';

  return (
    <figure
      className={`relative overflow-hidden rounded-[2rem] border border-current/20 bg-paper px-5 py-6 text-ink ${sceneClassName(active, reducedMotion)}`}
      data-active={active ? 'true' : 'false'}
      data-motion={reducedMotion ? 'reduced' : 'full'}
      data-category-token={categoryToken}
      data-renderer-kind={rendererKind}
    >
      <style>{SCENE_KEYFRAMES}</style>
      <div className="relative">
        <div className={`mx-auto aspect-[3/2] w-full max-w-[15rem] text-ink ${idleClassName}`}>
          {renderScene(rendererKind)}
        </div>
        <figcaption className="mt-4 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-ink/78">
          {getVisualLabel(stop.visual, locale)}
        </figcaption>
      </div>
    </figure>
  );
}
