import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Header } from '../components/Header';
import { ChunkyButton } from '../components/ChunkyButton';
import { LivesBar } from '../components/LivesBar';
import { Mascot } from '../components/Mascot';
import { GameShell } from '../shell/GameShell';
import { GameOver } from '../shell/GameOver';
import { GAMES } from '../games/registry';
import {
  dailyRunSnapshot,
  stageSeed,
  todayKey,
  useCurrentDateKey,
} from '../core/daily';
import type { DailyRun } from '../core/daily';
import type { GameId, GameResult } from '../games/types';
import { useI18n } from '../i18n';

const ROUND_MS = 45_000;

type Phase =
  | { kind: 'intro' }
  | { kind: 'interlude'; stage: number }
  | { kind: 'playing'; stage: number }
  | { kind: 'done'; failed: boolean };

interface StageResult {
  gameId: GameId;
  score: number;
}

export default function Daily() {
  const { t, locale } = useI18n();
  const nav = useNavigate();
  const availableDateKey = useCurrentDateKey();
  const availableRun = useMemo(
    () =>
      dailyRunSnapshot(
        availableDateKey,
        GAMES.filter((g) => g.id !== 'kurir-gabut').map((g) => g.id),
      ),
    [availableDateKey],
  );
  const [run, setRun] = useState<DailyRun<GameId> | null>(null);
  const [runId, setRunId] = useState(0);
  const [phase, setPhase] = useState<Phase>({ kind: 'intro' });
  const [lives, setLives] = useState(5);
  const [results, setResults] = useState<StageResult[]>([]);
  const [bestCombo, setBestCombo] = useState(0);
  const [durationMs, setDurationMs] = useState(0);

  const activeRun = run ?? availableRun;
  const { dateKey, lineup } = activeRun;
  const metaAt = (stage: number) => GAMES.find((g) => g.id === lineup[stage])!;
  const receiptEntries = results.map((entry) => ({
    name: GAMES.find((g) => g.id === entry.gameId)!.name[locale],
    score: entry.score,
  }));

  const start = () => {
    setRun(
      dailyRunSnapshot(
        todayKey(),
        GAMES.map((g) => g.id),
      ),
    );
    setPhase({ kind: 'playing', stage: 0 });
  };

  const reset = () => {
    setRun(null);
    setPhase({ kind: 'intro' });
    setLives(5);
    setResults([]);
    setBestCombo(0);
    setDurationMs(0);
    setRunId((r) => r + 1);
  };

  const onStageFinish = (stage: number) => (r: GameResult) => {
    const entry = { gameId: lineup[stage], score: r.score };
    setResults((prev) => [...prev, entry]);
    setBestCombo((b) => Math.max(b, r.bestCombo));
    setDurationMs((d) => d + r.durationMs);
    setLives(r.livesLeft);
    if (r.endReason === 'lives') setPhase({ kind: 'done', failed: true });
    else if (stage + 1 >= lineup.length) setPhase({ kind: 'done', failed: false });
    else setPhase({ kind: 'interlude', stage: stage + 1 });
  };

  return (
    <div className="min-h-dvh">
      <Header wide />

      {phase.kind === 'intro' && (
        <main className="mx-auto flex max-w-md flex-col items-center px-6 pt-6 text-center">
          <p className="font-pixel text-[10px] text-ink-soft">{dateKey}</p>
          <h1 className="mt-2 font-display text-4xl">{t('daily.title')}</h1>
          <p className="mt-2 text-sm text-ink-soft">{t('home.daily.sub')}</p>
          <ol className="mt-6 w-full space-y-2">
            {lineup.map((id, i) => (
              <motion.li
                key={id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-md border border-ink bg-paper px-4 py-2 text-left font-bold"
              >
                {i + 1}. {metaAt(i).name[locale]}
              </motion.li>
            ))}
          </ol>
          <div className="mt-6">
            <LivesBar lives={lives} />
          </div>
          <div className="mt-6">
            <ChunkyButton
              size="lg"
              color="coral"
              onClick={start}
            >
              {t('home.daily.cta')}
            </ChunkyButton>
          </div>
        </main>
      )}

      {phase.kind === 'interlude' && (
        <main className="mx-auto flex max-w-md flex-col items-center px-6 pt-10 text-center">
          <Mascot expression="hype" size={100} />
          <p className="mt-4 font-pixel text-[10px] text-ink-soft">
            {t('daily.stage', { n: phase.stage + 1 })}
          </p>
          <h2 className="mt-2 font-display text-3xl">{metaAt(phase.stage).name[locale]}</h2>
          <p className="mt-2 text-sm text-ink-soft">{metaAt(phase.stage).howTo[locale]}</p>
          <p className="mt-5 text-xs font-bold uppercase tracking-wider text-ink-soft">
            {t('daily.livesLeft')}
          </p>
          <div className="mt-1">
            <LivesBar lives={lives} />
          </div>
          <div className="mt-6">
            <ChunkyButton
              size="lg"
              color="teal"
              onClick={() => setPhase({ kind: 'playing', stage: phase.stage })}
            >
              {t('daily.next')}
            </ChunkyButton>
          </div>
        </main>
      )}

      {phase.kind === 'playing' && (
        <>
          <p className="pb-1 text-center font-pixel text-[10px] text-ink-soft">
            {t('daily.stage', { n: phase.stage + 1 })} — {metaAt(phase.stage).name[locale]}
          </p>
          <GameShell
            key={`${runId}:${phase.stage}`}
            gameId={lineup[phase.stage]}
            seed={stageSeed(dateKey, phase.stage)}
            startLives={lives}
            roundMs={ROUND_MS}
            onFinish={onStageFinish(phase.stage)}
            onQuit={() => nav('/')}
          />
        </>
      )}

      {phase.kind === 'done' && (
        <GameOver
          mode="daily"
          heading={phase.failed ? t('daily.fail') : t('daily.clear')}
          entries={receiptEntries}
          totalScore={results.reduce((s, e) => s + e.score, 0)}
          bestCombo={bestCombo}
          levelReached={results.length}
          durationMs={durationMs}
          dateKey={dateKey}
          sessionBest={false}
          primaryLabel={t('over.playAgain')}
          onPrimary={reset}
          onHome={() => nav('/')}
        />
      )}
    </div>
  );
}
