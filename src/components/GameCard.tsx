import { Link } from 'react-router-dom';
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

export function GameCard({ meta }: { meta: GameMeta }) {
  const { locale, t } = useI18n();
  const Icon = ICONS[meta.icon];
  const catKey = `cat.${meta.category}` as const;

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
      <Link
        to={`/play/${meta.id}`}
        className="block rounded-2xl border-[3px] border-ink bg-paper p-4
          shadow-[0_5px_0_0_var(--color-ink)] active:translate-y-[5px] active:shadow-none
          transition-[transform,box-shadow] duration-100"
      >
        <div className={`inline-flex rounded-xl border-[3px] border-ink p-2.5 ${ACCENTS[meta.accent]}`}>
          <Icon size={24} strokeWidth={2.5} />
        </div>
        <h3 className="font-display text-lg mt-3 leading-tight">{meta.name[locale]}</h3>
        <p className="text-xs font-bold uppercase tracking-wider text-ink-soft mt-0.5">{t(catKey)}</p>
        <p className="text-sm text-ink-soft mt-1.5 leading-snug">{meta.tagline[locale]}</p>
      </Link>
    </motion.div>
  );
}
