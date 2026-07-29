import { Brain, Calculator, Hash, Move, Music, Target, Type, Zap } from 'lucide-react';
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
};

const ACCENTS: Record<GameMeta['accent'], string> = {
  coral: 'bg-coral text-cream',
  teal: 'bg-teal text-cream',
  amber: 'bg-amber text-ink',
  pink: 'bg-pink text-cream',
};

interface GameCardProps {
  meta: GameMeta;
  selected?: boolean;
  onSelect: () => void;
}

export function GameCard({ meta, selected = false, onSelect }: GameCardProps) {
  const { locale, t } = useI18n();
  const Icon = ICONS[meta.icon];
  const catKey = `cat.${meta.category}` as const;

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={`flex w-full cursor-pointer items-center gap-5 rounded-2xl border-[3px] border-ink p-5 text-left
          shadow-[0_5px_0_0_var(--color-ink)] active:translate-y-[5px] active:shadow-none
          transition-[transform,box-shadow,background-color] duration-100
          ${selected ? 'bg-amber' : 'bg-paper'}`}
      >
        <div className={`inline-flex shrink-0 rounded-xl border-[3px] border-ink p-3 ${ACCENTS[meta.accent]}`}>
          <Icon size={28} strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-xl leading-tight">{meta.name[locale]}</h3>
          <p className="mt-0.5 text-xs font-bold uppercase tracking-wider text-ink-soft">{t(catKey)}</p>
          <p className="mt-1.5 text-sm leading-snug text-ink-soft">{meta.tagline[locale]}</p>
        </div>
      </button>
    </motion.div>
  );
}
