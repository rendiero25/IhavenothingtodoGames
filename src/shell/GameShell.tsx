import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play as PlayIcon, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useI18n } from '../i18n';
import { sfx } from '../core/sound';
import { comboMultiplier } from '../core/score';
import { loadEngine } from '../games/registry';
import type { GameEngine, GameId, GameOptions, GameResult } from '../games/types';
import { LivesBar } from '../components/LivesBar';
import { ChunkyButton } from '../components/ChunkyButton';

type Phase = 'intro' | 'loading' | 'countdown' | 'playing' | 'paused' | 'over' | 'error';

export interface GameShellProps {
  gameId: GameId;
  seed: number;
  startLives: number;
  roundMs?: number;
  wide?: boolean;
  closeButtonRef?: RefObject<HTMLButtonElement | null>;
  intro?: GameShellIntro;
  onFinish: (result: GameResult) => void;
  onQuit: () => void;
}

export interface GameShellIntro {
  howToLabel: string;
  howTo: string;
  playLabel: string;
}

interface SessionLifecycle {
  isAlive(): boolean;
  schedule(callback: () => void, delayMs: number): void;
  stop(): boolean;
}

export function createSessionLifecycle(): SessionLifecycle {
  let alive = true;
  const timers = new Set<ReturnType<typeof setTimeout>>();

  return {
    isAlive: () => alive,
    schedule: (callback, delayMs) => {
      if (!alive) return;
      const timer = setTimeout(() => {
        timers.delete(timer);
        if (alive) callback();
      }, delayMs);
      timers.add(timer);
    },
    stop: () => {
      const wasAlive = alive;
      alive = false;
      timers.forEach(clearTimeout);
      timers.clear();
      return wasAlive;
    },
  };
}

