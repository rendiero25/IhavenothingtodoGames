import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
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
        aria-labelledby="game-modal-title"
        className="fixed inset-[clamp(0.75rem,2vw,1.5rem)] flex overflow-hidden rounded-md bg-paper text-ink"
      >
        <div className="flex min-h-0 w-full flex-col">
          <header className="flex min-h-16 shrink-0 items-center justify-between border-b border-ink px-4 sm:px-6">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                {t(`cat.${meta.category}` as const)}
              </p>
              <h2 id="game-modal-title" className="truncate font-pixel text-lg tracking-[-0.03em] sm:text-xl">
                {meta.name[locale]}
              </h2>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label={t('shell.quit')}
              className="grid size-10 cursor-pointer place-items-center border border-ink bg-paper outline-none transition-colors duration-200 hover:bg-ink hover:text-paper focus-visible:bg-ink focus-visible:text-paper"
            >
              <X size={18} strokeWidth={1.7} />
            </button>
          </header>

          <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[18rem_minmax(0,1fr)] lg:overflow-hidden">
            <aside className="border-b border-ink p-5 lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                {locale === 'id' ? 'Cara bermain' : 'How to play'}
              </p>
              <p className="mt-4 max-w-[34rem] text-sm leading-relaxed text-ink/75 lg:text-base">
                {meta.howTo[locale]}
              </p>
              <div className="mt-6 border-t border-ink/20 pt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                <p>{meta.viewport === 'landscape' ? '16:9' : '2:3'} viewport</p>
                <p className="mt-2">5 {locale === 'id' ? 'nyawa' : 'lives'}</p>
              </div>
            </aside>

            <div className="min-h-0 overflow-y-auto py-4 sm:py-6">
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
                    setRunId((value) => value + 1);
                  }}
                  onHome={onClose}
                />
              ) : (
                <GameShell
                  key={`${meta.id}:${runId}`}
                  gameId={meta.id}
                  seed={seed}
                  startLives={5}
                  wide
                  onFinish={finishGame}
                  onQuit={onClose}
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
