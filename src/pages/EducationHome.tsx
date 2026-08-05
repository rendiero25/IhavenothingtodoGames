import { type WheelEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { Header } from '../components/Header';
import { EducationCard } from '../components/education/EducationCard';
import { useI18n } from '../i18n';

const EDUCATION_ENTRY = {
  id: 'below-the-surface',
  path: '/education/below-the-surface',
} as const;

function PreviewPanel({ reduceMotion }: { reduceMotion: boolean | null }) {
  const { t } = useI18n();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full min-h-0 flex-col"
    >
      <div className="flex flex-1 flex-col items-center justify-center py-12 lg:py-16">
        <div className="w-full max-w-[38rem] text-left">
          <h2 className="font-pixel text-[clamp(2rem,3.4vw,4.3rem)] leading-[0.86] tracking-[-0.06em]">
            {t('education.page.title')}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-ink/75">
            {t('education.page.intro')}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink/60">
            {t('education.home.item.howTo')}
          </p>
          <p className="mt-3 max-w-[34rem] text-sm leading-relaxed text-ink/45">
            {t('education.home.item.extra')}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function EducationHome() {
  const { locale, t } = useI18n();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [selectedId, setSelectedId] = useState(EDUCATION_ENTRY.id);

  useEffect(() => {
    document.title = `${t('nav.education')} — ${t('site.name')}`;
    return () => {
      document.title = t('site.name');
    };
  }, [t]);

  useEffect(() => {
    const row = document.getElementById(`education-row-${selectedId}`);
    row?.scrollIntoView({
      block: 'center',
      inline: 'nearest',
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }, [reduceMotion, selectedId]);

  const selectEntry = () => {
    setSelectedId(EDUCATION_ENTRY.id);
    navigate(EDUCATION_ENTRY.path);
  };

  const handleEducationWheel = (event: WheelEvent<HTMLElement>) => {
    if (!event.deltaY) return;
    event.preventDefault();
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-paper text-ink">
      <Header wide />

      <main className="mx-auto flex min-h-0 w-full max-w-[1800px] flex-1 flex-col overflow-y-auto px-4 sm:px-6 lg:overflow-hidden lg:px-8">
        <section
          className="flex min-h-12 items-center justify-between gap-4 py-2"
          aria-label={locale === 'id' ? 'Daftar education' : 'Education list'}
        >
          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
            <span className="shrink-0 bg-ink px-2.5 py-2 font-mono text-[9px] uppercase tracking-[0.1em] text-paper">
              {t('nav.education')}
            </span>
          </div>
        </section>

        <section className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1.22fr)_minmax(23rem,0.78fr)]">
          <div className="wheel-viewport order-2 min-w-0 max-h-[58dvh] lg:order-1 lg:h-full lg:max-h-none">
            <div className="flex items-center justify-between py-3 font-mono text-[9px] uppercase tracking-[0.14em] text-ink">
              <span>{t('education.home.choose')}</span>
              <span>01 / 01</span>
            </div>
            <nav
              aria-label={t('education.home.choose')}
              className="wheel-scroll lg:pr-8"
              onWheel={handleEducationWheel}
            >
              <EducationCard
                title={t('education.page.title')}
                categoryLabel={t('education.category.geology')}
                index={0}
                selected={selectedId === EDUCATION_ENTRY.id}
                onPreview={() => setSelectedId(EDUCATION_ENTRY.id)}
                onSelect={selectEntry}
              />
            </nav>
          </div>

          <aside className="order-1 hidden min-h-0 py-6 md:block lg:order-2 lg:min-h-0 lg:py-8 lg:pl-8" aria-live="polite">
            <PreviewPanel reduceMotion={reduceMotion} />
          </aside>
        </section>
      </main>

      <footer className="mx-auto flex min-h-12 w-full max-w-[1800px] shrink-0 items-center justify-center gap-3 overflow-hidden px-4 py-3 font-mono text-[8px] uppercase tracking-[0.1em] text-ink sm:gap-5 sm:px-6 sm:py-0 sm:text-[9px] lg:px-8">
        <a
          href="https://ko-fi.com/rendiero"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 font-bold text-ink outline-none underline-offset-4 transition-colors duration-200 hover:text-ink/65 hover:underline focus-visible:text-ink focus-visible:underline"
        >
          {t('home.kofi')}
        </a>
        <span className="shrink-0">{t('home.footer')}</span>
      </footer>
    </div>
  );
}
