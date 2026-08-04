import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Moon, Sun, Volume2, VolumeX } from 'lucide-react';
import { useI18n } from '../i18n';
import { sfx } from '../core/sound';

type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'ihnttd.theme';

function detectTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* localStorage tidak tersedia, pakai preferensi sistem */
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    'content',
    theme === 'light' ? '#f7f7f5' : '#1b1b1a',
  );
}

export function Header({ wide = false }: { wide?: boolean }) {
  const { locale, setLocale, t } = useI18n();
  const [muted, setMuted] = useState(sfx.muted);
  const [theme, setTheme] = useState<Theme>(detectTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* abaikan */
    }
  }, [theme]);

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b border-ink/15 bg-paper">
      <div className={`mx-auto grid min-h-14 w-full grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6 ${wide ? 'max-w-[1800px] lg:px-8' : 'max-w-5xl'}`}>
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink sm:text-[10px]">
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
            onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
            aria-label={theme === 'dark' ? t('a11y.lightMode') : t('a11y.darkMode')}
            className="grid size-9 cursor-pointer place-items-center bg-paper outline-none transition-colors duration-200 hover:bg-ink hover:text-paper focus-visible:bg-ink focus-visible:text-paper"
          >
            {theme === 'dark' ? <Sun size={16} strokeWidth={1.7} /> : <Moon size={16} strokeWidth={1.7} />}
          </button>
          <button
            type="button"
            onClick={() => {
              sfx.unlock();
              setMuted(sfx.toggleMute());
            }}
            aria-label={muted ? t('a11y.unmute') : t('a11y.mute')}
            className="grid size-9 cursor-pointer place-items-center bg-paper outline-none transition-colors duration-200 hover:bg-ink hover:text-paper focus-visible:bg-ink focus-visible:text-paper"
          >
            {muted ? <VolumeX size={16} strokeWidth={1.7} /> : <Volume2 size={16} strokeWidth={1.7} />}
          </button>
        </div>
      </div>
    </header>
  );
}
