import { useNavigate } from 'react-router-dom';
import { ChunkyButton } from '../components/ChunkyButton';
import { Header } from '../components/Header';
import { useI18n } from '../i18n';

type Section = 'education' | 'weird';

export default function SectionPlaceholder({ section }: { section: Section }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const isEducation = section === 'education';

  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <Header wide />
      <main className="flex flex-1 items-center justify-center px-6 py-16 text-center">
        <div className="max-w-md">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
            {isEducation ? t('nav.education') : t('nav.weird')}
          </p>
          <h1 className="mt-4 font-pixel text-5xl tracking-[-0.04em]">
            {isEducation ? t('section.education.title') : t('section.weird.title')}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            {isEducation ? t('section.education.body') : t('section.weird.body')}
          </p>
          <div className="mt-8">
            <ChunkyButton color="teal" onClick={() => navigate('/')}>
              {t('section.back')}
            </ChunkyButton>
          </div>
        </div>
      </main>
    </div>
  );
}
