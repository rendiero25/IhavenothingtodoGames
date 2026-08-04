import { useEffect, useMemo, useState } from 'react';
import { Shuffle } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Header } from '../components/Header';
import { GameCard } from '../components/GameCard';
import { GameModal } from '../components/GameModal';
import { GAMES } from '../games/registry';
import { useI18n } from '../i18n';
import { sfx } from '../core/sound';
import type { Category, GameMeta } from '../games/types';

type Filter = 'all' | Category;

function PreviewPanel({
  game,
  reduceMotion,
}: {
  game: GameMeta;
  reduceMotion: boolean | null;
}) {
  const { locale } = useI18n();
  const extraDescription = locale === 'id'
    ? 'Mainkan beberapa ronde pendek untuk menemukan ritme terbaikmu dan mengejar skor tertinggi.'
    : 'Play a few short rounds to find your rhythm and chase your highest score.';

  return (
    <motion.div
      key={game.id}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full min-h-[30rem] flex-col"
    >
      <div className="flex flex-1 flex-col items-center justify-center py-12 lg:py-16">
        <div className="w-full max-w-[38rem] text-left">
          <h2 className="font-pixel text-[clamp(2rem,3.4vw,4.3rem)] leading-[0.86] tracking-[-0.06em]">
            {game.name[locale]}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-ink/75">
            {game.tagline[locale]}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink/60">
            {game.howTo[locale]}
          </p>
          <p className="mt-3 max-w-[34rem] text-sm leading-relaxed text-ink/45">
            {extraDescription}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const { locale, t } = useI18n();
  const reduceMotion = useReducedMotion();
  const [filter, setFilter] = useState<Filter>('all');
  const [previewId, setPreviewId] = useState(GAMES[Math.floor(GAMES.length / 2)].id);
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
  const previewIndex = Math.max(filteredGames.findIndex((game) => game.id === previewGame.id), 0);

  useEffect(() => {
    if (!filteredGames.some((game) => game.id === previewId)) {
      setPreviewId(filteredGames[0]?.id ?? GAMES[0].id);
    }
  }, [filteredGames, previewId]);

  useEffect(() => {
    const row = document.getElementById(`game-row-${previewGame.id}`);
    row?.scrollIntoView({
      block: 'center',
      inline: 'nearest',
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }, [previewGame.id, reduceMotion]);

  useEffect(() => {
    document.title = 'ihavenothingtodo';
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

      <main className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8">
        <section className="flex min-h-12 items-center justify-between gap-4 py-2" aria-label={locale === 'id' ? 'Filter kategori' : 'Category filters'}>
          <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.14em] text-ink">
            {locale === 'id' ? 'Filter:' : 'Filter:'}
          </span>
          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
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
                  className={`min-h-8 shrink-0 cursor-pointer px-2.5 font-mono text-[9px] uppercase tracking-[0.1em] outline-none transition-colors duration-200 ${
                    active
                      ? 'bg-ink text-paper'
                      : 'text-ink/40 hover:text-ink focus-visible:bg-ink focus-visible:text-paper'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={randomGame}
            className="inline-flex min-h-8 shrink-0 cursor-pointer items-center gap-2 pl-3 font-mono text-[9px] uppercase tracking-[0.1em] text-ink outline-none hover:text-ink/70 focus-visible:text-ink"
          >
            <Shuffle size={13} strokeWidth={1.6} />
            <span className="hidden sm:inline">{locale === 'id' ? 'Acak' : 'Random'}</span>
          </button>
        </section>

        <section className="grid lg:grid-cols-[minmax(0,1.22fr)_minmax(23rem,0.78fr)]">
          <div className="wheel-viewport order-2 min-w-0 max-h-[58dvh] lg:order-1 lg:h-[calc(100dvh-7.25rem)] lg:max-h-none">
            <div className="flex items-center justify-between py-3 font-mono text-[9px] uppercase tracking-[0.14em] text-ink">
              <span>{locale === 'id' ? 'Pilih game' : 'Choose a game'}</span>
              <span>{filteredGames.length} / {GAMES.length}</span>
            </div>
            <nav aria-label={t('home.grid.title')} className="wheel-scroll lg:pr-8">
              {filteredGames.map((meta, index) => (
                <GameCard
                  key={meta.id}
                  meta={meta}
                  index={GAMES.indexOf(meta)}
                  distance={index - previewIndex}
                  selected={previewGame.id === meta.id}
                  onPreview={() => setPreviewId(meta.id)}
                  onSelect={() => launch(meta)}
                />
              ))}
            </nav>
          </div>

          <aside className="order-1 min-h-[34rem] py-6 lg:order-2 lg:min-h-0 lg:py-8 lg:pl-8" aria-live="polite">
            <PreviewPanel
              game={previewGame}
              reduceMotion={reduceMotion}
            />
          </aside>
        </section>

        <footer className="flex min-h-12 items-center justify-between font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft">
          <span>ihavenothingtodo</span>
          <span>{t('home.footer')}</span>
        </footer>
      </main>

      {openGame && <GameModal meta={openGame} onClose={() => setOpenGame(null)} />}
    </div>
  );
}
