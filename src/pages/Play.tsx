import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { hashString } from '../core/rng';
import { getMeta } from '../games/registry';
import type { GameId, GameResult } from '../games/types';
import { GameShell } from '../shell/GameShell';
import { Header } from '../components/Header';

export default function Play() {
  const { gameId } = useParams();
  const nav = useNavigate();
  const [runId, setRunId] = useState(0);
  const [result, setResult] = useState<GameResult | null>(null);
  const meta = getMeta(gameId ?? '');
  const seed = useMemo(() => hashString(`free:${Date.now()}:${runId}`), [runId]);

  if (!meta) return <Navigate to="/" replace />;

  return (
    <div className="min-h-dvh flex flex-col">
      <Header />
      {result ? (
        <pre className="p-6 text-xs">{JSON.stringify(result, null, 2)}</pre>
      ) : (
        <GameShell
          key={runId}
          gameId={meta.id as GameId}
          seed={seed}
          startLives={5}
          onFinish={setResult}
          onQuit={() => nav('/')}
        />
      )}
      {result && (
        <button
          className="underline p-4"
          onClick={() => {
            setResult(null);
            setRunId((r) => r + 1);
          }}
        >
          play again (sementara)
        </button>
      )}
    </div>
  );
}
