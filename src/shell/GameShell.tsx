import { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play as PlayIcon, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useI18n } from '../i18n';
import { sfx } from '../core/sound';
import { comboMultiplier } from '../core/score';
import { loadEngine } from '../games/registry';
import type { GameEngine, GameId, GameResult } from '../games/types';
import { LivesBar } from '../components/LivesBar';
import { ChunkyButton } from '../components/ChunkyButton';

type Phase = 'loading' | 'countdown' | 'playing' | 'paused' | 'over';

export interface GameShellProps {
  gameId: GameId;
  seed: number;
  startLives: number;
  roundMs?: number;
  onFinish: (result: GameResult) => void;
  onQuit: () => void;
}

export function GameShell({ gameId, seed, startLives, roundMs, onFinish, onQuit }: GameShellProps) {
  const { locale, t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const phaseRef = useRef<Phase>('loading');
  const [phase, setPhaseState] = useState<Phase>('loading');
  const [lives, setLives] = useState(startLives);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [count, setCount] = useState(3);

  const setPhase = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
  }, []);

  useEffect(() => {
    let alive = true;
    let engine: GameEngine | null = null;
    const timers: ReturnType<typeof setTimeout>[] = [];

    void loadEngine(gameId).then(async (e) => {
      if (!alive || !canvasRef.current) return;
      engine = e;
      engineRef.current = e;
      e.init(canvasRef.current, {
        seed,
        locale,
        startLives,
        roundMs,
        callbacks: {
          onScore: (s, c) => {
            setScore(s);
            setCombo(c);
          },
          onLifeLost: () => {
            sfx.play('life');
            setLives((l) => Math.max(0, l - 1));
          },
          onGameOver: (result) => {
            sfx.play('over');
            setPhase('over');
            timers.push(setTimeout(() => onFinish(result), 700));
          },
        },
      });
      await document.fonts.ready;
      if (!alive) return;
      setPhase('countdown');
      for (let i = 3; i >= 1; i--) {
        timers.push(
          setTimeout(() => {
            setCount(i);
            sfx.play('tick');
          }, (3 - i) * 700),
        );
      }
      timers.push(
        setTimeout(() => {
          if (!alive || !engine) return;
          setPhase('playing');
          sfx.play('coin');
          engine.start();
        }, 2100),
      );
    });

    return () => {
      alive = false;
      timers.forEach(clearTimeout);
      engine?.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, seed]);

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
    <div className="mx-auto w-full max-w-md px-4 select-none">
      <div className="flex items-center justify-between py-3">
        <button onClick={onQuit} aria-label={t('shell.quit')} className="rounded-full border-[3px] border-ink bg-paper p-1.5 cursor-pointer">
          <X size={18} />
        </button>
        <LivesBar lives={lives} max={startLives} />
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
        <canvas ref={canvasRef} className="w-full rounded-2xl touch-none" style={{ aspectRatio: '2 / 3' }} />

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
        </AnimatePresence>
      </div>
    </div>
  );
}
