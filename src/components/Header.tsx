import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Volume2, VolumeX } from 'lucide-react';
import { useI18n } from '../i18n';
import { sfx } from '../core/sound';
import { Mascot } from './Mascot';

export function Header({ wide = false }: { wide?: boolean }) {
  const { locale, setLocale, t } = useI18n();
  const [muted, setMuted] = useState(sfx.muted);

  return (
    <header
      className={`mx-auto flex w-full items-center justify-between px-5 py-4 ${
        wide ? 'max-w-[1440px]' : 'max-w-3xl'
      }`}
    >
      <Link
        to="/"
        className="group flex items-center gap-2.5 rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-coral focus-visible:ring-offset-4"
      >
        {wide && (
          <span className="transition-transform duration-200 ease-out group-hover:-rotate-6">
            <Mascot size={42} />
          </span>
        )}
        <span className="font-display text-xl leading-none lowercase sm:text-2xl">
          ihavenothing<span className="text-coral">todo</span>
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <div className="flex rounded-full border-[3px] border-ink overflow-hidden text-sm font-bold">
          {(['id', 'en'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLocale(l)}
              aria-pressed={locale === l}
              className={`min-h-11 cursor-pointer px-3 py-1 text-xs uppercase outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-inset ${
                locale === l ? 'bg-ink text-cream' : 'bg-paper text-ink'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            sfx.unlock();
            setMuted(sfx.toggleMute());
          }}
          aria-label={muted ? t('a11y.unmute') : t('a11y.mute')}
          className="grid size-11 cursor-pointer place-items-center rounded-full border-[3px] border-ink bg-paper outline-none transition-transform duration-150 ease-out hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-coral focus-visible:ring-offset-2"
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>
    </header>
  );
}
