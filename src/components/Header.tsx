import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Volume2, VolumeX } from 'lucide-react';
import { useI18n } from '../i18n';
import { sfx } from '../core/sound';

export function Header({ wide = false }: { wide?: boolean }) {
  const { locale, setLocale, t } = useI18n();
  const [muted, setMuted] = useState(sfx.muted);

  return (
    <header className="sticky top-0 z-30 border-b border-ink bg-paper">
      <div className={`mx-auto flex min-h-16 w-full items-center justify-between gap-4 px-4 sm:px-6 ${wide ? 'max-w-[1600px] lg:px-8' : 'max-w-5xl'}`}>
        <Link
          to="/"
          className="font-mono text-xs font-semibold lowercase tracking-[-0.03em] outline-none focus-visible:underline focus-visible:underline-offset-4 sm:text-sm"
        >
          ihavenothingtodo
        </Link>

        <div className="flex items-center gap-1">
          <div className="flex" aria-label={locale === 'id' ? 'Pilih bahasa' : 'Choose language'}>
            {(['id', 'en'] as const).map((language) => (
              <button
                key={language}
                type="button"
                onClick={() => setLocale(language)}
                aria-pressed={locale === language}
                className={`min-h-10 min-w-10 cursor-pointer px-2 font-mono text-[10px] uppercase outline-none transition-colors duration-200 ${locale === language ? 'bg-ink text-paper' : 'bg-paper text-ink hover:bg-ink hover:text-paper focus-visible:bg-ink focus-visible:text-paper'}`}
              >
                {language}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              sfx.unlock();
              setMuted(sfx.toggleMute());
            }}
            aria-label={muted ? t('a11y.unmute') : t('a11y.mute')}
            className="grid size-10 cursor-pointer place-items-center border-l border-ink/20 bg-paper outline-none transition-colors duration-200 hover:bg-ink hover:text-paper focus-visible:bg-ink focus-visible:text-paper"
          >
            {muted ? <VolumeX size={16} strokeWidth={1.7} /> : <Volume2 size={16} strokeWidth={1.7} />}
          </button>
        </div>
      </div>
    </header>
  );
}
