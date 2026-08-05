import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
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
    <div className="flex min-h-dvh min-w-0 flex-col overflow-x-clip bg-paper text-ink">
      <Header wide />

      <main className="mx-auto flex w-full min-w-0 max-w-[1800px] flex-1 flex-col px-4 pb-16 sm:px-6 lg:px-8">
        <section aria-labelledby="education-page-title" className="py-8 sm:py-10 lg:py-12">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/62">
            {t('nav.education')}
          </p>
          <h1
            id="education-page-title"
            className="mt-4 max-w-4xl font-pixel text-[clamp(2.75rem,7vw,5.75rem)] leading-[0.88] tracking-[-0.06em]"
          >
            {t('education.page.title')}
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-ink/78 sm:text-base">
            {t('education.page.intro')}
          </p>
        </section>

        {hasStops ? (
          <>
            <section aria-labelledby="education-journey-title" className="pb-12 sm:pb-16">
              <div className="flex flex-wrap items-center justify-between gap-3 border-y border-ink/15 py-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/62">
                  {t('education.page.surfaceLabel')}
                </p>
                <h2
                  id="education-journey-title"
                  className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/62"
                >
                  {t('education.page.depthJourneyLabel')}
                </h2>
              </div>

              <div className="pt-6">
                <DepthJourney stops={BELOW_THE_SURFACE_STOPS} />
              </div>
            </section>

            <section
              aria-labelledby="education-ending-title"
              className="border-t border-ink/15 py-10 sm:py-12"
            >
              <div className="max-w-3xl">
                <h2 id="education-ending-title" className="text-balance font-geist text-3xl leading-tight sm:text-4xl">
                  {t('education.page.endingTitle')}
                </h2>
                <p className="mt-4 text-sm leading-7 text-ink/78 sm:text-base">
                  {t('education.page.endingBody')}
                </p>
                <Link
                  to="/"
                  className="mt-6 inline-flex min-h-11 items-center rounded-full border border-ink/20 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] outline-none transition-colors duration-200 hover:bg-ink hover:text-paper focus-visible:bg-ink focus-visible:text-paper"
                >
                  {t('education.page.backToGames')}
                </Link>
              </div>
            </section>
          </>
        ) : (
          <section className="pb-12 sm:pb-16">
            <div className="max-w-2xl rounded-[2rem] border border-ink/15 bg-paper p-6 sm:p-8">
              <p className="text-sm leading-7 text-ink/78 sm:text-base">{t('education.page.empty')}</p>
              <Link
                to="/"
                className="mt-6 inline-flex min-h-11 items-center rounded-full border border-ink/20 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] outline-none transition-colors duration-200 hover:bg-ink hover:text-paper focus-visible:bg-ink focus-visible:text-paper"
              >
                {t('education.page.backToGames')}
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
