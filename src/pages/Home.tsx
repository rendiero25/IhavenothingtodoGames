import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import { motion } from 'motion/react';
import { Header } from '../components/Header';
import { Mascot } from '../components/Mascot';
import type { Expression } from '../components/Mascot';
import { ChunkyButton } from '../components/ChunkyButton';
import { GameCard } from '../components/GameCard';
import { GAMES } from '../games/registry';
import { dailyLineup, todayKey, useCurrentDateKey } from '../core/daily';
import { useIdle } from '../core/idle';
import { hashString } from '../core/rng';
import { sfx } from '../core/sound';
import { useI18n } from '../i18n';
import type { GameId, GameResult } from '../games/types';
import { GameOver } from '../shell/GameOver';
import { GameShell } from '../shell/GameShell';

const homeSessionBests = new Map<string, number>();

export default function Home() {
  const { t, locale } = useI18n();
  const nav = useNavigate();
  const gamePanelRef = useRef<HTMLElement>(null);
  const isBest = useRef(false);
  const [selectedGameId, setSelectedGameId] = useState<GameId | null>(null);
  const [runId, setRunId] = useState(0);
  const [result, setResult] = useState<GameResult | null>(null);
  const dateKey = useCurrentDateKey();
  const selectedMeta = GAMES.find((game) => game.id === selectedGameId);
  const seed = useMemo(
    () => hashString(`home:${selectedGameId ?? 'none'}:${Date.now()}:${runId}`),
    [runId, selectedGameId],
  );
  const lineupNames = useMemo(() => {
    const ids = dailyLineup(
      dateKey,
      GAMES.map((game) => game.id),
    );
    return ids
      .map((id) => GAMES.find((game) => game.id === id)?.name[locale])
      .filter(Boolean)
      .join(' · ');
  }, [dateKey, locale]);

  const selectGame = (gameId: GameId) => {
    sfx.unlock();
    sfx.play('coin');
    setSelectedGameId(gameId);
    setResult(null);
    setRunId((value) => value + 1);
  };

  const roulette = () => {
    selectGame(GAMES[Math.floor(Math.random() * GAMES.length)].id);
  };

  const finishGame = (gameResult: GameResult) => {
    if (!selectedMeta) return;
    const previousBest = homeSessionBests.get(selectedMeta.id) ?? 0;
    isBest.current = gameResult.score > previousBest && previousBest > 0;
    if (gameResult.score > previousBest) homeSessionBests.set(selectedMeta.id, gameResult.score);
    if (isBest.current) sfx.play('record');
    setResult(gameResult);
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

  useEffect(() => {
    if (!selectedGameId || !window.matchMedia('(max-width: 1023px)').matches) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    gamePanelRef.current?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  }, [selectedGameId, runId]);

  const closeGame = () => {
    setSelectedGameId(null);
    setResult(null);
  };

  return (
    <div className="min-h-dvh overflow-x-hidden">
      <Header wide />
      <main className="mx-auto max-w-[1440px] px-5 pb-12">
        <section className="grid items-center gap-5 border-y-[3px] border-ink py-5 md:grid-cols-[1fr_auto]">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            <Mascot expression={expression} size={74} />
            <div className="min-w-0">
              <h1 className="font-display text-3xl leading-none sm:text-4xl">{t('site.tagline')}</h1>
              <p className="mt-2 text-sm font-bold text-ink-soft">{t('home.bored.sub')}</p>
            </div>
          </div>
          <ChunkyButton
            size="lg"
            color="coral"
            onClick={roulette}
            className="w-full md:w-auto md:min-w-56"
          >
            {t('home.bored')}
          </ChunkyButton>
        </section>

        <section className="mt-5 rounded-2xl border-[3px] border-ink bg-amber p-4 shadow-[0_5px_0_0_var(--color-ink)] sm:p-5">
          <div className="grid items-center gap-4 md:grid-cols-[auto_1fr_auto] md:gap-6">
            <div className="flex items-center gap-3 md:border-r-[1px] md:border-ink/40 md:pr-6">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl border-[3px] border-ink bg-paper">
                <CalendarDays size={25} strokeWidth={2.5} />
              </span>
              <div>
                <p className="font-pixel text-[9px] leading-relaxed">{dateKey}</p>
                <h2 className="font-display text-2xl leading-tight">{t('home.daily.title')}</h2>
              </div>
            </div>
            <div className="min-w-0">
              <p className="max-w-3xl text-sm font-bold leading-snug text-ink/80">
                {t('home.daily.sub')}
              </p>
              <p className="mt-2 truncate text-xs font-extrabold uppercase tracking-[0.08em] text-ink-soft">
                {lineupNames}
              </p>
            </div>
            <ChunkyButton
              color="teal"
              size="md"
              onClick={() => nav('/daily')}
              className="w-full md:w-auto"
            >
              {t('home.daily.cta')}
            </ChunkyButton>
          </div>
        </section>

        <section className="mt-7">
          <div className="grid items-start gap-6 lg:grid-cols-[400px_minmax(0,1fr)] xl:grid-cols-[430px_minmax(0,1fr)]">
            <nav aria-label={t('home.grid.title')} className="min-w-0">
              <h2 className="mb-4 font-display text-3xl">{t('home.grid.title')}</h2>
              <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-5 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
                {GAMES.map((meta, index) => (
                  <GameCard
                    key={meta.id}
                    meta={meta}
                    index={index}
                    selected={selectedGameId === meta.id}
                    onSelect={() => selectGame(meta.id)}
                  />
                ))}
              </div>
            </nav>

            <aside ref={gamePanelRef} className="scroll-mt-4 lg:sticky lg:top-4">
              {selectedMeta ? (
                <motion.div
                  key={selectedMeta.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-[28px] border-[3px] border-ink bg-teal-dark p-3 shadow-[0_7px_0_0_var(--color-ink)] sm:p-5"
                >
                  <div className="px-3 pb-3 text-center text-cream">
                    <h2 className="font-display text-3xl sm:text-4xl">
                      {selectedMeta.name[locale]}
                    </h2>
                    <p className="mt-1 text-sm font-bold text-cream/80">
                      {selectedMeta.tagline[locale]}
                    </p>
                  </div>
                  {result ? (
                    <div className="rounded-3xl bg-paper pt-4">
                      <GameOver
                        mode="free"
                        heading={t('over.title')}
                        entries={[{ name: selectedMeta.name[locale], score: result.score }]}
                        totalScore={result.score}
                        bestCombo={result.bestCombo}
                        levelReached={result.levelReached}
                        durationMs={result.durationMs}
                        dateKey={todayKey()}
                        sessionBest={isBest.current}
                        primaryLabel={t('over.playAgain')}
                        onPrimary={() => {
                          setResult(null);
                          setRunId((value) => value + 1);
                        }}
                        onHome={closeGame}
                      />
                    </div>
                  ) : (
                    <>
                      <GameShell
                        key={`${selectedMeta.id}:${runId}`}
                        gameId={selectedMeta.id}
                        seed={seed}
                        startLives={5}
                        wide
                        onFinish={finishGame}
                        onQuit={closeGame}
                      />
                      <p className="mx-auto max-w-md px-5 pb-2 pt-5 text-center text-sm font-bold leading-relaxed text-cream/85">
                        {selectedMeta.howTo[locale]}
                      </p>
                    </>
                  )}
                </motion.div>
              ) : (
                <div className="hidden min-h-[680px] place-items-center rounded-[28px] border-[3px] border-ink bg-teal-dark p-10 text-center text-cream shadow-[0_7px_0_0_var(--color-ink)] lg:grid">
                  <div className="max-w-sm">
                    <Mascot expression="hype" size={104} />
                    <p className="mt-5 font-display text-4xl">{t('home.grid.title')}</p>
                    <p className="mt-3 font-bold text-cream/75">{t('home.bored.sub')}</p>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </section>

        <footer className="mt-10 border-t-[3px] border-dashed border-ink/30 pt-7 text-center text-sm font-bold text-ink-soft">
          {t('home.footer')}
        </footer>
      </main>
    </div>
  );
}
