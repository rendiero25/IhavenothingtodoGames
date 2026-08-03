import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, Shuffle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { Header } from '../components/Header';
import { GameArtwork } from '../components/GameArtwork';
import { GameCard } from '../components/GameCard';
import { GameModal } from '../components/GameModal';
import { GAMES } from '../games/registry';
import { useI18n } from '../i18n';
import { sfx } from '../core/sound';
import type { Category, GameMeta } from '../games/types';

type Filter = 'all' | Category;

export default function Home() {
  const { locale, t } = useI18n();
  const reduceMotion = useReducedMotion();
  const [filter, setFilter] = useState<Filter>('all');
  const [previewId, setPreviewId] = useState(GAMES[0].id);
  const [openGame, setOpenGame] = useState<GameMeta | null>(null);

  const filters = useMemo<Filter[]>(
    () => ['all', ...Array.from(new Set(GAMES.map((game) => game.category)))],
    [],
  );
  const filteredGames = useMemo(
    () => (filter === 'all' ? GAMES : GAMES.filter((game) => game.category === filter)),
    [filter],
  );
  const previewGame =
    filteredGames.find((game) => game.id === previewId) ?? filteredGames[0] ?? GAMES[0];

  useEffect(() => {
    if (!filteredGames.some((game) => game.id === previewId)) {
      setPreviewId(filteredGames[0]?.id ?? GAMES[0].id);
    }
  }, [filteredGames, previewId]);

  useEffect(() => {
    document.title = 'ihavenothingtodo | quick games';
    return () => {
      document.title = 'ihavenothingtodo';
    };
  }, []);

  const launch = (game: GameMeta) => {
    sfx.unlock();
    sfx.play('coin');
    setPreviewId(game.id);
    setOpenGame(game);
  };

  const randomGame = () => {
    const pool = filteredGames.length > 0 ? filteredGames : GAMES;
    launch(pool[Math.floor(Math.random() * pool.length)]);
  };

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <Header wide />

      <main>
        <section className="mx-auto grid max-w-[1600px] gap-8 border-b border-ink px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:px-8">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
              {locale === 'id' ? '9 game, tanpa akun' : '9 games, no account'}
            </p>
            <h1 className="mt-4 max-w-[16ch] text-[clamp(2.75rem,6vw,6.25rem)] font-medium leading-[0.92] tracking-[-0.065em]">
              {locale === 'id' ? 'Pilih satu. Main sekarang.' : 'Pick one. Play now.'}
            </h1>
            <p className="mt-5 max-w-[52ch] text-sm leading-relaxed text-ink/65 sm:text-base">
              {t('site.tagline')}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <button
              type="button"
              onClick={randomGame}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 border border-ink bg-ink px-4 text-sm font-medium text-paper outline-none transition-colors duration-200 hover:bg-paper hover:text-ink focus-visible:bg-paper focus-visible:text-ink"
            >
              <Shuffle size={15} strokeWidth={1.8} />
              {t('home.bored')}
            </button>
            <Link
              to="/daily"
              className="inline-flex min-h-11 items-center gap-2 border border-ink px-4 text-sm font-medium outline-none transition-colors duration-200 hover:bg-ink hover:text-paper focus-visible:bg-ink focus-visible:text-paper"
            >
              <CalendarDays size={15} strokeWidth={1.8} />
              {t('home.daily.title')}
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto border-b border-ink py-4" aria-label={locale === 'id' ? 'Filter kategori' : 'Category filters'}>
            {filters.map((item) => {
              const active = filter === item;
              const label = item === 'all'
                ? locale === 'id' ? 'Semua' : 'All'
                : t(`cat.${item}` as const);
              return (
                <button
                  key={item}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(item)}
                  className={`min-h-10 shrink-0 cursor-pointer rounded-full border px-4 font-mono text-[10px] uppercase tracking-[0.12em] outline-none transition-colors duration-200 ${
                    active
                      ? 'border-ink bg-ink text-paper'
                      : 'border-ink/30 bg-paper text-ink hover:border-ink focus-visible:border-ink'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="grid border-b border-ink lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)]">
            <nav
              aria-label={t('home.grid.title')}
              className="min-w-0 lg:max-h-[calc(100dvh-15.5rem)] lg:overflow-y-auto lg:border-r lg:border-ink lg:pr-6"
            >
              {filteredGames.map((meta) => (
                <GameCard
                  key={meta.id}
                  meta={meta}
                  index={GAMES.indexOf(meta)}
                  selected={previewGame.id === meta.id}
                  onPreview={() => setPreviewId(meta.id)}
                  onSelect={() => launch(meta)}
                />
              ))}
            </nav>

            <aside className="hidden min-h-[34rem] p-6 lg:block xl:p-8" aria-live="polite">
              <motion.div
                key={previewGame.id}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="flex h-full flex-col"
              >
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                  <span>{t(`cat.${previewGame.category}` as const)}</span>
                  <span>{String(GAMES.indexOf(previewGame) + 1).padStart(2, '0')} / {String(GAMES.length).padStart(2, '0')}</span>
                </div>

                <button
                  type="button"
                  onClick={() => launch(previewGame)}
                  className="mt-5 block aspect-[8/5] w-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-4"
                  aria-label={`${locale === 'id' ? 'Mainkan' : 'Play'} ${previewGame.name[locale]}`}
                >
                  <GameArtwork
                    gameId={previewGame.id}
                    label={`${previewGame.name[locale]} preview`}
                  />
                </button>

                <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_11rem]">
                  <div>
                    <h2 className="font-pixel text-[clamp(1.7rem,2.8vw,3.25rem)] leading-[0.95] tracking-[-0.045em]">
                      {previewGame.name[locale]}
                    </h2>
                    <p className="mt-3 max-w-[38rem] text-sm leading-relaxed text-ink/65">
                      {previewGame.tagline[locale]}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => launch(previewGame)}
                    className="group inline-flex min-h-11 cursor-pointer items-center justify-between self-end border-t border-ink py-3 text-sm font-medium outline-none focus-visible:bg-ink focus-visible:px-3 focus-visible:text-paper"
                  >
                    {locale === 'id' ? 'Buka game' : 'Open game'}
                    <ArrowRight className="transition-transform duration-200 group-hover:translate-x-1" size={16} strokeWidth={1.8} />
                  </button>
                </div>
              </motion.div>
            </aside>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-[1600px] flex-col gap-2 px-4 py-5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <span>© {new Date().getFullYear()} ihavenothingtodo</span>
        <span>{t('home.footer')}</span>
      </footer>

      {openGame && <GameModal meta={openGame} onClose={() => setOpenGame(null)} />}
    </div>
  );
}
