import { ArrowUpRight } from 'lucide-react';
import { useI18n } from '../i18n';
import type { GameMeta } from '../games/types';

interface GameCardProps {
  meta: GameMeta;
  index: number;
  selected?: boolean;
  onPreview: () => void;
  onSelect: () => void;
}

export function GameCard({
  meta,
  index,
  selected = false,
  onPreview,
  onSelect,
}: GameCardProps) {
  const { locale, t } = useI18n();
  const catKey = `cat.${meta.category}` as const;

  return (
    <button
      type="button"
      onMouseEnter={onPreview}
      onFocus={onPreview}
      onClick={onSelect}
      aria-current={selected ? 'true' : undefined}
      className="game-list-item group grid w-full cursor-pointer grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-ink/20 py-5 text-left outline-none transition-colors duration-200 ease-out hover:bg-ink hover:text-paper focus-visible:bg-ink focus-visible:text-paper sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:py-6"
    >
      <span className="font-mono text-[11px] tabular-nums opacity-55 sm:text-xs">
        {String(index + 1).padStart(2, '0')}
      </span>
      <span className="min-w-0">
        <span className="block font-pixel text-[clamp(1.45rem,4.2vw,3.9rem)] leading-[0.95] tracking-[-0.045em]">
          {meta.name[locale]}
        </span>
        <span className="mt-2 block font-mono text-[10px] uppercase tracking-[0.12em] opacity-55 sm:hidden">
          {t(catKey)}
        </span>
      </span>
      <span className="flex items-center gap-3">
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.12em] opacity-55 sm:block">
          {t(catKey)}
        </span>
        <span className="grid size-9 place-items-center border border-current transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
          <ArrowUpRight aria-hidden="true" size={16} strokeWidth={1.7} />
        </span>
      </span>
    </button>
  );
}
