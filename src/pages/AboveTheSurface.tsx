import { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowUp, ArrowUpRight, RotateCcw, Pause, Play } from 'lucide-react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AtmosphereArt } from '../components/education/AtmosphereArt';
import { useAtmosphereMotion } from '../components/education/useAtmosphereMotion';
import { ATMOSPHERE_STOPS, ascentPosition } from '../education/atmosphere';
import { useI18n } from '../i18n';
import { getSeoPage } from '../seo/pages';
import { usePageSeo } from '../seo/usePageSeo';
import '../styles/atmosphere.css';

const SOURCE = 'https://science.nasa.gov/earth/earth-atmosphere/earths-atmosphere-a-multi-layered-cake/';
const SOURCES: Record<string, string> = {
  troposphere: 'https://www.nasa.gov/general/what-is-earths-atmosphere/',
  stratosphere: 'https://www.nasa.gov/general/what-is-earths-atmosphere/',
  mesosphere: 'https://www.nasa.gov/general/what-is-earths-atmosphere/',
  thermosphere: 'https://www.nasa.gov/image-article/earths-atmospheric-layers-3/',
  exosphere: 'https://spaceplace.nasa.gov/exosphere/en/',
};

export default function AboveTheSurface() {
  const { t, locale, setLocale } = useI18n();
  usePageSeo(getSeoPage('/education/above-the-surface'), locale);
  const scroller = useRef<HTMLElement>(null);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const [motionPaused, setMotionPaused] = useState(false);

  useLayoutEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const sections = ATMOSPHERE_STOPS.map(stop => root.querySelector<HTMLElement>(`#sky-${stop.id}`)!);
    let centers: number[] = [];
    let frame = 0;
    const measure = () => { centers = sections.map(section => section.offsetTop + section.offsetHeight / 2); };
    const update = () => {
      frame = 0;
      const next = ascentPosition(root.scrollTop, root.clientHeight, centers);
      if (activeRef.current !== next) { activeRef.current = next; setActive(next); }
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    measure();
    root.scrollTop = root.scrollHeight - root.clientHeight;
    update();
    root.addEventListener('scroll', onScroll, { passive: true });
    // Keep the selected chapter in view when rotating a phone or resizing.
    const observer = new ResizeObserver(() => {
      const selected = activeRef.current;
      measure();
      ScrollTrigger.refresh();
      const section = sections[selected];
      root.scrollTop = section.offsetTop + Math.max(0, (section.offsetHeight - root.clientHeight) / 2);
      ScrollTrigger.update();
      update();
    });
    observer.observe(root);
    return () => {
      observer.disconnect();
      root.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  useAtmosphereMotion(scroller, motionPaused);

  const goTo = (index: number) => {
    const root = scroller.current;
    const section = root?.querySelector<HTMLElement>(`#sky-${ATMOSPHERE_STOPS[index].id}`);
    if (!root || !section) return;
    root.scrollTo({ top: section.offsetTop + Math.max(0, (section.offsetHeight - root.clientHeight) / 2), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };
  const stop = ATMOSPHERE_STOPS[active];

  return <div className="sky-page">
    <header className="sky-header">
      <Link to="/education" className="sky-back"><ArrowLeft size={17} /><span>Education</span></Link>
      <span className="sky-wordmark">{t('sky.title')}</span>
      <div className="sky-languages">{(['id', 'en'] as const).map(language => <button key={language} type="button" aria-pressed={locale === language} onClick={() => setLocale(language)}>{language.toUpperCase()}</button>)}</div>
    </header>

    <main ref={scroller} className="sky-scroll" tabIndex={0} aria-label={t('sky.title')}>
      <div className="sky-world">
        {ATMOSPHERE_STOPS.map(chapter => <section className={`sky-section sky-section--${chapter.id}`} id={`sky-${chapter.id}`} key={chapter.id} aria-labelledby={`sky-title-${chapter.id}`}>
          <div className="sky-stage">
          <AtmosphereArt scene={chapter.id} />
          <div className="sky-story">
            <p className="sky-kicker">{chapter.id === 'ground' ? t('sky.eyebrow') : `${chapter.layer ? `${String(chapter.layer).padStart(2, '0')} / 05 · ` : ''}${t(`sky.${chapter.id}.name`)}`}</p>
            {chapter.id === 'ground' ? <h1 id="sky-title-ground">{t('sky.heading')}</h1> : <h2 id={`sky-title-${chapter.id}`}>{t(`sky.${chapter.id}.title`)}</h2>}
            <p className="sky-body">{t(`sky.${chapter.id}.body`)}</p>
            {chapter.id === 'ground' ? <button type="button" className="sky-launch" onClick={() => goTo(1)}><ArrowUp size={18} />{t('sky.start')}</button> : <>
              <p className="sky-fact">{t(`sky.${chapter.id}.fact`)}</p>
              <a className="sky-source" href={SOURCES[chapter.id] ?? SOURCE} target="_blank" rel="noopener noreferrer">{t('sky.source')}<ArrowUpRight size={13} /></a>
              {chapter.id === 'beyond' && <button type="button" className="sky-launch" onClick={() => goTo(0)}><RotateCcw size={16} />{t('sky.restart')}</button>}
            </>}
          </div>
          <div className="sky-object-caption"><span className="sky-caption-dot" />{t(`sky.${chapter.id}.object`)}<span className="sky-object-range">{chapter.range.replaceAll('.', locale === 'en' ? ',' : '.')}</span></div>
          </div>
        </section>)}
      </div>
    </main>

    <nav className="sky-map" aria-label={t('sky.map')}>
      {[...ATMOSPHERE_STOPS].reverse().map(chapter => {
        const index = ATMOSPHERE_STOPS.indexOf(chapter);
        return <button key={chapter.id} type="button" aria-label={`${t(`sky.${chapter.id}.name`)} · ${chapter.range.replaceAll('.', locale === 'en' ? ',' : '.')}`} className={active === index ? 'is-active' : ''} aria-current={active === index ? 'step' : undefined} onClick={() => goTo(index)}><span className="sky-map-name">{t(`sky.${chapter.id}.name`)}</span><span className="sky-map-tick" /></button>;
      })}
    </nav>

    <footer className="sky-dashboard">
      <div className="sky-altimeter"><span>{t('sky.altitude')}</span><strong>{new Intl.NumberFormat(locale).format(stop.altitude)}<small> km</small></strong></div>
      <div className="sky-scroll-hint"><span className="sky-mouse-hint">{t('sky.scroll')}</span><span className="sky-touch-hint">{t('sky.touch')}</span><small>{t('sky.scale')}</small></div>
      <div className="sky-controls"><button type="button" className="sky-motion-control" aria-label={t('sky.pauseMotion')} aria-pressed={motionPaused} onClick={() => setMotionPaused(value => !value)}>{motionPaused ? <Play size={16} /> : <Pause size={16} />}</button><button type="button" aria-label={t('sky.down')} disabled={active === 0} onClick={() => goTo(Math.max(0, active - 1))}><ArrowDown size={19} /></button><button type="button" aria-label={t('sky.up')} disabled={active === ATMOSPHERE_STOPS.length - 1} onClick={() => goTo(Math.min(ATMOSPHERE_STOPS.length - 1, active + 1))}><ArrowUp size={19} /></button></div>
    </footer>
  </div>;
}
