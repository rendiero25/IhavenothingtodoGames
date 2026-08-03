import { Brain, Calculator, ChevronRight, Crosshair, Hash, Move, Music, Target, Type, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useI18n } from '../i18n';
import type { GameMeta, IconKey } from '../games/types';

const ICONS: Record<IconKey, LucideIcon> = {
  zap: Zap,
  target: Target,
  brain: Brain,
  hash: Hash,
  type: Type,
  calculator: Calculator,
  move: Move,
  music: Music,
  crosshair: Crosshair,
};

const ACCENTS: Record<GameMeta['accent'], string> = {
  coral: 'bg-coral text-cream',
  teal: 'bg-teal text-cream',
  amber: 'bg-amber text-ink',
  pink: 'bg-pink text-cream',
};

interface GameCardProps {
  meta: GameMeta;
  index: number;
  selected?: boolean;
  onSelect: () => void;
}

export function GameCard({ meta, index, selected = false, onSelect }: GameCardProps) {
  const { locale, t } = useI18n();
  const Icon = ICONS[meta.icon];
  const catKey = `cat.${meta.category}` as const;

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={`group flex min-h-[76px] w-[190px] shrink-0 cursor-pointer items-center rounded-2xl border-[3px] border-ink text-left
          shadow-[0_4px_0_0_var(--color-ink)] outline-none transition-[transform,box-shadow,background-color] duration-150 ease-out
          active:translate-y-1 active:shadow-none focus-visible:ring-[4px] focus-visible:ring-coral focus-visible:ring-offset-3
          sm:w-[230px] lg:min-h-[82px] lg:w-full
          ${selected ? 'bg-coral text-ink' : 'bg-paper text-ink hover:bg-amber/25'}`}
      >
        <span
          className={`grid min-h-[70px] w-11 shrink-0 place-items-center self-stretch rounded-l-[12px] border-r-[3px] border-ink font-pixel text-[12px] lg:min-h-[76px] ${
            selected ? 'bg-ink text-cream' : 'bg-teal-dark text-cream'
          }`}
        >
          {index + 1}
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
          <div className={`inline-flex shrink-0 rounded-lg border-[2px] border-ink p-2 ${ACCENTS[meta.accent]}`}>
            <Icon size={21} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-display text-lg leading-tight">{meta.name[locale]}</h3>
            <p className={`mt-0.5 truncate text-[10px] font-extrabold uppercase tracking-[0.12em] ${
              selected ? 'text-ink/70' : 'text-ink-soft'
            }`}>
              {t(catKey)}
            </p>
            <p className={`mt-1 hidden truncate text-xs lg:block ${
              selected ? 'text-ink/80' : 'text-ink-soft'
            }`}>
              {meta.tagline[locale]}
            </p>
          </div>
        </div>
        <ChevronRight
          aria-hidden="true"
          className={`mr-3 hidden shrink-0 transition-transform duration-150 ease-out group-hover:translate-x-1 lg:block ${
            'text-ink'
          }`}
          size={22}
          strokeWidth={3}
        />
      </button>
    </motion.div>
  );
}
