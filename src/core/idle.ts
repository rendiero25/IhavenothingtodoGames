import { useEffect, useState } from 'react';

export type IdleState = 'awake' | 'yawn' | 'sleep';

export function useIdle(yawnMs = 20_000, sleepMs = 45_000): IdleState {
  const [state, setState] = useState<IdleState>('awake');

  useEffect(() => {
    let last = performance.now();
    const reset = () => {
      last = performance.now();
      setState('awake');
    };
    const events = ['pointerdown', 'pointermove', 'keydown', 'scroll'] as const;
    for (const ev of events) window.addEventListener(ev, reset, { passive: true });
    const iv = setInterval(() => {
      const idle = performance.now() - last;
      setState(idle >= sleepMs ? 'sleep' : idle >= yawnMs ? 'yawn' : 'awake');
    }, 1000);
    return () => {
      for (const ev of events) window.removeEventListener(ev, reset);
      clearInterval(iv);
    };
  }, [yawnMs, sleepMs]);

  return state;
}
