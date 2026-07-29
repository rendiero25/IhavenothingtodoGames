import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
      GAMES.map((g) => g.id),
    );
    return ids
      .map((id) => GAMES.find((g) => g.id === id)?.name[locale])
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
    gamePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selectedGameId, runId]);

  return (
    <div className="min-h-dvh">
      <Header />
      <main className="mx-auto max-w-7xl px-5 pb-16">
        <section className="mx-auto flex max-w-3xl flex-col items-center pt-6 pb-12 text-center">
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

        <section className="mx-auto max-w-3xl rounded-3xl border-[3px] border-ink bg-teal-dark p-6 text-cream shadow-[0_6px_0_0_var(--color-ink)]">
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
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(360px,0.9fr)_minmax(480px,1.1fr)]">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
              {GAMES.map((meta, i) => (
                <motion.div
                  key={meta.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <GameCard
                    meta={meta}
                    selected={selectedGameId === meta.id}
                    onSelect={() => selectGame(meta.id)}
                  />
                </motion.div>
              ))}
            </div>

            <aside ref={gamePanelRef} className="scroll-mt-5 lg:sticky lg:top-5">
              {selectedMeta ? (
                <motion.div
                  key={selectedMeta.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-[2rem] border-[3px] border-ink bg-paper py-5 shadow-[0_8px_0_0_var(--color-ink)]"
                >
                  <div className="px-6 pb-2 text-center">
                    <h2 className="font-display text-3xl">{selectedMeta.name[locale]}</h2>
                    <p className="mt-1 text-sm text-ink-soft">{selectedMeta.tagline[locale]}</p>
                  </div>
                  {result ? (
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
                      onHome={() => {
                        setSelectedGameId(null);
                        setResult(null);
                      }}
                    />
                  ) : (
                    <>
                      <GameShell
                        key={`${selectedMeta.id}:${runId}`}
                        gameId={selectedMeta.id}
                        seed={seed}
                        startLives={5}
                        onFinish={finishGame}
                        onQuit={() => {
                          setSelectedGameId(null);
                          setResult(null);
                        }}
                      />
                      <p className="mx-auto max-w-md px-6 pb-3 pt-5 text-center text-sm text-ink-soft">
                        {selectedMeta.howTo[locale]}
                      </p>
                    </>
                  )}
                </motion.div>
              ) : (
                <div className="hidden min-h-[520px] place-items-center rounded-[2rem] border-[3px] border-dashed border-ink/40 bg-paper/60 p-10 text-center lg:grid">
                  <div>
                    <Mascot expression="happy" size={92} />
                    <p className="mt-4 font-display text-2xl">{t('home.bored.sub')}</p>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </section>

        <footer className="mt-14 text-center text-sm text-ink-soft">{t('home.footer')}</footer>
      </main>
    </div>
  );
}
