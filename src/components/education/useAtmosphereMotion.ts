import { useLayoutEffect, useRef, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useAtmosphereMotion(scroller: RefObject<HTMLElement | null>, paused: boolean) {
  const pausedRef = useRef(paused);
  const syncRef = useRef<(() => void) | null>(null);
  useLayoutEffect(() => {
    pausedRef.current = paused;
    syncRef.current?.();
  }, [paused]);
  useLayoutEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const loops = new Map<Element, { visible: boolean; animations: gsap.core.Animation[] }>();
      const sync = () => loops.forEach(({ visible, animations }) => {
        animations.forEach(animation => animation.paused(pausedRef.current || document.hidden || !visible));
      });
      syncRef.current = sync;
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          const state = loops.get(entry.target);
          if (state) state.visible = entry.isIntersecting;
        });
        sync();
      }, { root, threshold: 0 });

      // Build top-to-bottom so ScrollTrigger refreshes in visual order.
      [...root.querySelectorAll<HTMLElement>('.sky-section')].reverse().forEach(section => {
        const stage = section.querySelector<HTMLElement>('.sky-stage')!;
        const scroll = { trigger: section, scroller: root, start: 'top bottom', end: 'bottom top', scrub: .9 };
        const fade = gsap.timeline({ scrollTrigger: scroll });
        fade.fromTo(stage, { opacity: .05 }, { opacity: 1, duration: .18, ease: 'none' })
          .to(stage, { opacity: 1, duration: .64 }).to(stage, { opacity: .05, duration: .18, ease: 'none' });
        for (const [selector, distance] of [['.sky-parallax-far', 20], ['.sky-parallax-mid', 40], ['.sky-parallax-near', 70]] as const) {
          const targets = section.querySelectorAll(selector);
          if (targets.length) gsap.fromTo(targets, { y: -distance }, { y: distance, ease: 'none', scrollTrigger: scroll });
        }

        const animations: gsap.core.Animation[] = [];
        const loop = (selector: string, vars: gsap.TweenVars) => {
          const targets = section.querySelectorAll(selector);
          if (targets.length) animations.push(gsap.to(targets, { repeat: -1, yoyo: true, ease: 'sine.inOut', paused: true, ...vars }));
        };
        loop('.sky-wind', { x: 72, y: -9, duration: 24, stagger: 3 });
        loop('[data-motion="flight"]', { x: 24, y: -12, rotation: 1.3, transformOrigin: '50% 50%', duration: 9 });
        loop('[data-motion="balloon"]', { x: 13, y: -18, rotation: 2.5, transformOrigin: '50% 20%', duration: 7 });
        loop('[data-motion="orbit"]', { x: 10, y: -14, rotation: 2, transformOrigin: '50% 50%', duration: 13 });
        loop('[data-motion="earth"]', { y: -10, duration: 14 });
        loop('.sky-cloud-bands', { rotation: 7, transformOrigin: '50% 50%', duration: 40 });
        loop('.sky-aurora', { x: 28, skewX: 3, opacity: .65, transformOrigin: '50% 0%', duration: 10 });
        loop('.sky-stars', { opacity: .55, duration: 6 });
        loop('.sky-beacon', { opacity: .15, duration: 1.8 });
        const meteor = section.querySelector('.sky-meteor');
        if (meteor) {
          const trail = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 2 });
          trail.fromTo(meteor, { x: 120, y: -110, opacity: 0 }, { x: 65, y: -60, opacity: 1, duration: 1.2, ease: 'none' })
            .to(meteor, { x: -110, y: 100, opacity: 0, duration: 3.5, ease: 'power1.in' });
          animations.push(trail);
        }
        loops.set(stage, { visible: false, animations });
        observer.observe(stage);
      });
      document.addEventListener('visibilitychange', sync);
      return () => {
        observer.disconnect();
        syncRef.current = null;
        document.removeEventListener('visibilitychange', sync);
      };
    }, root);
    return () => media.revert();
  }, [scroller]);
}
