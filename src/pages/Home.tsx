import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Header } from '../components/Header';
import { Mascot } from '../components/Mascot';
import type { Expression } from '../components/Mascot';
import { ChunkyButton } from '../components/ChunkyButton';
import { GameCard } from '../components/GameCard';
import { GAMES } from '../games/registry';
import { dailyLineup, useCurrentDateKey } from '../core/daily';
import { useIdle } from '../core/idle';
import { sfx } from '../core/sound';
import { useI18n } from '../i18n';

export default function Home() {
  const { t, locale } = useI18n();
  const nav = useNavigate();
  const dateKey = useCurrentDateKey();
  const lineupNames = useMemo(() => {
    const ids = dailyLineup(
      dateKey,
      GAMES.map((g) => g.id),
    );
    return ids
      .map((id) => GAMES.find((g) => g.id === id)?.name[locale])
      .filter(Boolean)
      .join(' · ');
  }, [dateKey, locale]);

  const roulette = () => {
    sfx.unlock();
    sfx.play('coin');
    nav(`/play/${GAMES[Math.floor(Math.random() * GAMES.length)].id}`);
  };

  const idle = useIdle();
  const expression: Expression =
    idle === 'sleep' ? 'sleep' : idle === 'yawn' ? 'yawn' : 'happy';
  useEffect(() => {
    document.title = idle === 'sleep' ? 'zzz… | ihavenothingtodo' : 'ihavenothingtodo';
    return () => {
      document.title = 'ihavenothingtodo';
    };
  }, [idle]);

  return (
    <div className="min-h-dvh">
      <Header />
      <main className="mx-auto max-w-3xl px-5 pb-16">
        <section className="flex flex-col items-center pt-6 pb-12 text-center">
          <Mascot expression={expression} size={110} />
          <p className="mt-3 font-bold text-ink-soft">{t('site.tagline')}</p>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className="mt-6"
          >
            <ChunkyButton size="xl" color="coral" onClick={roulette}>
              {t('home.bored')}
            </ChunkyButton>
          </motion.div>
          <p className="mt-3 text-sm text-ink-soft">{t('home.bored.sub')}</p>
        </section>

        <section className="rounded-3xl border-[3px] border-ink bg-teal-dark p-6 text-cream shadow-[0_6px_0_0_var(--color-ink)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-pixel text-[10px] opacity-80">{dateKey}</p>
              <h2 className="mt-1 font-display text-2xl">{t('home.daily.title')}</h2>
              <p className="mt-1 max-w-sm text-sm opacity-90">{t('home.daily.sub')}</p>
              <p className="mt-2 text-xs font-bold opacity-80">{lineupNames}</p>
            </div>
            <ChunkyButton color="amber" size="lg" onClick={() => nav('/daily')}>
              {t('home.daily.cta')}
            </ChunkyButton>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 font-display text-2xl">{t('home.grid.title')}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {GAMES.map((meta, i) => (
              <motion.div
                key={meta.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <GameCard meta={meta} />
              </motion.div>
            ))}
          </div>
        </section>

        <footer className="mt-14 text-center text-sm text-ink-soft">{t('home.footer')}</footer>
      </main>
    </div>
  );
}
