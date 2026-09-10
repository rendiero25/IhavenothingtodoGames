import { useEffect, useMemo, useRef, useState } from 'react';
import { hashString } from '../core/rng';
import { todayKey } from '../core/daily';
import { sfx } from '../core/sound';
import type { GameMeta, GameResult } from '../games/types';
import { useI18n } from '../i18n';
import { GameOver } from '../shell/GameOver';
import { GameShell } from '../shell/GameShell';

const modalSessionBests = new Map<string, number>();

export function GameModal({ meta, onClose }: { meta: GameMeta; onClose: () => void }) {
  const { locale, t } = useI18n();
  const closeRef = useRef<HTMLButtonElement>(null);
  const isBest = useRef(false);
  const [runId, setRunId] = useState(0);
  const [result, setResult] = useState<GameResult | null>(null);
  const seed = useMemo(
    () => hashString(`modal:${meta.id}:${Date.now()}:${runId}`),
    [meta.id, runId],
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const finishGame = (gameResult: GameResult) => {
    const previousBest = modalSessionBests.get(meta.id) ?? 0;
    isBest.current = gameResult.score > previousBest && previousBest > 0;
    if (gameResult.score > previousBest) modalSessionBests.set(meta.id, gameResult.score);
    if (isBest.current) sfx.play('record');
    setResult(gameResult);
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink">
      <section
        role="dialog"
        aria-modal="true"
        aria-label={meta.name[locale]}
        className="fixed inset-0 h-dvh w-full overflow-hidden bg-paper text-ink"
      >
        {result ? (
          <div className="h-full overflow-y-auto">
            <div className="flex min-h-full items-center justify-center px-4 py-6 sm:py-10">
              <GameOver
                mode="free"
                heading={t(result.endReason === 'complete' ? 'courier.complete' : 'over.title')}
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
                  setRunId((value) => value + 1);
                }}
                onHome={onClose}
              />
            </div>
          </div>
        ) : (
          <GameShell
            key={`${meta.id}:${runId}`}
            gameId={meta.id}
            seed={seed}
            startLives={5}
            wide
            closeButtonRef={closeRef}
            intro={{
              howToLabel: locale === 'id' ? 'Cara bermain' : 'How to play',
              howTo: meta.howTo[locale],
              playLabel: t('shell.go'),
            }}
            onFinish={finishGame}
            onQuit={onClose}
          />
        )}
      </section>
    </div>
  );
}
