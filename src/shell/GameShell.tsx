import { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play as PlayIcon, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useI18n } from '../i18n';
import { sfx } from '../core/sound';
import { comboMultiplier } from '../core/score';
import { getMeta, loadEngine } from '../games/registry';
import type { GameEngine, GameId, GameOptions, GameResult } from '../games/types';
import { LivesBar } from '../components/LivesBar';
import { ChunkyButton } from '../components/ChunkyButton';
import { Mascot } from '../components/Mascot';

type Phase = 'loading' | 'countdown' | 'playing' | 'paused' | 'over' | 'error';

export interface GameShellProps {
  gameId: GameId;
  seed: number;
  startLives: number;
  roundMs?: number;
  wide?: boolean;
  onFinish: (result: GameResult) => void;
  onQuit: () => void;
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

export function GameShell({ gameId, seed, startLives, roundMs, wide = false, onFinish, onQuit }: GameShellProps) {
  const { locale, t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const optionsRef = useRef<GameOptions | null>(null);
  const phaseRef = useRef<Phase>('loading');
  const localeRef = useRef(locale);
  const onFinishRef = useRef(onFinish);
  const shockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [phase, setPhaseState] = useState<Phase>('loading');
  const [lives, setLives] = useState(startLives);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [count, setCount] = useState(3);
  const [shocked, setShocked] = useState(false);
  const landscape = getMeta(gameId)?.viewport === 'landscape';
  const shellWidth = landscape ? 'max-w-5xl' : wide ? 'max-w-xl' : 'max-w-md';
  const canvasAspect = landscape ? '16 / 9' : '2 / 3';

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

    cancelShockTimer();
    setShocked(false);
    setLives(startLives);
    setScore(0);
    setCombo(0);
    setCount(3);
    setPhase('loading');

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
    }).catch(() => {
      fail();
    });

    return () => {
      lifecycle.stop();
      cancelShockTimer();
      engine?.destroy();
      engineRef.current = null;
      if (optionsRef.current === options) optionsRef.current = null;
    };
  }, [cancelShockTimer, gameId, roundMs, seed, setPhase, startLives, triggerShock]);

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
    if (phase === 'playing') {
      engineRef.current?.pause();
      setPhase('paused');
    } else if (phase === 'paused') {
      engineRef.current?.resume();
      setPhase('playing');
    }
  };

  return (
    <div className={`mx-auto w-full px-4 select-none ${shellWidth}`}>
      <div className="flex items-center justify-between py-3">
        <button onClick={onQuit} aria-label={t('shell.quit')} className="rounded-full border-[3px] border-ink bg-paper p-1.5 cursor-pointer">
          <X size={18} />
        </button>
        <div className="flex items-center gap-2">
          <Mascot expression={shocked ? 'shock' : 'happy'} size={34} />
          <LivesBar lives={lives} max={startLives} />
        </div>
        <button
          onClick={togglePause}
          disabled={phase !== 'playing' && phase !== 'paused'}
          aria-label={phase === 'paused' ? t('shell.resume') : t('shell.pause')}
          className="rounded-full border-[3px] border-ink bg-paper p-1.5 cursor-pointer disabled:opacity-40"
        >
          {phase === 'paused' ? <PlayIcon size={18} /> : <Pause size={18} />}
        </button>
      </div>

      <div className="relative rounded-3xl border-[3px] border-ink bg-navy p-2 shadow-[0_8px_0_0_var(--color-ink)]">
        <div className="flex items-center justify-between px-3 py-2 font-pixel text-[11px] text-neon-yellow">
          <span>{score}</span>
          <span className={combo >= 5 ? 'text-neon-green' : 'text-navy-soft'}>x{comboMultiplier(combo)}</span>
        </div>
        <canvas ref={canvasRef} className="w-full rounded-2xl touch-none" style={{ aspectRatio: canvasAspect }} />

        <AnimatePresence>
          {phase === 'countdown' && (
            <motion.div
              key={count}
              initial={{ scale: 2.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              className="absolute inset-0 grid place-items-center font-display text-7xl text-neon-yellow"
            >
              {count}
            </motion.div>
          )}
          {phase === 'paused' && (
            <div className="absolute inset-0 grid place-items-center rounded-3xl bg-navy/85">
              <div className="text-center">
                <p className="font-display text-cream text-xl mb-4">{t('shell.paused')}</p>
                <ChunkyButton color="teal" onClick={togglePause}>
                  {t('shell.resume')}
                </ChunkyButton>
              </div>
            </div>
          )}
          {phase === 'error' && (
            <div className="absolute inset-0 grid place-items-center rounded-3xl bg-navy/85 p-6">
              <div className="text-center">
                <p className="mb-4 font-display text-xl text-cream">{t('shell.loadError')}</p>
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
