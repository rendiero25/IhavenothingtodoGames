import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Volume2, VolumeX } from 'lucide-react';
import { useI18n } from '../i18n';
import { sfx } from '../core/sound';

export function Header({ wide = false }: { wide?: boolean }) {
  const { locale, setLocale, t } = useI18n();
  const [muted, setMuted] = useState(sfx.muted);

  return (
    <header className="sticky top-0 z-30 border-b border-ink/15 bg-paper">
      <div className={`mx-auto grid min-h-14 w-full grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6 ${wide ? 'max-w-[1800px] lg:px-8' : 'max-w-5xl'}`}>
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-soft sm:text-[10px]">
          {wide ? (locale === 'id' ? 'Pilih game:' : 'Choose your game:') : 'ihavenothingtodo'}
        </span>

        <Link
          to="/"
          className="font-mono text-[11px] font-semibold lowercase tracking-[-0.04em] outline-none focus-visible:underline focus-visible:underline-offset-4 sm:text-xs"
        >
          ihavenothingtodo
        </Link>

        <div className="flex items-center justify-end gap-1">
          {wide && (
            <Link
              to="/daily"
              className="hidden min-h-9 items-center px-2 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft outline-none hover:text-ink focus-visible:text-ink sm:inline-flex"
            >
              {locale === 'id' ? 'Harian' : 'Daily'}
            </Link>
          )}
          <div className="flex" aria-label={locale === 'id' ? 'Pilih bahasa' : 'Choose language'}>
            {(['id', 'en'] as const).map((language) => (
              <button
                key={language}
                type="button"
                onClick={() => setLocale(language)}
                aria-pressed={locale === language}
                className={`min-h-9 min-w-8 cursor-pointer px-2 font-mono text-[9px] uppercase outline-none transition-colors duration-200 ${locale === language ? 'bg-ink text-paper' : 'bg-paper text-ink hover:bg-ink hover:text-paper focus-visible:bg-ink focus-visible:text-paper'}`}
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
            className="grid size-9 cursor-pointer place-items-center border-l border-ink/15 bg-paper outline-none transition-colors duration-200 hover:bg-ink hover:text-paper focus-visible:bg-ink focus-visible:text-paper"
          >
            {muted ? <VolumeX size={16} strokeWidth={1.7} /> : <Volume2 size={16} strokeWidth={1.7} />}
          </button>
        </div>
      </div>
    </header>
  );
}
