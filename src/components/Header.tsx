import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Volume2, VolumeX } from 'lucide-react';
import { useI18n } from '../i18n';
import { sfx } from '../core/sound';

export function Header() {
  const { locale, setLocale, t } = useI18n();
  const [muted, setMuted] = useState(sfx.muted);

  return (
    <header className="flex items-center justify-between px-5 py-4 max-w-3xl mx-auto w-full">
      <Link to="/" className="font-display text-xl leading-none lowercase">
        ihavenothing<span className="text-coral">todo</span>
      </Link>
      <div className="flex items-center gap-2">
        <div className="flex rounded-full border-[3px] border-ink overflow-hidden text-sm font-bold">
          {(['id', 'en'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLocale(l)}
              aria-pressed={locale === l}
              className={`px-2.5 py-1 uppercase cursor-pointer ${
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
          className="rounded-full border-[3px] border-ink bg-paper p-1.5 cursor-pointer"
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>
    </header>
  );
}
