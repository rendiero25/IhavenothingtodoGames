import { useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { hashString } from '../core/rng';
import { todayKey } from '../core/daily';
import { sfx } from '../core/sound';
import { getMeta } from '../games/registry';
import type { GameId, GameResult } from '../games/types';
import { GameShell } from '../shell/GameShell';
import { GameOver } from '../shell/GameOver';
import { Header } from '../components/Header';
import { useI18n } from '../i18n';

const sessionBests = new Map<string, number>();

export default function Play() {
  const { gameId } = useParams();
  const nav = useNavigate();
  const { locale, t } = useI18n();
  const [runId, setRunId] = useState(0);
  const [result, setResult] = useState<GameResult | null>(null);
  const isBest = useRef(false);
  const meta = getMeta(gameId ?? '');
  const seed = useMemo(() => hashString(`free:${Date.now()}:${runId}`), [runId]);

  if (!meta) return <Navigate to="/" replace />;

  const onFinish = (r: GameResult) => {
    const prev = sessionBests.get(meta.id) ?? 0;
    isBest.current = r.score > prev && prev > 0;
    if (r.score > prev) sessionBests.set(meta.id, r.score);
    if (isBest.current) sfx.play('record');
    setResult(r);
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <Header />
      {result ? (
        <GameOver
          mode="free"
          heading={t('over.title')}
          entries={[{ name: meta.name[locale], score: result.score }]}
          totalScore={result.score}
          bestCombo={result.bestCombo}
          levelReached={result.levelReached}
          durationMs={result.durationMs}
          dateKey={todayKey()}
          sessionBest={isBest.current}
          primaryLabel={t('over.playAgain')}
          onPrimary={() => {
            setResult(null);
            setRunId((r) => r + 1);
          }}
          onHome={() => nav('/')}
        />
      ) : (
        <GameShell
          key={runId}
          gameId={meta.id as GameId}
          seed={seed}
          startLives={5}
          onFinish={onFinish}
          onQuit={() => nav('/')}
        />
      )}
    </div>
  );
}
