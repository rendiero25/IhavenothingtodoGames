import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, Moon, Sun, Volume2, VolumeX, X } from 'lucide-react';
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

function HeaderTab({
  label,
  to,
  mobile = false,
  onNavigate,
}: {
  label: string;
  to: string;
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <NavLink
      end={to === '/'}
      to={to}
      onClick={onNavigate}
      className={({ isActive }) => `${mobile
        ? 'flex min-h-11 w-full items-center px-3 text-[10px]'
        : 'flex min-h-10 shrink-0 items-center px-1.5 text-[8px] sm:px-2 sm:text-[10px]'} font-mono uppercase tracking-[0.1em] outline-none transition-colors duration-200 focus-visible:bg-ink focus-visible:text-paper ${isActive ? 'bg-ink text-paper' : 'text-ink hover:bg-ink hover:text-paper'}`}
    >
      {label}
    </NavLink>
  );
}

export function Header({ wide = false }: { wide?: boolean }) {
  const { locale, setLocale, t } = useI18n();
  const [muted, setMuted] = useState(sfx.muted);
  const [theme, setTheme] = useState<Theme>(detectTheme);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* abaikan */
    }
  }, [theme]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b border-ink/15 bg-paper">
      <div className={`relative mx-auto w-full ${wide ? 'flex min-h-14 items-center gap-x-2 px-3 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:gap-4 sm:px-6' : 'grid min-h-14 grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6'} ${wide ? 'max-w-[1800px] lg:px-8' : 'max-w-5xl'}`}>
        {wide && (
          <button
            type="button"
            aria-label={mobileMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-main-menu"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="order-1 grid size-10 cursor-pointer place-items-center bg-paper outline-none transition-colors duration-200 hover:bg-ink hover:text-paper focus-visible:bg-ink focus-visible:text-paper sm:hidden"
          >
            {mobileMenuOpen ? <X size={18} strokeWidth={1.7} /> : <Menu size={18} strokeWidth={1.7} />}
          </button>
        )}
        {wide ? (
          <nav
            aria-label={locale === 'id' ? 'Menu utama' : 'Main menu'}
            className="hidden items-center gap-0.5 overflow-visible font-mono text-ink sm:order-none sm:flex sm:gap-1"
          >
            <HeaderTab label={t('nav.games')} to="/" />
            <HeaderTab label={t('nav.education')} to="/education" />
            <HeaderTab label={t('nav.weird')} to="/weird" />
          </nav>
        ) : (
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink sm:text-[10px]">
            ihavenothingtodo
          </span>
        )}

        <Link
          to="/"
          className={`${wide ? 'order-1 absolute left-1/2 -translate-x-1/2 sm:static sm:order-none sm:translate-x-0 sm:justify-self-center' : ''} font-mono text-[11px] font-semibold lowercase tracking-[-0.04em] outline-none focus-visible:underline focus-visible:underline-offset-4 sm:text-xs`}
        >
          ihavenothingtodo
        </Link>

        <div className={`${wide ? 'order-1 ml-auto sm:order-none sm:ml-0' : ''} flex items-center justify-end gap-1 sm:justify-self-end`}>
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

        {wide && mobileMenuOpen && (
          <nav
            id="mobile-main-menu"
            aria-label={locale === 'id' ? 'Menu utama' : 'Main menu'}
            className="absolute inset-x-3 top-full z-50 mt-1 max-h-[calc(100dvh-4.5rem)] overflow-y-auto border border-ink bg-paper p-2 text-ink sm:hidden"
          >
            <HeaderTab label={t('nav.games')} to="/" mobile onNavigate={() => setMobileMenuOpen(false)} />
            <HeaderTab label={t('nav.education')} to="/education" mobile onNavigate={() => setMobileMenuOpen(false)} />
            <HeaderTab label={t('nav.weird')} to="/weird" mobile onNavigate={() => setMobileMenuOpen(false)} />
          </nav>
        )}
      </div>
    </header>
  );
}