export function GameShell({
  gameId,
  seed,
  startLives,
  roundMs,
  wide = false,
  closeButtonRef,
  intro,
  onFinish,
  onQuit,
}: GameShellProps) {
  const { locale, t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const optionsRef = useRef<GameOptions | null>(null);
  const phaseRef = useRef<Phase>('loading');
  const localeRef = useRef(locale);
  const onFinishRef = useRef(onFinish);
  const startRoundRef = useRef<(() => void) | null>(null);
  const shockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const immersive = wide && Boolean(intro);
  const [phase, setPhaseState] = useState<Phase>(immersive ? 'intro' : 'loading');
  const [lives, setLives] = useState(startLives);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [count, setCount] = useState(3);
  const [shocked, setShocked] = useState(false);
  const shellWidth = wide ? 'max-w-none' : 'max-w-md md:max-w-3xl lg:max-w-5xl';
  const shellPadding = immersive ? 'p-0' : wide ? 'px-3 sm:px-6 lg:px-10' : 'px-3 sm:px-5';
  const landscapeGame = gameId === 'arena-fps' || gameId === 'stick-man-running';

  const setPhase = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
  }, []);

  const cancelShockTimer = useCallback(() => {
    if (shockTimerRef.current !== null) {
      clearTimeout(shockTimerRef.current);
      shockTimerRef.current = null;
    }
  }, []);

  const triggerShock = useCallback(() => {
    cancelShockTimer();
    setShocked(true);
    shockTimerRef.current = setTimeout(() => {
      shockTimerRef.current = null;
      setShocked(false);
    }, 800);
  }, [cancelShockTimer]);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    localeRef.current = locale;
    if (optionsRef.current) {
      // Preserve the active stage. Engines read this shared options object:
      // rendered labels update on the next frame and generated content uses the new locale.
      optionsRef.current.locale = locale;
    }
  }, [locale]);

  useEffect(() => {
    let engine: GameEngine | null = null;
    let options: GameOptions | null = null;
    const lifecycle = createSessionLifecycle();
    const fail = () => {
      const wasAlive = lifecycle.stop();
      cancelShockTimer();
      const failedEngine = engine;
      engine = null;
      engineRef.current = null;
      if (optionsRef.current === options) optionsRef.current = null;
      try {
        failedEngine?.destroy();
      } catch {
        // A broken engine must not prevent the recoverable fallback.
      }
      if (wasAlive) setPhase('error');
    };

    const startRound = () => {
      if (
        !lifecycle.isAlive() ||
        !engine ||
        (phaseRef.current !== 'intro' && phaseRef.current !== 'loading')
      ) {
        return;
      }
      setPhase('countdown');
      for (let i = 3; i >= 1; i--) {
        lifecycle.schedule(
          () => {
            setCount(i);
            sfx.play('tick');
          },
          (3 - i) * 700,
        );
      }
      lifecycle.schedule(
        () => {
          if (!engine) return;
          setPhase('playing');
          sfx.play('coin');
          engine.start();
        },
        2100,
      );
    };

    startRoundRef.current = startRound;

    cancelShockTimer();
    setShocked(false);
    setLives(startLives);
    setScore(0);
    setCombo(0);
    setCount(3);
    setPhase(immersive ? 'intro' : 'loading');

    void loadEngine(gameId).then(async (e) => {
      engine = e;
      if (!lifecycle.isAlive() || !canvasRef.current) {
        fail();
        return;
      }
      engineRef.current = e;
      options = {
        seed,
        locale: localeRef.current,
        startLives,
        roundMs,
        callbacks: {
          onScore: (s, c) => {
            if (!lifecycle.isAlive()) return;
            setScore(s);
            setCombo(c);
          },
          onLifeLost: () => {
            if (!lifecycle.isAlive()) return;
            sfx.play('life');
            setLives((l) => Math.max(0, l - 1));
            triggerShock();
          },
          onGameOver: (result) => {
            if (!lifecycle.isAlive()) return;
            sfx.play('over');
            setPhase('over');
            lifecycle.schedule(() => onFinishRef.current(result), 700);
          },
          onFatalError: () => {
            fail();
          },
        },
      };
      optionsRef.current = options;
      e.init(canvasRef.current, options);
      await document.fonts.ready;
      if (!lifecycle.isAlive() || !engine) return;
      if (!immersive) startRound();
    }).catch(() => {
      fail();
    });

    return () => {
      lifecycle.stop();
      cancelShockTimer();
      if (startRoundRef.current === startRound) startRoundRef.current = null;
      engine?.destroy();
      engineRef.current = null;
      if (optionsRef.current === options) optionsRef.current = null;
    };
  }, [cancelShockTimer, gameId, immersive, roundMs, seed, setPhase, startLives, triggerShock]);

  useEffect(() => {
    const onHide = () => {
      if (document.hidden && phaseRef.current === 'playing') {
        engineRef.current?.pause();
        setPhase('paused');
      }
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (phaseRef.current === 'playing' || phaseRef.current === 'paused') e.preventDefault();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [setPhase]);

  const togglePause = () => {
    const currentPhase = phaseRef.current;
    if (currentPhase === 'playing') {
      engineRef.current?.pause();
      setPhase('paused');
    } else if (currentPhase === 'paused') {
      engineRef.current?.resume();
      setPhase('playing');
    }
  };

  return (
    <div className={`mx-auto w-full select-none ${immersive ? 'h-full' : ''} ${shellPadding} ${shellWidth}`}>
      {!immersive && <div className="flex items-center justify-between border-b border-ink/20 py-3 font-mono text-[10px] uppercase tracking-[0.12em]">
        <button
          onClick={onQuit}
          aria-label={t('shell.quit')}
          className="grid size-9 cursor-pointer place-items-center border border-ink bg-paper outline-none transition-colors duration-200 hover:bg-ink hover:text-paper focus-visible:bg-ink focus-visible:text-paper"
        >
          <X size={16} strokeWidth={1.7} />
        </button>
        <div className="flex items-center gap-2">
          <span className={shocked ? 'opacity-35' : ''}>{locale === 'id' ? 'Nyawa' : 'Lives'}</span>
          <LivesBar lives={lives} max={startLives} />
        </div>
        <button
          onClick={togglePause}
          disabled={phase !== 'playing' && phase !== 'paused'}
          aria-label={phase === 'paused' ? t('shell.resume') : t('shell.pause')}
          className="grid size-9 cursor-pointer place-items-center border border-ink bg-paper outline-none transition-colors duration-200 hover:bg-ink hover:text-paper focus-visible:bg-ink focus-visible:text-paper disabled:cursor-not-allowed disabled:opacity-30"
        >
          {phase === 'paused' ? <PlayIcon size={16} strokeWidth={1.7} /> : <Pause size={16} strokeWidth={1.7} />}
        </button>
      </div>}

      <div className={`relative flex min-h-0 items-center justify-center overflow-hidden bg-navy ${immersive ? 'h-full w-full' : 'mt-3 aspect-[2/3] rounded-md border border-ink p-2 md:aspect-[4/3] lg:aspect-[16/9]'}`}>
        <div
          data-game-stage="true"
          className="relative flex h-auto w-full max-h-full max-w-full items-center justify-center"
          style={{ aspectRatio: landscapeGame ? '16 / 9' : '2 / 3' }}
        >
          <canvas ref={canvasRef} className="block size-full touch-none rounded-sm" />
        </div>

        {immersive && (
          <>
            <div className="pointer-events-none absolute inset-x-3 top-3 z-40 flex items-start justify-between gap-3 sm:inset-x-5 sm:top-5">
              <button
                ref={closeButtonRef}
                onClick={onQuit}
                aria-label={t('shell.quit')}
                className="pointer-events-auto grid size-10 shrink-0 cursor-pointer place-items-center border border-ink bg-paper text-ink outline-none transition-colors duration-200 hover:bg-ink hover:text-paper focus-visible:bg-ink focus-visible:text-paper"
              >
                <X size={17} strokeWidth={1.7} />
              </button>
              <div className="flex items-center gap-3 border border-ink bg-paper px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-ink">
                <span>{score}</span>
                <span className={combo >= 5 ? 'text-ink' : 'text-ink/40'}>x{comboMultiplier(combo)}</span>
              </div>
              <button
                onClick={togglePause}
                disabled={phase !== 'playing' && phase !== 'paused'}
                aria-label={phase === 'paused' ? t('shell.resume') : t('shell.pause')}
                className="pointer-events-auto grid size-10 shrink-0 cursor-pointer place-items-center border border-ink bg-paper text-ink outline-none transition-colors duration-200 hover:bg-ink hover:text-paper focus-visible:bg-ink focus-visible:text-paper disabled:cursor-not-allowed disabled:opacity-30"
              >
                {phase === 'paused' ? <PlayIcon size={17} strokeWidth={1.7} /> : <Pause size={17} strokeWidth={1.7} />}
              </button>
            </div>

            {intro && phase === 'intro' && (
              <section
                aria-label={intro.howToLabel}
          className="absolute left-1/2 top-1/2 z-20 w-max max-w-[calc(100%-1.5rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-md border border-ink bg-paper/80 p-4 text-ink sm:p-6"
              >
                <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-end sm:justify-between sm:gap-8 sm:text-left">
                  <div className="max-w-[65ch]">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                      {intro.howToLabel}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed sm:text-base">
                      {intro.howTo}
                    </p>
                  </div>
                  <ChunkyButton color="teal" size="lg" onClick={() => startRoundRef.current?.()}>
                    {intro.playLabel}
                  </ChunkyButton>
                </div>
              </section>
            )}
          </>
        )}

        <AnimatePresence>
          {phase === 'countdown' && (
            <motion.div
              key={count}
              initial={{ scale: 2.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              className="absolute inset-0 z-30 grid place-items-center font-pixel text-7xl text-ink"
            >
              {count}
            </motion.div>
          )}
          {phase === 'paused' && (
            <div className="absolute inset-0 z-30 grid place-items-center rounded-md bg-navy/50">
              <div className="text-center">
                <p className="mb-4 text-xl text-ink">{t('shell.paused')}</p>
                <ChunkyButton color="teal" onClick={togglePause}>
                  {t('shell.resume')}
                </ChunkyButton>
              </div>
            </div>
          )}
          {phase === 'error' && (
            <div className="absolute inset-0 z-30 grid place-items-center rounded-md bg-navy p-6">
              <div className="text-center">
                <p className="mb-4 text-xl text-ink">{t('shell.loadError')}</p>
                <ChunkyButton color="teal" onClick={onQuit}>
                  {t('shell.back')}
                </ChunkyButton>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
