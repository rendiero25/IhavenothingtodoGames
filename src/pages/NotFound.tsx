import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Mascot } from '../components/Mascot';
import { ChunkyButton } from '../components/ChunkyButton';
import { useI18n } from '../i18n';

export default function NotFound() {
  const { t } = useI18n();
  const nav = useNavigate();
  return (
    <div className="min-h-dvh">
      <Header />
      <main className="flex flex-col items-center px-6 pt-16 text-center">
        <Mascot expression="sleep" size={130} />
        <h1 className="mt-6 font-display text-4xl">{t('notfound.title')}</h1>
        <p className="mt-2 text-ink-soft">{t('notfound.body')}</p>
        <div className="mt-6">
          <ChunkyButton color="coral" onClick={() => nav('/')}>
            {t('notfound.cta')}
          </ChunkyButton>
        </div>
      </main>
    </div>
  );
}
