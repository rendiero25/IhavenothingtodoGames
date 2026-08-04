import { ArrowUpRight } from 'lucide-react';
import { useI18n } from '../i18n';
import type { GameMeta } from '../games/types';

interface GameCardProps {
  meta: GameMeta;
  index: number;
  distance?: number;
  selected?: boolean;
  onPreview: () => void;
  onSelect: () => void;
}

export function GameCard({
  meta,
  index,
  distance = 0,
  selected = false,
  onPreview,
  onSelect,
}: GameCardProps) {
  const { locale, t } = useI18n();
  const catKey = `cat.${meta.category}` as const;
  const wheelDistance = Math.min(Math.abs(distance), 3);
  const wheelScale = [1, 0.92, 0.82, 0.72][wheelDistance];
  const wheelOpacity = [1, 0.78, 0.5, 0.28][wheelDistance];
  const wheelRotation = Math.max(-16, Math.min(16, distance * 7));

  return (
    <button
      type="button"
      id={`game-row-${meta.id}`}
      onMouseEnter={onPreview}
      onFocus={onPreview}
      onClick={onSelect}
      aria-current={selected ? 'true' : undefined}
      style={{
        opacity: wheelOpacity,
        transform: `perspective(850px) rotateX(${wheelRotation}deg) scale(${wheelScale})`,
      }}
      className={`game-list-item origin-center group grid w-full cursor-pointer grid-cols-[2.4rem_minmax(0,1fr)_auto] items-center gap-3 py-5 text-left outline-none transition-[color,transform,opacity] duration-300 ease-out sm:grid-cols-[3.5rem_minmax(0,1fr)_auto] sm:py-7 xl:py-8 ${selected ? 'text-ink' : 'text-ink/55 hover:text-ink/85 focus-visible:text-ink'}`}
    >
      <span className="font-mono text-[10px] tabular-nums opacity-70 sm:text-xs">
        {String(index + 1).padStart(2, '0')}
      </span>
      <span className="min-w-0">
        <span className="block font-pixel text-[clamp(2.35rem,5.7vw,6.5rem)] leading-[0.84] tracking-[-0.065em]">
          {meta.name[locale]}
        </span>
        <span className="mt-2 block font-mono text-[9px] uppercase tracking-[0.12em] text-ink sm:hidden">
          {t(catKey)}
        </span>
      </span>
      <span className="flex items-center gap-3">
        <span className="hidden font-mono text-[9px] uppercase tracking-[0.12em] text-ink sm:block">
          {t(catKey)}
        </span>
        <span className="grid size-8 place-items-center text-ink transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5 sm:size-9">
          <ArrowUpRight aria-hidden="true" size={16} strokeWidth={1.7} />
        </span>
      </span>
    </button>
  );
}
