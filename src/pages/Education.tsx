import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DepthJourney } from '../components/education/DepthJourney';
import { BELOW_THE_SURFACE_STOPS } from '../education/below-the-surface';
import { useI18n } from '../i18n';

export default function Education() {
  const { t } = useI18n();
  const hasStops = BELOW_THE_SURFACE_STOPS.length > 0;

  useEffect(() => {
    document.title = `${t('education.page.title')} — ${t('site.name')}`;

    return () => {
      document.title = t('site.name');
    };
  }, [t]);

  return (
    <div className="relative min-h-dvh min-w-0 overflow-x-clip bg-[#080a0a] text-ink">
      <nav
        className="absolute inset-x-6 top-6 z-30 sm:inset-x-10 sm:top-8 lg:inset-x-[8vw]"
        aria-label={t('education.page.backToEducation')}
      >
        <Link
          to="/education"
          className="inline-flex min-h-11 items-center gap-2 border border-white/25 bg-black/35 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white outline-none transition-colors duration-200 hover:bg-white hover:text-black focus-visible:bg-white focus-visible:text-black"
        >
          <ArrowLeft aria-hidden="true" size={14} strokeWidth={1.7} />
          {t('education.page.backToEducation')}
        </Link>
      </nav>

      <main className="w-full">
        <h1 id="education-page-title" className="sr-only">
          {t('education.page.title')}
        </h1>
        <p className="sr-only">{t('education.page.intro')}</p>

        {hasStops ? (
          <section aria-labelledby="education-page-title" className="w-full">
            <DepthJourney
              stops={BELOW_THE_SURFACE_STOPS}
              introTitle={t('education.page.title')}
              introDescription={t('education.page.intro')}
            />
          </section>
        ) : (
          <section className="flex min-h-[100svh] items-center justify-center px-6 py-16 text-center">
            <p className="max-w-xl text-base leading-8 text-ink/68">{t('education.page.empty')}</p>
          </section>
        )}
      </main>
    </div>
  );
}
