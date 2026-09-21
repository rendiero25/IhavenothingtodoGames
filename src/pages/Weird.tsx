import { type FormEvent, useState } from 'react';
import { Header } from '../components/Header';
import { todayKey } from '../core/daily';
import { useI18n } from '../i18n';
import { getSeoPage } from '../seo/pages';
import { usePageSeo } from '../seo/usePageSeo';
import { diceKey, meterKey, oracleKey, permitCode, permitKey, reactionKey } from '../weird/cabinet';

const actionClass = 'mt-5 inline-flex min-h-11 items-center border border-ink px-4 font-mono text-[10px] uppercase tracking-[0.12em] outline-none transition-colors hover:bg-ink hover:text-paper focus-visible:bg-ink focus-visible:text-paper';

export default function Weird() {
  const { locale, t } = useI18n();
  usePageSeo(getSeoPage('/weird'), locale);
  const [oracleStep, setOracleStep] = useState(0);
  const [presses, setPresses] = useState(0);
  const [roll, setRoll] = useState(0);
  const [boredom, setBoredom] = useState(2);
  const [permitDraft, setPermitDraft] = useState('');
  const [permit, setPermit] = useState<{ subject: string; issue: number } | null>(null);
  const dateKey = todayKey();
  const issuePermit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const subject = permitDraft.trim() || t('weird.permit.defaultSubject');
    setPermit((current) => ({ subject, issue: (current?.issue ?? 0) + 1 }));
  };

  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <Header wide />
      <main className="mx-auto w-full max-w-[1800px] flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <header className="max-w-2xl">
          <h1 className="font-pixel text-[clamp(3rem,8vw,7rem)] leading-[0.82] tracking-[-0.065em]">{t('weird.title')}</h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink/65">{t('weird.description')}</p>
        </header>

        <section className="mt-12 grid gap-12 md:grid-cols-3 md:gap-8" aria-label={t('weird.title')}>
          <article>
            <h2 className="font-mono text-[10px] uppercase tracking-[0.14em]">{t('weird.oracle.label')}</h2>
            <p className="mt-4 text-xl leading-snug" aria-live="polite">{t(oracleKey(dateKey, oracleStep))}</p>
            <button type="button" className={actionClass} onClick={() => setOracleStep((step) => step + 1)}>{t('weird.oracle.action')}</button>
          </article>

          <article>
            <h2 className="font-mono text-[10px] uppercase tracking-[0.14em]">{t('weird.button.label')}</h2>
            <p className="mt-4 text-xl leading-snug" aria-live="polite">{t(reactionKey(presses))}</p>
            <button type="button" className={actionClass} onClick={() => setPresses((count) => count + 1)}>{t('weird.button.action')}</button>
          </article>

          <article>
            <h2 className="font-mono text-[10px] uppercase tracking-[0.14em]">{t('weird.dice.label')}</h2>
            <p className="mt-4 text-xl leading-snug" aria-live="polite">{t(diceKey(dateKey, roll))}</p>
            <button type="button" className={actionClass} onClick={() => setRoll((count) => count + 1)}>{t('weird.dice.action')}</button>
          </article>
        </section>

        <section className="mt-14 border-y border-ink py-7 sm:py-9" aria-labelledby="weird-meter-title">
          <div className="grid gap-6 md:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] md:items-end">
            <div>
              <h2 id="weird-meter-title" className="font-mono text-[10px] uppercase tracking-[0.14em]">{t('weird.meter.label')}</h2>
              <label htmlFor="weird-meter" className="mt-3 block text-xl leading-snug">{t('weird.meter.prompt')}</label>
            </div>
            <div>
              <input id="weird-meter" className="w-full cursor-ew-resize accent-ink" type="range" min="0" max="5" value={boredom} onChange={(event) => setBoredom(Number(event.target.value))} />
              <div className="mt-2 flex justify-between font-mono text-[9px] uppercase tracking-[0.12em] text-ink/50" aria-hidden="true"><span>0</span><span>5</span></div>
              <p className="mt-5 text-xl leading-snug" aria-live="polite">{t(meterKey(boredom))}</p>
            </div>
          </div>
        </section>

        <section className="mt-14 border-y border-ink bg-ink py-7 text-paper sm:py-9" aria-labelledby="weird-permit-title">
          <div className="grid gap-7 md:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] md:items-start">
            <div>
              <h2 id="weird-permit-title" className="font-mono text-[10px] uppercase tracking-[0.14em]">{t('weird.permit.label')}</h2>
              <p id="weird-permit-note" className="mt-4 max-w-sm text-xl leading-snug">{t('weird.permit.note')}</p>
            </div>
            <form onSubmit={issuePermit}>
              <label htmlFor="weird-permit" className="block font-mono text-[10px] uppercase tracking-[0.14em]">{t('weird.permit.prompt')}</label>
              <textarea id="weird-permit" value={permitDraft} maxLength={48} aria-describedby="weird-permit-note" placeholder={t('weird.permit.placeholder')} onChange={(event) => setPermitDraft(event.target.value)} className="mt-3 min-h-24 w-full resize-none border border-paper bg-ink px-4 py-3 text-sm leading-relaxed outline-none placeholder:text-paper/45 focus-visible:bg-paper focus-visible:text-ink focus-visible:placeholder:text-ink/45" />
              <button type="submit" className="mt-5 inline-flex min-h-11 items-center border border-paper px-4 font-mono text-[10px] uppercase tracking-[0.12em] outline-none transition-colors hover:bg-paper hover:text-ink focus-visible:bg-paper focus-visible:text-ink">{t('weird.permit.action')}</button>
            </form>
          </div>
          {permit && (
            <div className="mt-7 border border-paper bg-paper p-5 text-ink" aria-live="polite">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em]">{t('weird.permit.fictional')}</p>
              <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.14em]">{t('weird.permit.code')}: {permitCode(dateKey, permit.subject, permit.issue)}</p>
              <p className="mt-2 break-words text-xl leading-snug">{t('weird.permit.subject')}: {permit.subject}</p>
              <p className="mt-5 font-pixel text-xl leading-none">{t(permitKey(dateKey, permit.subject, permit.issue))}</p>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-ink/60">{t('weird.permit.validity')}</p>
            </div>
          )}
        </section>
      </main>

      <footer className="mx-auto flex min-h-12 w-full max-w-[1800px] shrink-0 items-center justify-center gap-3 overflow-hidden px-4 py-3 font-mono text-[8px] uppercase tracking-[0.1em] text-ink sm:gap-5 sm:px-6 sm:py-0 sm:text-[9px] lg:px-8">
        <a href="https://ko-fi.com/rendiero" target="_blank" rel="noopener noreferrer" className="shrink-0 font-bold text-ink outline-none underline-offset-4 transition-colors duration-200 hover:text-ink/65 hover:underline focus-visible:text-ink focus-visible:underline">{t('home.kofi')}</a>
        <span className="shrink-0">{t('home.footer')}</span>
      </footer>
    </div>
  );
}
