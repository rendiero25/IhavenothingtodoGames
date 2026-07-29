# ihavenothingtodo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Website arcade statis berisi 8 mini-game canvas dengan sistem 5 nyawa, Daily Gauntlet deterministik, Boredom Receipt (PNG), dan i18n ID/EN.

**Architecture:** Shell React (routing, HUD, halaman) + engine game vanilla TS di canvas dengan kontrak `GameEngine` seragam dan kelas dasar `BaseEngine` bersama. Semua keacakan lewat PRNG seeded (mulberry32) agar Daily Gauntlet identik untuk semua pengunjung tanpa server. Tidak ada backend; satu-satunya persistensi adalah preferensi bahasa & mute di localStorage.

**Tech Stack:** Vite, React 19, TypeScript (strict), Tailwind CSS v4 (`@tailwindcss/vite`), Motion (`motion/react`), lucide-react, react-router-dom v7, Vitest.

**Spec:** `docs/superpowers/specs/2026-07-09-ihavenothingtodo-design.md`

---

## File Structure

```
index.html                          — meta, Google Fonts (Lilita One, Nunito, Press Start 2P)
vite.config.ts                      — plugin react + tailwind, konfigurasi vitest
tsconfig.json                       — single tsconfig, strict
vercel.json                         — SPA rewrite
public/favicon.svg                  — maskot blob
src/main.tsx                        — bootstrap: router + I18nProvider
src/App.tsx                         — routes + unlock audio
src/styles/global.css               — Tailwind v4 @theme tokens + base
src/core/rng.ts                     — hashString, mulberry32, seededShuffle, randInt, pick
src/core/daily.ts                   — todayKey, dailySeed, dailyLineup, stageSeed
src/core/score.ts                   — comboMultiplier, titleFor, formatDuration
src/core/sound.ts                   — sfx singleton WebAudio (bleep sintetis), mute persist
src/core/receipt.ts                 — receiptLines (pure) + renderReceiptPng + download/share
src/core/idle.ts                    — useIdle hook (awake/yawn/sleep)
src/i18n/dict.ts                    — dictionary ID (source of truth) + EN (Record<DictKey,string>)
src/i18n/index.tsx                  — I18nProvider, useI18n
src/games/types.ts                  — GameEngine, GameOptions, GameResult, GameMeta, GameId
src/games/canvas.ts                 — setupCanvas HiDPI, pointerPos, drawRoundRect, palet ARCADE
src/games/base.ts                   — BaseEngine (loop, skor/combo/level, nyawa, roundMs)
src/games/registry.ts               — metadata 8 game + loadEngine (dynamic import)
src/games/<id>/logic.ts|engine.ts|logic.test.ts   — 8 game (lihat Task 11-18)
src/games/word-scramble/words-id.ts|words-en.ts   — kamus kata
src/components/ChunkyButton.tsx     — tombol hard-shadow "tertekan"
src/components/LivesBar.tsx         — 5 hati beranimasi
src/components/Mascot.tsx           — blob SVG dengan ekspresi
src/components/Header.tsx           — nama situs, toggle bahasa, mute
src/components/GameCard.tsx         — kartu game di grid
src/shell/GameShell.tsx             — host canvas, HUD, countdown, pause, beforeunload
src/shell/GameOver.tsx              — layar hasil + preview/download/share receipt
src/pages/Home.tsx                  — hero roulette, kartu daily, grid game
src/pages/Play.tsx                  — free play
src/pages/Daily.tsx                 — alur Daily Gauntlet (5 stage, nyawa dibawa)
src/pages/NotFound.tsx              — 404 bercanda
```

Test colocated: `src/**/*.test.ts` (pure logic, environment node — tidak menyentuh DOM).

Konvensi commit: `feat:`/`test:`/`chore:` singkat, satu commit per task (atau per pasangan test+impl bila task besar).

---

## Fase 1 — Fondasi

### Task 1: Scaffold proyek

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `.gitignore`, `public/favicon.svg`, `src/main.tsx`, `src/App.tsx`, `src/styles/global.css`, `src/vite-env.d.ts`

- [x] **Step 1: Inisialisasi npm dan install dependency**

```bash
npm init -y
npm i react react-dom react-router-dom motion lucide-react
npm i -D vite @vitejs/plugin-react typescript tailwindcss @tailwindcss/vite vitest @types/react @types/react-dom
```

- [x] **Step 2: Set scripts di package.json**

Edit `package.json`, ganti field `scripts` menjadi:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  }
}
```

Tambahkan juga `"type": "module"` di level atas package.json bila belum ada.

- [x] **Step 3: Tulis file konfigurasi**

`vite.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
});
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "noEmit": true,
    "types": ["vite/client"]
  },
  "include": ["src", "vite.config.ts"]
}
```

`.gitignore`:

```
node_modules
dist
*.local
```

- [x] **Step 4: Tulis index.html dan favicon**

`index.html`:

```html
<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>ihavenothingtodo</title>
    <meta name="description" content="Kumpulan game kecil menantang untuk membuang waktu dengan terhormat. 5 nyawa, tanpa akun, tanpa simpan-simpanan." />
    <meta name="theme-color" content="#FFF4E4" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <meta property="og:title" content="ihavenothingtodo" />
    <meta property="og:description" content="lagi gabut? sini." />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@400;700;800&family=Press+Start+2P&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`public/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M32 6C15 6 6 20 6 34c0 16 12 24 26 24s26-8 26-24C58 20 49 6 32 6Z" fill="#E4572E"/><circle cx="24" cy="32" r="4" fill="#26201A"/><circle cx="40" cy="32" r="4" fill="#26201A"/><path d="M26 44q6 5 12 0" stroke="#26201A" stroke-width="3" fill="none" stroke-linecap="round"/></svg>
```

- [x] **Step 5: Tulis entry React minimal**

`src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
```

`src/styles/global.css` (versi awal, token lengkap di Task 2):

```css
@import "tailwindcss";
```

`src/App.tsx`:

```tsx
export default function App() {
  return <h1 className="p-8 text-2xl">ihavenothingtodo — scaffold OK</h1>;
}
```

`src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [x] **Step 6: Verifikasi dev server dan build**

Run: `npm run dev` — buka http://localhost:5173, harus tampil "ihavenothingtodo — scaffold OK". Hentikan server.
Run: `npm run build`
Expected: exit 0, folder `dist/` terbentuk.

- [x] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TS + Tailwind v4"
```

### Task 2: Design tokens & kerangka aplikasi

**Files:**
- Modify: `src/styles/global.css`, `src/App.tsx`, `src/main.tsx`
- Create: `src/pages/Home.tsx`, `src/pages/Play.tsx`, `src/pages/Daily.tsx`, `src/pages/NotFound.tsx`

- [x] **Step 1: Tulis token desain di global.css**

Ganti isi `src/styles/global.css` dengan:

```css
@import "tailwindcss";

@theme {
  --color-cream: #FFF4E4;
  --color-paper: #FFF9F0;
  --color-ink: #26201A;
  --color-ink-soft: #6B5E4F;
  --color-coral: #E4572E;
  --color-coral-dark: #A93A1B;
  --color-teal: #0FA47F;
  --color-teal-dark: #085041;
  --color-amber: #F2A007;
  --color-amber-dark: #8A5A03;
  --color-pink: #E0447C;
  --color-pink-dark: #8F2450;
  --color-navy: #14142B;
  --color-navy-soft: #22224A;
  --color-neon-pink: #FF2E88;
  --color-neon-green: #00E5A0;
  --color-neon-yellow: #FFD23F;
  --color-neon-blue: #4DA6FF;
  --font-display: "Lilita One", system-ui, sans-serif;
  --font-body: "Nunito", system-ui, sans-serif;
  --font-pixel: "Press Start 2P", monospace;
}

body {
  background-color: var(--color-cream);
  color: var(--color-ink);
  font-family: var(--font-body);
  -webkit-tap-highlight-color: transparent;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [x] **Step 2: Buat placeholder pages dan routing**

`src/pages/Home.tsx` (placeholder — versi final di Task 19):

```tsx
export default function Home() {
  return <main className="p-8 font-display text-3xl">home</main>;
}
```

`src/pages/Play.tsx` (placeholder — versi final di Task 9):

```tsx
export default function Play() {
  return <main className="p-8">play</main>;
}
```

`src/pages/Daily.tsx` (placeholder — versi final di Task 20):

```tsx
export default function Daily() {
  return <main className="p-8">daily</main>;
}
```

`src/pages/NotFound.tsx` (placeholder — versi final di Task 21):

```tsx
export default function NotFound() {
  return <main className="p-8">404</main>;
}
```

`src/App.tsx`:

```tsx
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Play from './pages/Play';
import Daily from './pages/Daily';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/play/:gameId" element={<Play />} />
      <Route path="/daily" element={<Daily />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
```

`src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
```

- [x] **Step 3: Verifikasi**

Run: `npm run build`
Expected: exit 0. Lalu `npm run dev`: `/` tampil "home" dengan font Lilita One di latar krem; `/x` tampil "404".

- [x] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: design tokens + routing skeleton"
```

### Task 3: Core RNG (deterministik)

**Files:**
- Create: `src/core/rng.ts`, `src/core/rng.test.ts`

- [x] **Step 1: Tulis failing test**

`src/core/rng.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { hashString, mulberry32, pick, randInt, seededShuffle } from './rng';

describe('hashString', () => {
  it('deterministik dan berbeda antar input', () => {
    expect(hashString('2026-07-09')).toBe(hashString('2026-07-09'));
    expect(hashString('2026-07-09')).not.toBe(hashString('2026-07-10'));
  });
  it('menghasilkan uint32', () => {
    const h = hashString('ihavenothingtodo');
    expect(Number.isInteger(h)).toBe(true);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThan(2 ** 32);
  });
});

describe('mulberry32', () => {
  it('seed sama menghasilkan urutan sama', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 20; i++) expect(a()).toBe(b());
  });
  it('seed beda menghasilkan urutan beda', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });
  it('nilai selalu di [0, 1)', () => {
    const r = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('seededShuffle', () => {
  const arr = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  it('permutasi lengkap tanpa mutasi input', () => {
    const out = seededShuffle(arr, mulberry32(3));
    expect([...out].sort()).toEqual([...arr].sort());
    expect(arr[0]).toBe('a');
  });
  it('deterministik per seed', () => {
    expect(seededShuffle(arr, mulberry32(9))).toEqual(seededShuffle(arr, mulberry32(9)));
  });
});

describe('randInt & pick', () => {
  it('randInt inklusif dalam rentang', () => {
    const r = mulberry32(5);
    for (let i = 0; i < 500; i++) {
      const v = randInt(r, 2, 6);
      expect(v).toBeGreaterThanOrEqual(2);
      expect(v).toBeLessThanOrEqual(6);
    }
  });
  it('pick mengambil elemen dari array', () => {
    const r = mulberry32(5);
    for (let i = 0; i < 100; i++) expect(['x', 'y', 'z']).toContain(pick(r, ['x', 'y', 'z']));
  });
});
```

- [x] **Step 2: Run test, pastikan gagal**

Run: `npm test`
Expected: FAIL — `Cannot find module './rng'` (atau setara).

- [x] **Step 3: Implementasi**

`src/core/rng.ts`:

```ts
export function hashString(s: string): number {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(arr: readonly T[], rand: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function randInt(rand: () => number, min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1));
}

export function pick<T>(rand: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}
```

- [x] **Step 4: Run test, pastikan lulus**

Run: `npm test`
Expected: PASS semua.

- [x] **Step 5: Commit**

```bash
git add src/core/rng.ts src/core/rng.test.ts
git commit -m "feat: seeded RNG core (mulberry32, hashString, shuffle)"
```

### Task 4: i18n (ID/EN)

**Files:**
- Create: `src/i18n/dict.ts`, `src/i18n/index.tsx`, `src/i18n/dict.test.ts`
- Modify: `src/main.tsx`

Kamus ID adalah source of truth; tipe `DictKey` diturunkan darinya, dan `en` bertipe `Record<DictKey, string>` sehingga key yang hilang/lebih jadi error compile. Test runtime tetap ada sebagai pengaman.

- [x] **Step 1: Tulis failing test**

`src/i18n/dict.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { dictionaries } from './dict';

describe('kelengkapan i18n', () => {
  it('ID dan EN punya set key identik', () => {
    const idKeys = Object.keys(dictionaries.id).sort();
    const enKeys = Object.keys(dictionaries.en).sort();
    expect(enKeys).toEqual(idKeys);
  });
  it('tidak ada string kosong', () => {
    for (const locale of ['id', 'en'] as const) {
      for (const [k, v] of Object.entries(dictionaries[locale])) {
        expect(v.trim(), `${locale}:${k}`).not.toBe('');
      }
    }
  });
});
```

- [x] **Step 2: Run test, pastikan gagal**

Run: `npm test`
Expected: FAIL — module `./dict` belum ada.

- [x] **Step 3: Tulis dictionary**

`src/i18n/dict.ts`:

```ts
export type Locale = 'id' | 'en';

const id = {
  'site.name': 'ihavenothingtodo',
  'site.tagline': 'tempat membuang waktu dengan terhormat',
  'a11y.mute': 'Matikan suara',
  'a11y.unmute': 'Nyalakan suara',
  'home.bored': 'aku gabut!',
  'home.bored.sub': 'lempar aku ke game acak',
  'home.daily.title': 'Tantangan hari ini',
  'home.daily.sub': '5 game, 5 nyawa, sekali jalan. Semua orang dapat urutan yang sama hari ini.',
  'home.daily.cta': 'Gas, mulai',
  'home.grid.title': 'Atau pilih sendiri',
  'home.footer': 'Tidak ada akun. Tidak ada simpanan. Kalau kalah ya ulang dari nol, hidup memang begitu.',
  'cat.reflex': 'Refleks',
  'cat.aim': 'Aim',
  'cat.memory': 'Memori',
  'cat.logic': 'Logika',
  'cat.word': 'Kata',
  'cat.math': 'Matematika',
  'cat.dexterity': 'Ketangkasan',
  'cat.rhythm': 'Ritme',
  'shell.pause': 'Jeda',
  'shell.resume': 'Lanjut',
  'shell.quit': 'Keluar',
  'shell.paused': 'Dijeda. Tarik napas dulu.',
  'shell.go': 'GAS!',
  'over.title': 'GAME OVER',
  'over.score': 'Skor',
  'over.combo': 'Combo terbaik',
  'over.level': 'Level tercapai',
  'over.time': 'Durasi',
  'over.sessionBest': 'Rekor sesi baru!',
  'over.playAgain': 'Main lagi',
  'over.otherGame': 'Game lain',
  'over.home': 'Beranda',
  'over.download': 'Unduh struk',
  'over.share': 'Bagikan',
  'daily.title': 'Daily Gauntlet',
  'daily.stage': 'Game {n} dari 5',
  'daily.next': 'Lanjut game berikutnya',
  'daily.livesLeft': 'Sisa nyawa',
  'daily.clear': 'GAUNTLET SELESAI!',
  'daily.fail': 'Nyawa habis…',
  'receipt.mode.free': 'MAIN BEBAS',
  'receipt.mode.daily': 'DAILY GAUNTLET',
  'receipt.total': 'TOTAL',
  'receipt.timeWasted': 'WAKTU TERBUANG',
  'receipt.thanks': 'TERIMA KASIH SUDAH GABUT DI SINI',
  'title.t0': 'Magang Gabut',
  'title.t1': 'Gabut Amatir',
  'title.t2': 'Gabut Profesional',
  'title.t3': 'Suhu Gabut',
  'title.t4': 'Dewa Gabut Internasional',
  'notfound.title': 'Halaman ini juga gabut',
  'notfound.body': 'Saking gabutnya, halaman ini tidak pernah dibuat.',
  'notfound.cta': 'Balik ke beranda',
} as const;

export type DictKey = keyof typeof id;

const en: Record<DictKey, string> = {
  'site.name': 'ihavenothingtodo',
  'site.tagline': 'a respectable place to waste time',
  'a11y.mute': 'Mute sound',
  'a11y.unmute': 'Unmute sound',
  'home.bored': "i'm bored!",
  'home.bored.sub': 'throw me into a random game',
  'home.daily.title': "Today's challenge",
  'home.daily.sub': '5 games, 5 lives, one run. Everyone gets the same lineup today.',
  'home.daily.cta': "Let's go",
  'home.grid.title': 'Or pick your poison',
  'home.footer': 'No accounts. No saves. Lose and you start over — such is life.',
  'cat.reflex': 'Reflex',
  'cat.aim': 'Aim',
  'cat.memory': 'Memory',
  'cat.logic': 'Logic',
  'cat.word': 'Words',
  'cat.math': 'Math',
  'cat.dexterity': 'Dexterity',
  'cat.rhythm': 'Rhythm',
  'shell.pause': 'Pause',
  'shell.resume': 'Resume',
  'shell.quit': 'Quit',
  'shell.paused': 'Paused. Take a breath.',
  'shell.go': 'GO!',
  'over.title': 'GAME OVER',
  'over.score': 'Score',
  'over.combo': 'Best combo',
  'over.level': 'Level reached',
  'over.time': 'Duration',
  'over.sessionBest': 'New session best!',
  'over.playAgain': 'Play again',
  'over.otherGame': 'Another game',
  'over.home': 'Home',
  'over.download': 'Download receipt',
  'over.share': 'Share',
  'daily.title': 'Daily Gauntlet',
  'daily.stage': 'Game {n} of 5',
  'daily.next': 'Next game',
  'daily.livesLeft': 'Lives left',
  'daily.clear': 'GAUNTLET CLEARED!',
  'daily.fail': 'Out of lives…',
  'receipt.mode.free': 'FREE PLAY',
  'receipt.mode.daily': 'DAILY GAUNTLET',
  'receipt.total': 'TOTAL',
  'receipt.timeWasted': 'TIME WASTED',
  'receipt.thanks': 'THANK YOU FOR WASTING TIME HERE',
  'title.t0': 'Boredom Intern',
  'title.t1': 'Casual Time Waster',
  'title.t2': 'Certified Time Waster',
  'title.t3': 'Boredom Master',
  'title.t4': 'Grandmaster of Nothing',
  'notfound.title': 'This page is bored too',
  'notfound.body': 'It was so bored it never got built.',
  'notfound.cta': 'Back home',
};

export const dictionaries: Record<Locale, Record<DictKey, string>> = { id, en };
```

- [x] **Step 4: Run test, pastikan lulus**

Run: `npm test`
Expected: PASS.

- [x] **Step 5: Tulis provider + hook**

`src/i18n/index.tsx`:

```tsx
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { dictionaries } from './dict';
import type { DictKey, Locale } from './dict';

const STORAGE_KEY = 'ihnttd.lang';

function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'id' || saved === 'en') return saved;
  } catch {
    /* localStorage tidak tersedia — pakai deteksi browser */
  }
  return navigator.language.toLowerCase().startsWith('id') ? 'id' : 'en';
}

interface I18nValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* abaikan */
    }
  }, []);

  const t = useCallback(
    (key: DictKey, vars?: Record<string, string | number>) => {
      let s: string = dictionaries[locale][key];
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
      return s;
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
```

Modify `src/main.tsx` — bungkus `<App />` dengan provider:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { I18nProvider } from './i18n';
import App from './App';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <App />
      </I18nProvider>
    </BrowserRouter>
  </StrictMode>,
);
```

- [x] **Step 6: Verifikasi build + test**

Run: `npm run build && npm test`
Expected: keduanya exit 0.

- [x] **Step 7: Commit**

```bash
git add src/i18n src/main.tsx
git commit -m "feat: i18n ID/EN dengan completeness test"
```

### Task 5: Kontrak game, canvas utils, registry

**Files:**
- Create: `src/games/types.ts`, `src/games/canvas.ts`, `src/games/registry.ts`

Registry dimulai dengan array kosong yang di-append oleh setiap task game (Task 11-18). `loadEngine` memakai dynamic import agar tiap game jadi chunk terpisah.

- [x] **Step 1: Tulis types**

`src/games/types.ts`:

```ts
import type { Locale } from '../i18n/dict';

export type GameId =
  | 'tap-panic'
  | 'bubble-sniper'
  | 'simon'
  | 'missing-number'
  | 'word-scramble'
  | 'quick-math'
  | 'dodge'
  | 'beat-tap';

export type Category =
  | 'reflex'
  | 'aim'
  | 'memory'
  | 'logic'
  | 'word'
  | 'math'
  | 'dexterity'
  | 'rhythm';

export type EndReason = 'lives' | 'timeup';

export interface GameResult {
  score: number;
  bestCombo: number;
  levelReached: number;
  durationMs: number;
  livesLeft: number;
  endReason: EndReason;
  stats: Record<string, number>;
}

export interface GameCallbacks {
  onScore(totalScore: number, combo: number): void;
  onLifeLost(): void;
  onGameOver(result: GameResult): void;
}

export interface GameOptions {
  seed: number;
  locale: Locale;
  startLives: number;
  roundMs?: number;
  callbacks: GameCallbacks;
}

export interface GameEngine {
  init(canvas: HTMLCanvasElement, opts: GameOptions): void;
  start(): void;
  pause(): void;
  resume(): void;
  destroy(): void;
}

export interface L10n {
  id: string;
  en: string;
}

export type IconKey =
  | 'zap'
  | 'target'
  | 'brain'
  | 'hash'
  | 'type'
  | 'calculator'
  | 'move'
  | 'music';

export type Accent = 'coral' | 'teal' | 'amber' | 'pink';

export interface GameMeta {
  id: GameId;
  category: Category;
  icon: IconKey;
  accent: Accent;
  name: L10n;
  tagline: L10n;
  howTo: L10n;
}
```

- [x] **Step 2: Tulis canvas utils**

`src/games/canvas.ts`:

```ts
export const ARCADE = {
  bg: '#14142B',
  bgSoft: '#22224A',
  pink: '#FF2E88',
  green: '#00E5A0',
  yellow: '#FFD23F',
  blue: '#4DA6FF',
  white: '#F4F2FF',
  dim: '#8A8AB8',
} as const;

export function setupCanvas(canvas: HTMLCanvasElement, w: number, h: number): CanvasRenderingContext2D {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

export function pointerPos(
  canvas: HTMLCanvasElement,
  e: PointerEvent,
  w: number,
  h: number,
): { x: number; y: number } {
  const r = canvas.getBoundingClientRect();
  return { x: ((e.clientX - r.left) * w) / r.width, y: ((e.clientY - r.top) * h) / r.height };
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function inRect(px: number, py: number, r: Rect): boolean {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

export function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  radius: number,
  fill: string,
  stroke?: string,
): void {
  ctx.beginPath();
  ctx.roundRect(r.x, r.y, r.w, r.h, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}

export function centerText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string,
  fill: string,
): void {
  ctx.font = font;
  ctx.fillStyle = fill;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}
```

- [x] **Step 3: Tulis registry (kosong dulu)**

`src/games/registry.ts`:

```ts
import type { GameEngine, GameId, GameMeta } from './types';

export const GAMES: GameMeta[] = [
  // Diisi satu entri per task game (Task 11-18), urutan: tap-panic, quick-math,
  // simon, missing-number, word-scramble, bubble-sniper, dodge, beat-tap.
];

const loaders: Partial<Record<GameId, () => Promise<GameEngine>>> = {
  // Diisi per task game, contoh:
  // 'tap-panic': () => import('./tap-panic/engine').then((m) => new m.TapPanicEngine()),
};

export function getMeta(id: string): GameMeta | undefined {
  return GAMES.find((g) => g.id === id);
}

export async function loadEngine(id: GameId): Promise<GameEngine> {
  const loader = loaders[id];
  if (!loader) throw new Error(`Unknown game: ${id}`);
  return loader();
}
```

- [x] **Step 4: Verifikasi typecheck**

Run: `npm run build`
Expected: exit 0.

- [x] **Step 5: Commit**

```bash
git add src/games
git commit -m "feat: kontrak GameEngine, canvas utils, registry"
```

---

## Fase 2 — Shell game

### Task 6: Sound system (WebAudio sintetis)

**Files:**
- Create: `src/core/sound.ts`
- Modify: `src/App.tsx`

Tidak ada file audio — semua SFX disintesis oscillator. AudioContext dibuat setelah gesture pertama (kebijakan autoplay browser). Mute dipersist di localStorage.

- [x] **Step 1: Implementasi**

`src/core/sound.ts`:

```ts
export type SfxName = 'tap' | 'good' | 'bad' | 'life' | 'over' | 'record' | 'coin' | 'tick';

const STORAGE_KEY = 'ihnttd.muted';

class Sfx {
  private ctx: AudioContext | null = null;
  private mutedFlag: boolean;

  constructor() {
    let saved = false;
    try {
      saved = localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      /* abaikan */
    }
    this.mutedFlag = saved;
  }

  get muted(): boolean {
    return this.mutedFlag;
  }

  unlock(): void {
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
  }

  toggleMute(): boolean {
    this.mutedFlag = !this.mutedFlag;
    try {
      localStorage.setItem(STORAGE_KEY, this.mutedFlag ? '1' : '0');
    } catch {
      /* abaikan */
    }
    return this.mutedFlag;
  }

  play(name: SfxName): void {
    if (this.mutedFlag || !this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    switch (name) {
      case 'tap':
        this.blip(880, 0.04, 'square', t);
        break;
      case 'tick':
        this.blip(660, 0.03, 'square', t, 0.04);
        break;
      case 'good':
        this.blip(660, 0.06, 'square', t);
        this.blip(990, 0.08, 'square', t + 0.06);
        break;
      case 'coin':
        this.blip(990, 0.05, 'square', t);
        this.blip(1320, 0.12, 'square', t + 0.05);
        break;
      case 'bad':
        this.blip(180, 0.15, 'sawtooth', t, 0.09);
        break;
      case 'life':
        this.blip(240, 0.1, 'sawtooth', t, 0.09);
        this.blip(120, 0.2, 'sawtooth', t + 0.1, 0.09);
        break;
      case 'over':
        this.blip(392, 0.14, 'square', t);
        this.blip(311, 0.14, 'square', t + 0.15);
        this.blip(233, 0.3, 'square', t + 0.3);
        break;
      case 'record':
        this.blip(523, 0.09, 'square', t);
        this.blip(659, 0.09, 'square', t + 0.09);
        this.blip(784, 0.09, 'square', t + 0.18);
        this.blip(1047, 0.2, 'square', t + 0.27);
        break;
    }
  }

  private blip(freq: number, dur: number, type: OscillatorType, when: number, gain = 0.06): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);
    g.gain.setValueAtTime(gain, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(g).connect(this.ctx.destination);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  }
}

export const sfx = new Sfx();
```

- [x] **Step 2: Unlock audio pada gesture pertama**

Modify `src/App.tsx` — tambahkan efek unlock:

```tsx
import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { sfx } from './core/sound';
import Home from './pages/Home';
import Play from './pages/Play';
import Daily from './pages/Daily';
import NotFound from './pages/NotFound';

export default function App() {
  useEffect(() => {
    const unlock = () => sfx.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/play/:gameId" element={<Play />} />
      <Route path="/daily" element={<Daily />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
```

- [x] **Step 3: Verifikasi + commit**

Run: `npm run build`
Expected: exit 0.

```bash
git add src/core/sound.ts src/App.tsx
git commit -m "feat: SFX WebAudio sintetis dengan mute persist"
```

### Task 7: Skor, combo, gelar

**Files:**
- Create: `src/core/score.ts`, `src/core/score.test.ts`

- [x] **Step 1: Tulis failing test**

`src/core/score.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { comboMultiplier, formatDuration, titleKeyFor } from './score';

describe('comboMultiplier', () => {
  it('naik tiap 5 combo, maksimum x5', () => {
    expect(comboMultiplier(0)).toBe(1);
    expect(comboMultiplier(4)).toBe(1);
    expect(comboMultiplier(5)).toBe(2);
    expect(comboMultiplier(9)).toBe(2);
    expect(comboMultiplier(10)).toBe(3);
    expect(comboMultiplier(15)).toBe(4);
    expect(comboMultiplier(20)).toBe(5);
    expect(comboMultiplier(999)).toBe(5);
  });
});

describe('titleKeyFor', () => {
  it('threshold tier benar', () => {
    expect(titleKeyFor(0)).toBe('title.t0');
    expect(titleKeyFor(499)).toBe('title.t0');
    expect(titleKeyFor(500)).toBe('title.t1');
    expect(titleKeyFor(1499)).toBe('title.t1');
    expect(titleKeyFor(1500)).toBe('title.t2');
    expect(titleKeyFor(3999)).toBe('title.t2');
    expect(titleKeyFor(4000)).toBe('title.t3');
    expect(titleKeyFor(8000)).toBe('title.t4');
  });
});

describe('formatDuration', () => {
  it('format m:ss', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(61_000)).toBe('1:01');
    expect(formatDuration(154_499)).toBe('2:34');
  });
});
```

- [x] **Step 2: Run test, pastikan gagal**

Run: `npm test`
Expected: FAIL — module `./score` belum ada.

- [x] **Step 3: Implementasi**

`src/core/score.ts`:

```ts
import type { DictKey } from '../i18n/dict';

export function comboMultiplier(combo: number): number {
  return 1 + Math.min(4, Math.floor(combo / 5));
}

const TIERS: Array<[number, DictKey]> = [
  [8000, 'title.t4'],
  [4000, 'title.t3'],
  [1500, 'title.t2'],
  [500, 'title.t1'],
  [0, 'title.t0'],
];

export function titleKeyFor(score: number): DictKey {
  for (const [min, key] of TIERS) if (score >= min) return key;
  return 'title.t0';
}

export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
```

- [x] **Step 4: Run test, pastikan lulus**

Run: `npm test`
Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add src/core/score.ts src/core/score.test.ts
git commit -m "feat: combo multiplier, tier gelar, format durasi"
```

### Task 8: BaseEngine

**Files:**
- Create: `src/games/base.ts`

Kelas dasar semua engine: game loop RAF dengan dt ter-clamp, akuntansi skor/combo/level, nyawa (mistakes vs startLives), batas waktu ronde (roundMs, untuk Daily Gauntlet), dan emisi GameResult. Engine turunan hanya mengimplementasikan `setup/update/draw/teardown`.

- [x] **Step 1: Implementasi**

`src/games/base.ts`:

```ts
import { mulberry32 } from '../core/rng';
import { comboMultiplier } from '../core/score';
import { setupCanvas } from './canvas';
import type { EndReason, GameEngine, GameOptions } from './types';

export abstract class BaseEngine implements GameEngine {
  protected canvas!: HTMLCanvasElement;
  protected ctx!: CanvasRenderingContext2D;
  protected opts!: GameOptions;
  protected rand: () => number = Math.random;
  protected readonly w = 480;
  protected readonly h = 720;
  protected score = 0;
  protected combo = 0;
  protected bestCombo = 0;
  protected level = 1;
  protected mistakes = 0;
  protected elapsed = 0;
  protected levelEvery = 8;
  private successes = 0;
  private raf = 0;
  private last = 0;
  private running = false;
  private finished = false;

  init(canvas: HTMLCanvasElement, opts: GameOptions): void {
    this.canvas = canvas;
    this.opts = opts;
    this.ctx = setupCanvas(canvas, this.w, this.h);
    this.rand = mulberry32(opts.seed);
    this.setup();
    this.draw();
  }

  start(): void {
    if (this.finished || this.running) return;
    this.running = true;
    this.last = performance.now();
    const tick = (now: number) => {
      if (!this.running) return;
      const dt = Math.min(50, now - this.last);
      this.last = now;
      this.elapsed += dt;
      if (this.opts.roundMs && this.elapsed >= this.opts.roundMs) {
        this.end('timeup');
        return;
      }
      this.update(dt);
      if (this.finished) return;
      this.draw();
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  pause(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  resume(): void {
    this.start();
  }

  destroy(): void {
    this.pause();
    this.finished = true;
    this.teardown();
  }

  protected get isRunning(): boolean {
    return this.running;
  }

  protected get isFinished(): boolean {
    return this.finished;
  }

  protected success(points: number): void {
    if (this.finished) return;
    this.combo += 1;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.score += points * comboMultiplier(this.combo);
    this.successes += 1;
    if (this.successes % this.levelEvery === 0) this.level += 1;
    this.opts.callbacks.onScore(this.score, this.combo);
  }

  protected resetCombo(): void {
    this.combo = 0;
    this.opts.callbacks.onScore(this.score, this.combo);
  }

  protected fail(): void {
    if (this.finished) return;
    this.combo = 0;
    this.mistakes += 1;
    this.opts.callbacks.onScore(this.score, this.combo);
    this.opts.callbacks.onLifeLost();
    if (this.mistakes >= this.opts.startLives) this.end('lives');
  }

  protected end(reason: EndReason): void {
    if (this.finished) return;
    this.finished = true;
    this.pause();
    this.opts.callbacks.onGameOver({
      score: this.score,
      bestCombo: this.bestCombo,
      levelReached: this.level,
      durationMs: Math.round(this.elapsed),
      livesLeft: Math.max(0, this.opts.startLives - this.mistakes),
      endReason: reason,
      stats: this.stats(),
    });
  }

  protected stats(): Record<string, number> {
    return {};
  }

  protected abstract setup(): void;
  protected abstract update(dt: number): void;
  protected abstract draw(): void;
  protected teardown(): void {}
}
```

- [x] **Step 2: Verifikasi typecheck + commit**

Run: `npm run build`
Expected: exit 0.

```bash
git add src/games/base.ts
git commit -m "feat: BaseEngine (loop, nyawa, skor, roundMs)"
```

### Task 9: Komponen UI dasar

**Files:**
- Create: `src/components/ChunkyButton.tsx`, `src/components/LivesBar.tsx`, `src/components/Mascot.tsx`, `src/components/Header.tsx`, `src/components/GameCard.tsx`

- [x] **Step 1: ChunkyButton**

`src/components/ChunkyButton.tsx`:

```tsx
import type { ButtonHTMLAttributes } from 'react';

type Color = 'coral' | 'teal' | 'amber' | 'pink' | 'ink';
type Size = 'md' | 'lg' | 'xl';

const COLORS: Record<Color, string> = {
  coral: 'bg-coral text-cream',
  teal: 'bg-teal text-cream',
  amber: 'bg-amber text-ink',
  pink: 'bg-pink text-cream',
  ink: 'bg-ink text-cream',
};

const SIZES: Record<Size, string> = {
  md: 'px-5 py-2.5 text-base rounded-xl',
  lg: 'px-7 py-3.5 text-xl rounded-2xl',
  xl: 'px-10 py-5 text-3xl rounded-3xl',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  color?: Color;
  size?: Size;
}

export function ChunkyButton({ color = 'coral', size = 'md', className = '', ...rest }: Props) {
  return (
    <button
      className={`font-display tracking-wide border-[3px] border-ink select-none
        shadow-[0_6px_0_0_var(--color-ink)] active:translate-y-[6px] active:shadow-none
        transition-[transform,box-shadow] duration-100 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${COLORS[color]} ${SIZES[size]} ${className}`}
      {...rest}
    />
  );
}
```

- [x] **Step 2: LivesBar**

`src/components/LivesBar.tsx`:

```tsx
import { Heart } from 'lucide-react';
import { motion } from 'motion/react';

export function LivesBar({ lives, max = 5 }: { lives: number; max?: number }) {
  return (
    <div className="flex gap-1.5" role="status" aria-label={`${lives}/${max}`}>
      {Array.from({ length: max }, (_, i) => {
        const alive = i < lives;
        return (
          <motion.span
            key={i}
            animate={alive ? { scale: 1, rotate: 0 } : { scale: 0.85, rotate: -14 }}
            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
          >
            <Heart
              size={22}
              strokeWidth={2.5}
              className={alive ? 'text-neon-pink' : 'text-navy-soft'}
              fill={alive ? 'currentColor' : 'none'}
            />
          </motion.span>
        );
      })}
    </div>
  );
}
```

- [x] **Step 3: Mascot**

`src/components/Mascot.tsx`:

```tsx
export type Expression = 'happy' | 'yawn' | 'sleep' | 'shock' | 'hype';

export function Mascot({ expression = 'happy', size = 120 }: { expression?: Expression; size?: number }) {
  const eyes = () => {
    switch (expression) {
      case 'sleep':
        return (
          <>
            <path d="M18 30 q4 3 8 0" className="stroke-ink" strokeWidth={3} fill="none" strokeLinecap="round" />
            <path d="M38 30 q4 3 8 0" className="stroke-ink" strokeWidth={3} fill="none" strokeLinecap="round" />
          </>
        );
      case 'shock':
        return (
          <>
            <circle cx={22} cy={30} r={6} className="fill-ink" />
            <circle cx={42} cy={30} r={6} className="fill-ink" />
            <circle cx={24} cy={28} r={2} fill="#FFF4E4" />
            <circle cx={44} cy={28} r={2} fill="#FFF4E4" />
          </>
        );
      case 'hype':
        return (
          <>
            <path d="M17 30 l5 -5 l5 5" className="stroke-ink" strokeWidth={3.5} fill="none" strokeLinecap="round" />
            <path d="M37 30 l5 -5 l5 5" className="stroke-ink" strokeWidth={3.5} fill="none" strokeLinecap="round" />
          </>
        );
      default:
        return (
          <>
            <circle cx={22} cy={30} r={4} className="fill-ink" />
            <circle cx={42} cy={30} r={4} className="fill-ink" />
          </>
        );
    }
  };

  const mouth = () => {
    switch (expression) {
      case 'yawn':
      case 'shock':
        return <ellipse cx={32} cy={43} rx={6} ry={8} className="fill-ink" />;
      case 'sleep':
        return <ellipse cx={32} cy={44} rx={4} ry={3} className="fill-ink" />;
      case 'hype':
        return <path d="M24 41 q8 9 16 0 z" className="fill-ink" />;
      default:
        return <path d="M25 42 q7 6 14 0" className="stroke-ink" strokeWidth={3} fill="none" strokeLinecap="round" />;
    }
  };

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path
        d="M32 5C15 5 5 19 5 34c0 17 13 25 27 25s27-8 27-25C59 19 49 5 32 5Z"
        className="fill-coral stroke-ink"
        strokeWidth={3}
      />
      {eyes()}
      {mouth()}
      {expression === 'sleep' && (
        <text x={50} y={14} className="fill-ink font-display" fontSize={11}>
          z z
        </text>
      )}
    </svg>
  );
}
```

- [x] **Step 4: Header**

`src/components/Header.tsx`:

```tsx
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
```

- [x] **Step 5: GameCard**

`src/components/GameCard.tsx`:

```tsx
import { Link } from 'react-router-dom';
import { Brain, Calculator, Hash, Move, Music, Target, Type, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useI18n } from '../i18n';
import type { GameMeta, IconKey } from '../games/types';

const ICONS: Record<IconKey, LucideIcon> = {
  zap: Zap,
  target: Target,
  brain: Brain,
  hash: Hash,
  type: Type,
  calculator: Calculator,
  move: Move,
  music: Music,
};

const ACCENTS: Record<GameMeta['accent'], string> = {
  coral: 'bg-coral text-cream',
  teal: 'bg-teal text-cream',
  amber: 'bg-amber text-ink',
  pink: 'bg-pink text-cream',
};

export function GameCard({ meta }: { meta: GameMeta }) {
  const { locale, t } = useI18n();
  const Icon = ICONS[meta.icon];
  const catKey = `cat.${meta.category}` as const;

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
      <Link
        to={`/play/${meta.id}`}
        className="block rounded-2xl border-[3px] border-ink bg-paper p-4
          shadow-[0_5px_0_0_var(--color-ink)] active:translate-y-[5px] active:shadow-none
          transition-[transform,box-shadow] duration-100"
      >
        <div className={`inline-flex rounded-xl border-[3px] border-ink p-2.5 ${ACCENTS[meta.accent]}`}>
          <Icon size={24} strokeWidth={2.5} />
        </div>
        <h3 className="font-display text-lg mt-3 leading-tight">{meta.name[locale]}</h3>
        <p className="text-xs font-bold uppercase tracking-wider text-ink-soft mt-0.5">{t(catKey)}</p>
        <p className="text-sm text-ink-soft mt-1.5 leading-snug">{meta.tagline[locale]}</p>
      </Link>
    </motion.div>
  );
}
```

- [x] **Step 6: Verifikasi + commit**

Run: `npm run build`
Expected: exit 0 (komponen belum dipakai halaman — cukup typecheck).

```bash
git add src/components
git commit -m "feat: komponen UI dasar (ChunkyButton, LivesBar, Mascot, Header, GameCard)"
```

### Task 10: GameShell + halaman Play

**Files:**
- Create: `src/shell/GameShell.tsx`
- Modify: `src/pages/Play.tsx`

GameShell = "mesin arcade": frame navy, canvas, HUD (nyawa, skor pixel-font, combo), countdown 3-2-1, pause (tombol + auto saat tab hidden), beforeunload saat run aktif. Hasil diteruskan ke `onFinish` — layar hasil diurus pemanggil (Task 11).

- [x] **Step 1: Implementasi GameShell**

`src/shell/GameShell.tsx`:

```tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play as PlayIcon, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useI18n } from '../i18n';
import { sfx } from '../core/sound';
import { comboMultiplier } from '../core/score';
import { loadEngine } from '../games/registry';
import type { GameEngine, GameId, GameResult } from '../games/types';
import { LivesBar } from '../components/LivesBar';
import { ChunkyButton } from '../components/ChunkyButton';

type Phase = 'loading' | 'countdown' | 'playing' | 'paused' | 'over';

export interface GameShellProps {
  gameId: GameId;
  seed: number;
  startLives: number;
  roundMs?: number;
  onFinish: (result: GameResult) => void;
  onQuit: () => void;
}

export function GameShell({ gameId, seed, startLives, roundMs, onFinish, onQuit }: GameShellProps) {
  const { locale, t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const phaseRef = useRef<Phase>('loading');
  const [phase, setPhaseState] = useState<Phase>('loading');
  const [lives, setLives] = useState(startLives);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [count, setCount] = useState(3);

  const setPhase = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
  }, []);

  useEffect(() => {
    let alive = true;
    let engine: GameEngine | null = null;
    const timers: ReturnType<typeof setTimeout>[] = [];

    void loadEngine(gameId).then(async (e) => {
      if (!alive || !canvasRef.current) return;
      engine = e;
      engineRef.current = e;
      e.init(canvasRef.current, {
        seed,
        locale,
        startLives,
        roundMs,
        callbacks: {
          onScore: (s, c) => {
            setScore(s);
            setCombo(c);
          },
          onLifeLost: () => {
            sfx.play('life');
            setLives((l) => Math.max(0, l - 1));
          },
          onGameOver: (result) => {
            sfx.play('over');
            setPhase('over');
            timers.push(setTimeout(() => onFinish(result), 700));
          },
        },
      });
      await document.fonts.ready;
      if (!alive) return;
      setPhase('countdown');
      for (let i = 3; i >= 1; i--) {
        timers.push(
          setTimeout(() => {
            setCount(i);
            sfx.play('tick');
          }, (3 - i) * 700),
        );
      }
      timers.push(
        setTimeout(() => {
          if (!alive || !engine) return;
          setPhase('playing');
          sfx.play('coin');
          engine.start();
        }, 2100),
      );
    });

    return () => {
      alive = false;
      timers.forEach(clearTimeout);
      engine?.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, seed]);

  useEffect(() => {
    const onHide = () => {
      if (document.hidden && phaseRef.current === 'playing') {
        engineRef.current?.pause();
        setPhase('paused');
      }
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (phaseRef.current === 'playing' || phaseRef.current === 'paused') e.preventDefault();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [setPhase]);

  const togglePause = () => {
    if (phase === 'playing') {
      engineRef.current?.pause();
      setPhase('paused');
    } else if (phase === 'paused') {
      engineRef.current?.resume();
      setPhase('playing');
    }
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 select-none">
      <div className="flex items-center justify-between py-3">
        <button onClick={onQuit} aria-label={t('shell.quit')} className="rounded-full border-[3px] border-ink bg-paper p-1.5 cursor-pointer">
          <X size={18} />
        </button>
        <LivesBar lives={lives} max={startLives} />
        <button
          onClick={togglePause}
          disabled={phase !== 'playing' && phase !== 'paused'}
          aria-label={phase === 'paused' ? t('shell.resume') : t('shell.pause')}
          className="rounded-full border-[3px] border-ink bg-paper p-1.5 cursor-pointer disabled:opacity-40"
        >
          {phase === 'paused' ? <PlayIcon size={18} /> : <Pause size={18} />}
        </button>
      </div>

      <div className="relative rounded-3xl border-[3px] border-ink bg-navy p-2 shadow-[0_8px_0_0_var(--color-ink)]">
        <div className="flex items-center justify-between px-3 py-2 font-pixel text-[11px] text-neon-yellow">
          <span>{score}</span>
          <span className={combo >= 5 ? 'text-neon-green' : 'text-navy-soft'}>x{comboMultiplier(combo)}</span>
        </div>
        <canvas ref={canvasRef} className="w-full rounded-2xl touch-none" style={{ aspectRatio: '2 / 3' }} />

        <AnimatePresence>
          {phase === 'countdown' && (
            <motion.div
              key={count}
              initial={{ scale: 2.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              className="absolute inset-0 grid place-items-center font-display text-7xl text-neon-yellow"
            >
              {count}
            </motion.div>
          )}
          {phase === 'paused' && (
            <div className="absolute inset-0 grid place-items-center rounded-3xl bg-navy/85">
              <div className="text-center">
                <p className="font-display text-cream text-xl mb-4">{t('shell.paused')}</p>
                <ChunkyButton color="teal" onClick={togglePause}>
                  {t('shell.resume')}
                </ChunkyButton>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
```

- [x] **Step 2: Halaman Play (sementara, tanpa GameOver — dilengkapi Task 11)**

`src/pages/Play.tsx`:

```tsx
import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { hashString } from '../core/rng';
import { getMeta } from '../games/registry';
import type { GameId, GameResult } from '../games/types';
import { GameShell } from '../shell/GameShell';
import { Header } from '../components/Header';

export default function Play() {
  const { gameId } = useParams();
  const nav = useNavigate();
  const [runId, setRunId] = useState(0);
  const [result, setResult] = useState<GameResult | null>(null);
  const meta = getMeta(gameId ?? '');
  const seed = useMemo(() => hashString(`free:${Date.now()}:${runId}`), [runId]);

  if (!meta) return <Navigate to="/" replace />;

  return (
    <div className="min-h-dvh flex flex-col">
      <Header />
      {result ? (
        <pre className="p-6 text-xs">{JSON.stringify(result, null, 2)}</pre>
      ) : (
        <GameShell
          key={runId}
          gameId={meta.id as GameId}
          seed={seed}
          startLives={5}
          onFinish={setResult}
          onQuit={() => nav('/')}
        />
      )}
      {result && (
        <button
          className="underline p-4"
          onClick={() => {
            setResult(null);
            setRunId((r) => r + 1);
          }}
        >
          play again (sementara)
        </button>
      )}
    </div>
  );
}
```

- [x] **Step 3: Verifikasi + commit**

Run: `npm run build`
Expected: exit 0. (`/play/apapun` belum bisa dimainkan karena registry kosong — normal sampai Task 12.)

```bash
git add src/shell/GameShell.tsx src/pages/Play.tsx
git commit -m "feat: GameShell (HUD, countdown, pause, beforeunload) + Play page"
```

### Task 11: Boredom Receipt + layar GameOver

**Files:**
- Create: `src/core/receipt.ts`, `src/core/receipt.test.ts`, `src/shell/GameOver.tsx`
- Modify: `src/pages/Play.tsx`

- [x] **Step 1: Tulis failing test untuk receiptLines**

`src/core/receipt.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { receiptLines } from './receipt';
import type { ReceiptData } from './receipt';

const data: ReceiptData = {
  mode: 'free',
  modeLabel: 'MAIN BEBAS',
  dateKey: '2026-07-09',
  entries: [{ name: 'Tap Panic', score: 1234 }],
  total: 1234,
  totalLabel: 'TOTAL',
  titleText: 'Gabut Profesional',
  timeWastedLabel: 'WAKTU TERBUANG',
  timeWastedText: '2:34',
  thanksText: 'TERIMA KASIH SUDAH GABUT DI SINI',
};

describe('receiptLines', () => {
  it('memuat header, entri, total, gelar, tanggal', () => {
    const lines = receiptLines(data);
    const joined = lines.join('\n');
    expect(joined).toContain('IHAVENOTHINGTODO');
    expect(joined).toContain('MAIN BEBAS');
    expect(joined).toContain('Tap Panic');
    expect(joined).toContain('1234');
    expect(joined).toContain('Gabut Profesional');
    expect(joined).toContain('2026-07-09');
    expect(joined).toContain('2:34');
  });
  it('semua baris <= 32 karakter', () => {
    for (const line of receiptLines(data)) expect(line.length).toBeLessThanOrEqual(32);
  });
  it('mode daily memuat semua entri', () => {
    const daily: ReceiptData = {
      ...data,
      mode: 'daily',
      modeLabel: 'DAILY GAUNTLET',
      entries: [
        { name: 'Tap Panic', score: 100 },
        { name: 'Simon', score: 200 },
      ],
      total: 300,
    };
    const joined = receiptLines(daily).join('\n');
    expect(joined).toContain('Simon');
    expect(joined).toContain('300');
  });
});
```

- [x] **Step 2: Run test, pastikan gagal**

Run: `npm test`
Expected: FAIL — module `./receipt` belum ada.

- [x] **Step 3: Implementasi receipt**

`src/core/receipt.ts`:

```ts
import { hashString, mulberry32 } from './rng';

export interface ReceiptEntry {
  name: string;
  score: number;
}

export interface ReceiptData {
  mode: 'free' | 'daily';
  modeLabel: string;
  dateKey: string;
  entries: ReceiptEntry[];
  total: number;
  totalLabel: string;
  titleText: string;
  timeWastedLabel: string;
  timeWastedText: string;
  thanksText: string;
}

const W = 32;
const DASH = '-'.repeat(W);

function padRow(left: string, right: string): string {
  const maxLeft = W - right.length - 1;
  const l = left.length > maxLeft ? left.slice(0, maxLeft - 1) + '…' : left;
  return l + ' '.repeat(W - l.length - right.length) + right;
}

function center(s: string): string {
  const t = s.length > W ? s.slice(0, W) : s;
  const pad = Math.floor((W - t.length) / 2);
  return ' '.repeat(pad) + t;
}

export function receiptLines(data: ReceiptData): string[] {
  const lines: string[] = [];
  lines.push(center('IHAVENOTHINGTODO'));
  lines.push(center('* boredom receipt *'));
  lines.push(DASH);
  lines.push(center(data.modeLabel));
  lines.push(center(data.dateKey));
  lines.push(DASH);
  for (const e of data.entries) lines.push(padRow(e.name, String(e.score)));
  lines.push(DASH);
  lines.push(padRow(data.totalLabel, String(data.total)));
  lines.push(padRow(data.timeWastedLabel, data.timeWastedText));
  lines.push(DASH);
  lines.push(center('>> ' + data.titleText + ' <<'));
  lines.push(DASH);
  lines.push(center(data.thanksText.slice(0, W)));
  return lines;
}

export function renderReceiptPng(lines: string[], seedText: string): string {
  const scale = 2;
  const lineH = 22;
  const padY = 28;
  const barcodeH = 34;
  const w = 340;
  const h = padY * 2 + lines.length * lineH + barcodeH + 16;
  const canvas = document.createElement('canvas');
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);
  ctx.fillStyle = '#FFF9F0';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#26201A';
  ctx.font = '700 14px "Courier New", monospace';
  ctx.textBaseline = 'top';
  lines.forEach((line, i) => {
    ctx.fillText(line, 24, padY + i * lineH);
  });
  const rand = mulberry32(hashString(seedText));
  let x = 40;
  const yBar = padY + lines.length * lineH + 8;
  while (x < w - 40) {
    const bw = 1 + Math.floor(rand() * 4);
    if (rand() > 0.4) ctx.fillRect(x, yBar, bw, barcodeH);
    x += bw + 2;
  }
  return canvas.toDataURL('image/png');
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export async function shareReceipt(dataUrl: string, filename: string, text: string): Promise<boolean> {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], filename, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text });
      return true;
    }
  } catch {
    /* dibatalkan user atau tidak didukung */
  }
  return false;
}
```

Catatan: `receiptLines` pure (bisa dites di node); `renderReceiptPng`/`downloadDataUrl`/`shareReceipt` menyentuh DOM dan hanya dipakai dari komponen.

- [x] **Step 4: Run test, pastikan lulus**

Run: `npm test`
Expected: PASS.

- [x] **Step 5: Layar GameOver**

`src/shell/GameOver.tsx`:

```tsx
import { useMemo, useState } from 'react';
import { Download, Share2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useI18n } from '../i18n';
import { formatDuration, titleKeyFor } from '../core/score';
import { downloadDataUrl, receiptLines, renderReceiptPng, shareReceipt } from '../core/receipt';
import type { ReceiptEntry } from '../core/receipt';
import { ChunkyButton } from '../components/ChunkyButton';

export interface GameOverProps {
  mode: 'free' | 'daily';
  heading: string;
  entries: ReceiptEntry[];
  totalScore: number;
  bestCombo: number;
  levelReached: number;
  durationMs: number;
  dateKey: string;
  sessionBest: boolean;
  primaryLabel: string;
  onPrimary: () => void;
  onHome: () => void;
}

export function GameOver(props: GameOverProps) {
  const { t } = useI18n();
  const [shared, setShared] = useState(false);

  const dataUrl = useMemo(() => {
    const lines = receiptLines({
      mode: props.mode,
      modeLabel: t(props.mode === 'daily' ? 'receipt.mode.daily' : 'receipt.mode.free'),
      dateKey: props.dateKey,
      entries: props.entries,
      total: props.totalScore,
      totalLabel: t('receipt.total'),
      titleText: t(titleKeyFor(props.totalScore)),
      timeWastedLabel: t('receipt.timeWasted'),
      timeWastedText: formatDuration(props.durationMs),
      thanksText: t('receipt.thanks'),
    });
    return renderReceiptPng(lines, `${props.dateKey}:${props.totalScore}`);
  }, [props, t]);

  const filename = `boredom-receipt-${props.dateKey}.png`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto w-full max-w-md px-4 pb-10 text-center"
    >
      <h2 className="font-display text-4xl mt-2">{props.heading}</h2>
      {props.sessionBest && (
        <p className="font-display text-teal text-lg mt-1">{t('over.sessionBest')}</p>
      )}
      <p className="font-pixel text-3xl text-coral mt-4">{props.totalScore}</p>
      <div className="grid grid-cols-3 gap-2 mt-5 text-sm">
        {(
          [
            [t('over.combo'), `x${props.bestCombo}`],
            [t('over.level'), String(props.levelReached)],
            [t('over.time'), formatDuration(props.durationMs)],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="rounded-xl border-[3px] border-ink bg-paper py-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">{label}</p>
            <p className="font-display text-lg">{value}</p>
          </div>
        ))}
      </div>
      <motion.img
        src={dataUrl}
        alt="Boredom Receipt"
        initial={{ rotate: -2 }}
        animate={{ rotate: 2 }}
        transition={{ repeat: Infinity, repeatType: 'reverse', duration: 2.2 }}
        className="mx-auto mt-6 w-56 border-[3px] border-ink shadow-[0_6px_0_0_var(--color-ink)]"
      />
      <div className="flex flex-wrap justify-center gap-3 mt-6">
        <ChunkyButton color="amber" onClick={() => downloadDataUrl(dataUrl, filename)}>
          <span className="inline-flex items-center gap-2">
            <Download size={18} /> {t('over.download')}
          </span>
        </ChunkyButton>
        <ChunkyButton
          color="pink"
          onClick={() => void shareReceipt(dataUrl, filename, 'ihavenothingtodo').then(setShared)}
        >
          <span className="inline-flex items-center gap-2">
            <Share2 size={18} /> {shared ? '✓' : t('over.share')}
          </span>
        </ChunkyButton>
      </div>
      <div className="flex flex-wrap justify-center gap-3 mt-3">
        <ChunkyButton color="coral" size="lg" onClick={props.onPrimary}>
          {props.primaryLabel}
        </ChunkyButton>
        <ChunkyButton color="ink" onClick={props.onHome}>
          {t('over.home')}
        </ChunkyButton>
      </div>
    </motion.div>
  );
}
```

- [x] **Step 6: Integrasikan ke Play**

Ganti `src/pages/Play.tsx`:

```tsx
import { useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { hashString } from '../core/rng';
import { todayKey } from '../core/daily';
import { sfx } from '../core/sound';
import { getMeta } from '../games/registry';
import type { GameId, GameResult } from '../games/types';
import { GameShell } from '../shell/GameShell';
import { GameOver } from '../shell/GameOver';
import { Header } from '../components/Header';
import { useI18n } from '../i18n';

const sessionBests = new Map<string, number>();

export default function Play() {
  const { gameId } = useParams();
  const nav = useNavigate();
  const { locale, t } = useI18n();
  const [runId, setRunId] = useState(0);
  const [result, setResult] = useState<GameResult | null>(null);
  const isBest = useRef(false);
  const meta = getMeta(gameId ?? '');
  const seed = useMemo(() => hashString(`free:${Date.now()}:${runId}`), [runId]);

  if (!meta) return <Navigate to="/" replace />;

  const onFinish = (r: GameResult) => {
    const prev = sessionBests.get(meta.id) ?? 0;
    isBest.current = r.score > prev && prev > 0;
    if (r.score > prev) sessionBests.set(meta.id, r.score);
    if (isBest.current) sfx.play('record');
    setResult(r);
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <Header />
      {result ? (
        <GameOver
          mode="free"
          heading={t('over.title')}
          entries={[{ name: meta.name[locale], score: result.score }]}
          totalScore={result.score}
          bestCombo={result.bestCombo}
          levelReached={result.levelReached}
          durationMs={result.durationMs}
          dateKey={todayKey()}
          sessionBest={isBest.current}
          primaryLabel={t('over.playAgain')}
          onPrimary={() => {
            setResult(null);
            setRunId((r) => r + 1);
          }}
          onHome={() => nav('/')}
        />
      ) : (
        <GameShell
          key={runId}
          gameId={meta.id as GameId}
          seed={seed}
          startLives={5}
          onFinish={onFinish}
          onQuit={() => nav('/')}
        />
      )}
    </div>
  );
}
```

Catatan: `todayKey` dari `src/core/daily.ts` belum ada — buat file minimal sekarang (fungsi lain menyusul di Task 21):

`src/core/daily.ts`:

```ts
export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
```

- [x] **Step 7: Verifikasi + commit**

Run: `npm run build && npm test`
Expected: keduanya exit 0.

```bash
git add src/core/receipt.ts src/core/receipt.test.ts src/core/daily.ts src/shell/GameOver.tsx src/pages/Play.tsx
git commit -m "feat: Boredom Receipt (PNG) + layar GameOver"
```

---

## Fase 3 — Game gelombang 1

Pola seragam tiap task game: (1) test logika murni gagal → (2) implement `logic.ts` → (3) test lulus → (4) implement `engine.ts` → (5) daftarkan di registry → (6) playtest manual → (7) commit. Engine mengimpor `sfx` langsung untuk bunyi per-aksi; shell sudah menangani bunyi nyawa/game-over.

### Task 12: Tap Panic (refleks)

**Files:**
- Create: `src/games/tap-panic/logic.ts`, `src/games/tap-panic/logic.test.ts`, `src/games/tap-panic/engine.ts`
- Modify: `src/games/registry.ts`

- [ ] **Step 1: Failing test**

`src/games/tap-panic/logic.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { decoyChance, spawnInterval, targetPoints, targetTtl } from './logic';

describe('kurva kesulitan tap-panic', () => {
  it('interval spawn menurun dengan floor 450', () => {
    expect(spawnInterval(1)).toBe(1100);
    expect(spawnInterval(2)).toBeLessThan(spawnInterval(1));
    expect(spawnInterval(99)).toBe(450);
  });
  it('umur target menurun dengan floor 650', () => {
    expect(targetTtl(1)).toBe(1600);
    expect(targetTtl(99)).toBe(650);
  });
  it('decoy muncul mulai level 4', () => {
    expect(decoyChance(1)).toBe(0);
    expect(decoyChance(3)).toBe(0);
    expect(decoyChance(4)).toBeCloseTo(0.18);
  });
  it('poin lebih besar jika tap lebih cepat', () => {
    expect(targetPoints(1)).toBe(50);
    expect(targetPoints(0)).toBe(20);
    expect(targetPoints(0.5)).toBe(35);
  });
});
```

- [ ] **Step 2: Run test — FAIL** (`npm test`, module `./logic` belum ada)

- [ ] **Step 3: Implementasi logic**

`src/games/tap-panic/logic.ts`:

```ts
export interface TapTarget {
  x: number;
  y: number;
  age: number;
  ttl: number;
  r0: number;
  decoy: boolean;
}

export function spawnInterval(level: number): number {
  return Math.max(450, 1100 - (level - 1) * 60);
}

export function targetTtl(level: number): number {
  return Math.max(650, 1600 - (level - 1) * 90);
}

export function decoyChance(level: number): number {
  return level >= 4 ? 0.18 : 0;
}

export function targetPoints(remaining: number): number {
  return 20 + Math.round(30 * remaining);
}
```

- [ ] **Step 4: Run test — PASS** (`npm test`)

- [ ] **Step 5: Implementasi engine**

`src/games/tap-panic/engine.ts`:

```ts
import { BaseEngine } from '../base';
import { ARCADE, pointerPos } from '../canvas';
import { sfx } from '../../core/sound';
import { decoyChance, spawnInterval, targetPoints, targetTtl } from './logic';
import type { TapTarget } from './logic';

export class TapPanicEngine extends BaseEngine {
  private targets: TapTarget[] = [];
  private spawnTimer = 0;
  private onPointer = (e: PointerEvent) => {
    if (!this.isRunning) return;
    const { x, y } = pointerPos(this.canvas, e, this.w, this.h);
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      const remaining = 1 - t.age / t.ttl;
      const r = t.r0 * (0.35 + 0.65 * remaining);
      if ((x - t.x) ** 2 + (y - t.y) ** 2 <= (r + 6) ** 2) {
        this.targets.splice(i, 1);
        if (t.decoy) {
          sfx.play('bad');
          this.fail();
        } else {
          sfx.play('good');
          this.success(targetPoints(remaining));
        }
        return;
      }
    }
  };

  protected setup(): void {
    this.canvas.addEventListener('pointerdown', this.onPointer);
  }

  protected teardown(): void {
    this.canvas.removeEventListener('pointerdown', this.onPointer);
  }

  protected update(dt: number): void {
    this.spawnTimer += dt;
    if (this.spawnTimer >= spawnInterval(this.level)) {
      this.spawnTimer = 0;
      this.targets.push({
        x: 60 + this.rand() * (this.w - 120),
        y: 80 + this.rand() * (this.h - 160),
        age: 0,
        ttl: targetTtl(this.level),
        r0: 42,
        decoy: this.rand() < decoyChance(this.level),
      });
    }
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      t.age += dt;
      if (t.age >= t.ttl) {
        this.targets.splice(i, 1);
        if (!t.decoy) {
          sfx.play('bad');
          this.fail();
          if (this.isFinished) return;
        }
      }
    }
  }

  protected draw(): void {
    const c = this.ctx;
    c.fillStyle = ARCADE.bg;
    c.fillRect(0, 0, this.w, this.h);
    for (const t of this.targets) {
      const remaining = 1 - t.age / t.ttl;
      const r = t.r0 * (0.35 + 0.65 * remaining);
      c.beginPath();
      c.arc(t.x, t.y, r, 0, Math.PI * 2);
      c.fillStyle = ARCADE.bgSoft;
      c.fill();
      c.lineWidth = 4;
      c.strokeStyle = t.decoy ? ARCADE.pink : ARCADE.green;
      c.stroke();
      if (t.decoy) {
        c.strokeStyle = ARCADE.pink;
        c.lineWidth = 3;
        const k = r * 0.4;
        c.beginPath();
        c.moveTo(t.x - k, t.y - k);
        c.lineTo(t.x + k, t.y + k);
        c.moveTo(t.x + k, t.y - k);
        c.lineTo(t.x - k, t.y + k);
        c.stroke();
      } else {
        c.beginPath();
        c.arc(t.x, t.y, Math.max(2, r * remaining * 0.5), 0, Math.PI * 2);
        c.fillStyle = ARCADE.green;
        c.fill();
      }
    }
  }
}
```

- [ ] **Step 6: Daftarkan di registry**

Di `src/games/registry.ts`, tambahkan ke array `GAMES`:

```ts
  {
    id: 'tap-panic',
    category: 'reflex',
    icon: 'zap',
    accent: 'coral',
    name: { id: 'Tap Panic', en: 'Tap Panic' },
    tagline: { id: 'Tap sebelum lingkarannya kabur.', en: 'Tap before the circle vanishes.' },
    howTo: {
      id: 'Tap target hijau secepatnya. Jangan sentuh yang pink!',
      en: 'Tap green targets fast. Never touch the pink ones!',
    },
  },
```

dan ke object `loaders`:

```ts
  'tap-panic': () => import('./tap-panic/engine').then((m) => new m.TapPanicEngine()),
```

- [ ] **Step 7: Playtest manual**

Run: `npm run dev`, buka `/play/tap-panic`. Checklist: countdown jalan → target muncul & mengecil → tap menambah skor → target lolos mengurangi hati → 5 kali lolos = game over → layar GameOver tampil + receipt bisa diunduh → "Main lagi" mengulang dari nol.

- [ ] **Step 8: Commit**

```bash
git add src/games/tap-panic src/games/registry.ts
git commit -m "feat: game Tap Panic (refleks)"
```

### Task 13: Hitung Kilat (matematika)

**Files:**
- Create: `src/games/quick-math/logic.ts`, `src/games/quick-math/logic.test.ts`, `src/games/quick-math/engine.ts`
- Modify: `src/games/registry.ts`

- [ ] **Step 1: Failing test**

`src/games/quick-math/logic.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../core/rng';
import { makeQuestion, questionTimeMs } from './logic';

describe('quick-math', () => {
  it('flag truth konsisten dengan aritmetika sebenarnya', () => {
    const rand = mulberry32(11);
    for (let i = 0; i < 300; i++) {
      const q = makeQuestion(rand, 1 + (i % 8));
      const real = q.op === '+' ? q.a + q.b : q.op === '-' ? q.a - q.b : q.a * q.b;
      expect(q.truth).toBe(q.shown === real);
    }
  });
  it('pengurangan tidak pernah negatif', () => {
    const rand = mulberry32(12);
    for (let i = 0; i < 300; i++) {
      const q = makeQuestion(rand, 5);
      if (q.op === '-') expect(q.a - q.b).toBeGreaterThanOrEqual(0);
    }
  });
  it('level rendah hanya penjumlahan', () => {
    const rand = mulberry32(13);
    for (let i = 0; i < 100; i++) expect(makeQuestion(rand, 1).op).toBe('+');
  });
  it('waktu per soal menurun dengan floor 1800', () => {
    expect(questionTimeMs(1)).toBe(5000);
    expect(questionTimeMs(2)).toBeLessThan(5000);
    expect(questionTimeMs(99)).toBe(1800);
  });
});
```

- [ ] **Step 2: Run test — FAIL** (`npm test`)

- [ ] **Step 3: Implementasi logic**

`src/games/quick-math/logic.ts`:

```ts
import { pick, randInt } from '../../core/rng';

export type Op = '+' | '-' | '×';

export interface MathQ {
  a: number;
  b: number;
  op: Op;
  shown: number;
  truth: boolean;
}

export function questionTimeMs(level: number): number {
  return Math.max(1800, 5000 - (level - 1) * 320);
}

export function makeQuestion(rand: () => number, level: number): MathQ {
  const ops: Op[] = level < 2 ? ['+'] : level < 4 ? ['+', '-'] : ['+', '-', '×'];
  const op = pick(rand, ops);
  const max = op === '×' ? Math.min(12, 4 + level) : Math.min(60, 8 + level * 5);
  let a = randInt(rand, 1, max);
  let b = randInt(rand, 1, max);
  if (op === '-' && b > a) [a, b] = [b, a];
  const real = op === '+' ? a + b : op === '-' ? a - b : a * b;
  const truth = rand() < 0.5;
  let shown = real;
  if (!truth) {
    shown = real + randInt(rand, 1, 3) * (rand() < 0.5 ? -1 : 1);
    if (shown === real) shown = real + 1;
  }
  return { a, b, op, shown, truth };
}
```

- [ ] **Step 4: Run test — PASS** (`npm test`)

- [ ] **Step 5: Implementasi engine**

`src/games/quick-math/engine.ts`:

```ts
import { BaseEngine } from '../base';
import { ARCADE, centerText, drawRoundRect, inRect, pointerPos } from '../canvas';
import type { Rect } from '../canvas';
import { sfx } from '../../core/sound';
import { makeQuestion, questionTimeMs } from './logic';
import type { MathQ } from './logic';

export class QuickMathEngine extends BaseEngine {
  private q!: MathQ;
  private timeLeft = 0;
  private falseBtn: Rect = { x: 30, y: 560, w: 195, h: 110 };
  private trueBtn: Rect = { x: 255, y: 560, w: 195, h: 110 };

  private onPointer = (e: PointerEvent) => {
    if (!this.isRunning) return;
    const { x, y } = pointerPos(this.canvas, e, this.w, this.h);
    if (inRect(x, y, this.trueBtn)) this.answer(true);
    else if (inRect(x, y, this.falseBtn)) this.answer(false);
  };

  private onKey = (e: KeyboardEvent) => {
    if (!this.isRunning) return;
    if (e.key === 'ArrowRight') this.answer(true);
    if (e.key === 'ArrowLeft') this.answer(false);
  };

  protected setup(): void {
    this.q = makeQuestion(this.rand, this.level);
    this.timeLeft = questionTimeMs(this.level);
    this.canvas.addEventListener('pointerdown', this.onPointer);
    window.addEventListener('keydown', this.onKey);
  }

  protected teardown(): void {
    this.canvas.removeEventListener('pointerdown', this.onPointer);
    window.removeEventListener('keydown', this.onKey);
  }

  private answer(v: boolean): void {
    if (v === this.q.truth) {
      sfx.play('good');
      this.success(15 + Math.ceil(this.timeLeft / 250));
    } else {
      sfx.play('bad');
      this.fail();
      if (this.isFinished) return;
    }
    this.next();
  }

  private next(): void {
    this.q = makeQuestion(this.rand, this.level);
    this.timeLeft = questionTimeMs(this.level);
  }

  protected update(dt: number): void {
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      sfx.play('bad');
      this.fail();
      if (this.isFinished) return;
      this.next();
    }
  }

  protected draw(): void {
    const c = this.ctx;
    const labels = this.opts.locale === 'id' ? ['SALAH', 'BENAR'] : ['FALSE', 'TRUE'];
    c.fillStyle = ARCADE.bg;
    c.fillRect(0, 0, this.w, this.h);
    const frac = Math.max(0, this.timeLeft / questionTimeMs(this.level));
    drawRoundRect(c, { x: 40, y: 60, w: 400, h: 14 }, 7, ARCADE.bgSoft);
    drawRoundRect(c, { x: 40, y: 60, w: 400 * frac, h: 14 }, 7, frac < 0.3 ? ARCADE.pink : ARCADE.yellow);
    centerText(c, `${this.q.a} ${this.q.op} ${this.q.b}`, this.w / 2, 280, '64px "Press Start 2P", monospace', ARCADE.white);
    centerText(c, `= ${this.q.shown}`, this.w / 2, 380, '54px "Press Start 2P", monospace', ARCADE.blue);
    drawRoundRect(c, this.falseBtn, 18, ARCADE.bgSoft, ARCADE.pink);
    drawRoundRect(c, this.trueBtn, 18, ARCADE.bgSoft, ARCADE.green);
    centerText(c, labels[0], this.falseBtn.x + this.falseBtn.w / 2, this.falseBtn.y + 55, '20px "Press Start 2P", monospace', ARCADE.pink);
    centerText(c, labels[1], this.trueBtn.x + this.trueBtn.w / 2, this.trueBtn.y + 55, '20px "Press Start 2P", monospace', ARCADE.green);
  }
}
```

- [ ] **Step 6: Daftarkan di registry**

Entri `GAMES`:

```ts
  {
    id: 'quick-math',
    category: 'math',
    icon: 'calculator',
    accent: 'teal',
    name: { id: 'Hitung Kilat', en: 'Flash Math' },
    tagline: { id: 'Benar atau salah? Mikir cepat!', en: 'True or false? Think fast!' },
    howTo: {
      id: 'Persamaan benar → tombol hijau (→). Salah → tombol pink (←). Waktumu makin tipis.',
      en: 'Equation right → green button (→). Wrong → pink button (←). Time keeps shrinking.',
    },
  },
```

Loader:

```ts
  'quick-math': () => import('./quick-math/engine').then((m) => new m.QuickMathEngine()),
```

- [ ] **Step 7: Playtest** — `/play/quick-math`: soal tampil, timer bar menyusut, jawaban benar/salah bereaksi, panah kiri/kanan bekerja.

- [ ] **Step 8: Commit**

```bash
git add src/games/quick-math src/games/registry.ts
git commit -m "feat: game Hitung Kilat (matematika)"
```

### Task 14: Simon Gabut (memori)

**Files:**
- Create: `src/games/simon/logic.ts`, `src/games/simon/logic.test.ts`, `src/games/simon/engine.ts`
- Modify: `src/games/registry.ts`

- [ ] **Step 1: Failing test**

`src/games/simon/logic.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../core/rng';
import { extendSequence, playbackMs } from './logic';

describe('simon', () => {
  it('extend menambah tepat satu pad 0-3 tanpa mengubah prefix', () => {
    const rand = mulberry32(4);
    let seq: number[] = [];
    for (let i = 0; i < 30; i++) {
      const next = extendSequence(seq, rand);
      expect(next.length).toBe(seq.length + 1);
      expect(next.slice(0, seq.length)).toEqual(seq);
      expect(next[next.length - 1]).toBeGreaterThanOrEqual(0);
      expect(next[next.length - 1]).toBeLessThanOrEqual(3);
      seq = next;
    }
  });
  it('tempo playback menurun dengan floor 260', () => {
    expect(playbackMs(1)).toBe(650);
    expect(playbackMs(5)).toBeLessThan(650);
    expect(playbackMs(99)).toBe(260);
  });
});
```

- [ ] **Step 2: Run test — FAIL** (`npm test`)

- [ ] **Step 3: Implementasi logic**

`src/games/simon/logic.ts`:

```ts
export function extendSequence(seq: readonly number[], rand: () => number): number[] {
  return [...seq, Math.floor(rand() * 4)];
}

export function playbackMs(round: number): number {
  return Math.max(260, Math.round(650 * Math.pow(0.96, round - 1)));
}
```

- [ ] **Step 4: Run test — PASS** (`npm test`)

- [ ] **Step 5: Implementasi engine**

`src/games/simon/engine.ts`:

```ts
import { BaseEngine } from '../base';
import { ARCADE, centerText, drawRoundRect, inRect, pointerPos } from '../canvas';
import type { Rect } from '../canvas';
import { sfx } from '../../core/sound';
import { extendSequence, playbackMs } from './logic';

const PAD_COLORS = [ARCADE.green, ARCADE.pink, ARCADE.yellow, ARCADE.blue];

type SimonState = 'show' | 'input' | 'gap';

export class SimonEngine extends BaseEngine {
  private seq: number[] = [];
  private state: SimonState = 'gap';
  private showIdx = 0;
  private inputIdx = 0;
  private stepTimer = 0;
  private litPad = -1;
  private pads: Rect[] = [];

  private onPointer = (e: PointerEvent) => {
    if (!this.isRunning || this.state !== 'input') return;
    const { x, y } = pointerPos(this.canvas, e, this.w, this.h);
    const i = this.pads.findIndex((p) => inRect(x, y, p));
    if (i >= 0) this.press(i);
  };

  private onKey = (e: KeyboardEvent) => {
    if (!this.isRunning || this.state !== 'input') return;
    const i = ['1', '2', '3', '4'].indexOf(e.key);
    if (i >= 0) this.press(i);
  };

  protected setup(): void {
    this.levelEvery = 3;
    const s = 190;
    const gap = 26;
    const x0 = (this.w - s * 2 - gap) / 2;
    const y0 = 160;
    this.pads = [
      { x: x0, y: y0, w: s, h: s },
      { x: x0 + s + gap, y: y0, w: s, h: s },
      { x: x0, y: y0 + s + gap, w: s, h: s },
      { x: x0 + s + gap, y: y0 + s + gap, w: s, h: s },
    ];
    this.seq = extendSequence([], this.rand);
    this.state = 'gap';
    this.stepTimer = 600;
    this.canvas.addEventListener('pointerdown', this.onPointer);
    window.addEventListener('keydown', this.onKey);
  }

  protected teardown(): void {
    this.canvas.removeEventListener('pointerdown', this.onPointer);
    window.removeEventListener('keydown', this.onKey);
  }

  private press(i: number): void {
    this.litPad = i;
    this.stepTimer = 180;
    if (i === this.seq[this.inputIdx]) {
      sfx.play('tap');
      this.inputIdx += 1;
      if (this.inputIdx >= this.seq.length) {
        sfx.play('good');
        this.success(this.seq.length * 30);
        this.seq = extendSequence(this.seq, this.rand);
        this.state = 'gap';
        this.stepTimer = 700;
      }
    } else {
      sfx.play('bad');
      this.fail();
      if (this.isFinished) return;
      this.state = 'gap';
      this.stepTimer = 900;
    }
  }

  protected update(dt: number): void {
    this.stepTimer -= dt;
    if (this.stepTimer > 0) return;
    if (this.state === 'gap') {
      this.state = 'show';
      this.showIdx = 0;
      this.litPad = this.seq[0];
      this.stepTimer = playbackMs(this.seq.length);
    } else if (this.state === 'show') {
      this.showIdx += 1;
      if (this.showIdx >= this.seq.length) {
        this.state = 'input';
        this.inputIdx = 0;
        this.litPad = -1;
      } else {
        this.litPad = this.seq[this.showIdx];
        this.stepTimer = playbackMs(this.seq.length);
      }
    } else {
      this.litPad = -1;
    }
  }

  protected draw(): void {
    const c = this.ctx;
    c.fillStyle = ARCADE.bg;
    c.fillRect(0, 0, this.w, this.h);
    centerText(c, `R${this.seq.length}`, this.w / 2, 90, '28px "Press Start 2P", monospace', ARCADE.white);
    this.pads.forEach((p, i) => {
      const lit = this.litPad === i && (this.state === 'show' || this.stepTimer > 0);
      c.globalAlpha = lit ? 1 : 0.35;
      drawRoundRect(c, p, 24, PAD_COLORS[i]);
      c.globalAlpha = 1;
    });
    if (this.state === 'input') {
      centerText(c, `${this.inputIdx}/${this.seq.length}`, this.w / 2, 640, '16px "Press Start 2P", monospace', ARCADE.dim);
    }
  }
}
```

- [ ] **Step 6: Daftarkan di registry**

Entri `GAMES`:

```ts
  {
    id: 'simon',
    category: 'memory',
    icon: 'brain',
    accent: 'pink',
    name: { id: 'Simon Gabut', en: 'Simon Says Nothing' },
    tagline: { id: 'Hafalkan urutannya. Terus. Terus.', en: 'Memorize the sequence. Again. And again.' },
    howTo: {
      id: 'Perhatikan urutan lampu menyala, lalu ulangi dengan menekan pad yang sama (atau tombol 1-4).',
      en: 'Watch the lights, then repeat the sequence on the pads (or keys 1-4).',
    },
  },
```

Loader:

```ts
  simon: () => import('./simon/engine').then((m) => new m.SimonEngine()),
```

- [ ] **Step 7: Playtest** — `/play/simon`: urutan diputar, pad merespons, salah tekan mengurangi nyawa dan urutan diputar ulang, benar semua memperpanjang urutan.

- [ ] **Step 8: Commit**

```bash
git add src/games/simon src/games/registry.ts
git commit -m "feat: game Simon Gabut (memori)"
```

### Task 15: Angka Hilang (logika)

**Files:**
- Create: `src/games/missing-number/logic.ts`, `src/games/missing-number/logic.test.ts`, `src/games/missing-number/engine.ts`
- Modify: `src/games/registry.ts`

- [ ] **Step 1: Failing test**

`src/games/missing-number/logic.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../core/rng';
import { makeNumQ, numTimeMs } from './logic';

describe('missing-number', () => {
  it('display punya tepat satu lubang; opsi memuat jawaban tepat sekali dan unik', () => {
    const rand = mulberry32(21);
    for (let i = 0; i < 300; i++) {
      const q = makeNumQ(rand, 1 + (i % 8));
      expect(q.display.filter((v) => v === null).length).toBe(1);
      expect(q.options.length).toBe(3);
      expect(q.options.filter((o) => o === q.answer).length).toBe(1);
      expect(new Set(q.options).size).toBe(3);
    }
  });
  it('deterministik per seed', () => {
    const a = makeNumQ(mulberry32(7), 3);
    const b = makeNumQ(mulberry32(7), 3);
    expect(a).toEqual(b);
  });
  it('waktu menurun dengan floor 3000', () => {
    expect(numTimeMs(1)).toBe(8000);
    expect(numTimeMs(99)).toBe(3000);
  });
});
```

- [ ] **Step 2: Run test — FAIL** (`npm test`)

- [ ] **Step 3: Implementasi logic**

`src/games/missing-number/logic.ts`:

```ts
import { pick, randInt, seededShuffle } from '../../core/rng';

export interface NumQ {
  display: (number | null)[];
  options: number[];
  answer: number;
}

type Gen = (rand: () => number) => number[];

const gens: Record<string, Gen> = {
  arithmetic: (rand) => {
    const start = randInt(rand, 1, 15);
    const step = randInt(rand, 2, 9);
    return Array.from({ length: 5 }, (_, i) => start + i * step);
  },
  geometric: (rand) => {
    const start = randInt(rand, 1, 4);
    const ratio = randInt(rand, 2, 3);
    return Array.from({ length: 4 }, (_, i) => start * ratio ** i);
  },
  squares: (rand) => {
    const n0 = randInt(rand, 1, 5);
    return Array.from({ length: 4 }, (_, i) => (n0 + i) ** 2);
  },
  fib: (rand) => {
    const seq = [randInt(rand, 1, 5), randInt(rand, 1, 5)];
    while (seq.length < 5) seq.push(seq[seq.length - 1] + seq[seq.length - 2]);
    return seq;
  },
  zigzag: (rand) => {
    const up = randInt(rand, 3, 9);
    const down = randInt(rand, 1, up - 1);
    const seq = [randInt(rand, 10, 30)];
    for (let i = 0; i < 4; i++) seq.push(seq[i] + (i % 2 === 0 ? up : -down));
    return seq;
  },
};

function poolFor(level: number): Gen[] {
  if (level <= 2) return [gens.arithmetic];
  if (level === 3) return [gens.arithmetic, gens.geometric];
  if (level === 4) return [gens.arithmetic, gens.geometric, gens.squares];
  return Object.values(gens);
}

export function numTimeMs(level: number): number {
  return Math.max(3000, 8000 - (level - 1) * 500);
}

export function makeNumQ(rand: () => number, level: number): NumQ {
  const seq = pick(rand, poolFor(level))(rand);
  const hideIdx = level < 4 ? seq.length - 1 : randInt(rand, 1, seq.length - 1);
  const answer = seq[hideIdx];
  const display = seq.map((v, i) => (i === hideIdx ? null : v));
  const distractors = new Set<number>();
  while (distractors.size < 2) {
    const d = answer + randInt(rand, 1, 6) * (rand() < 0.5 ? -1 : 1);
    if (d !== answer) distractors.add(d);
  }
  const options = seededShuffle([answer, ...distractors], rand);
  return { display, options, answer };
}
```

- [ ] **Step 4: Run test — PASS** (`npm test`)

- [ ] **Step 5: Implementasi engine**

`src/games/missing-number/engine.ts`:

```ts
import { BaseEngine } from '../base';
import { ARCADE, centerText, drawRoundRect, inRect, pointerPos } from '../canvas';
import type { Rect } from '../canvas';
import { sfx } from '../../core/sound';
import { makeNumQ, numTimeMs } from './logic';
import type { NumQ } from './logic';

export class MissingNumberEngine extends BaseEngine {
  private q!: NumQ;
  private timeLeft = 0;
  private optionRects: Rect[] = [];

  private onPointer = (e: PointerEvent) => {
    if (!this.isRunning) return;
    const { x, y } = pointerPos(this.canvas, e, this.w, this.h);
    const i = this.optionRects.findIndex((r) => inRect(x, y, r));
    if (i >= 0) this.answer(i);
  };

  private onKey = (e: KeyboardEvent) => {
    if (!this.isRunning) return;
    const i = ['1', '2', '3'].indexOf(e.key);
    if (i >= 0) this.answer(i);
  };

  protected setup(): void {
    this.levelEvery = 5;
    this.optionRects = [0, 1, 2].map((i) => ({ x: 40 + i * 140, y: 540, w: 120, h: 110 }));
    this.next();
    this.canvas.addEventListener('pointerdown', this.onPointer);
    window.addEventListener('keydown', this.onKey);
  }

  protected teardown(): void {
    this.canvas.removeEventListener('pointerdown', this.onPointer);
    window.removeEventListener('keydown', this.onKey);
  }

  private next(): void {
    this.q = makeNumQ(this.rand, this.level);
    this.timeLeft = numTimeMs(this.level);
  }

  private answer(i: number): void {
    if (this.q.options[i] === this.q.answer) {
      sfx.play('good');
      this.success(25 + Math.ceil(this.timeLeft / 300));
    } else {
      sfx.play('bad');
      this.fail();
      if (this.isFinished) return;
    }
    this.next();
  }

  protected update(dt: number): void {
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      sfx.play('bad');
      this.fail();
      if (this.isFinished) return;
      this.next();
    }
  }

  protected draw(): void {
    const c = this.ctx;
    c.fillStyle = ARCADE.bg;
    c.fillRect(0, 0, this.w, this.h);
    const frac = Math.max(0, this.timeLeft / numTimeMs(this.level));
    drawRoundRect(c, { x: 40, y: 60, w: 400, h: 14 }, 7, ARCADE.bgSoft);
    drawRoundRect(c, { x: 40, y: 60, w: 400 * frac, h: 14 }, 7, frac < 0.3 ? ARCADE.pink : ARCADE.yellow);
    const n = this.q.display.length;
    const bw = Math.min(90, (this.w - 60) / n - 10);
    const totalW = n * (bw + 10) - 10;
    const x0 = (this.w - totalW) / 2;
    this.q.display.forEach((v, i) => {
      const r: Rect = { x: x0 + i * (bw + 10), y: 260, w: bw, h: 80 };
      drawRoundRect(c, r, 14, v === null ? ARCADE.bgSoft : ARCADE.bg, v === null ? ARCADE.yellow : ARCADE.dim);
      centerText(c, v === null ? '?' : String(v), r.x + bw / 2, 300, '22px "Press Start 2P", monospace', v === null ? ARCADE.yellow : ARCADE.white);
    });
    this.q.options.forEach((o, i) => {
      const r = this.optionRects[i];
      drawRoundRect(c, r, 16, ARCADE.bgSoft, ARCADE.blue);
      centerText(c, String(o), r.x + r.w / 2, r.y + 58, '22px "Press Start 2P", monospace', ARCADE.blue);
    });
  }
}
```

- [ ] **Step 6: Daftarkan di registry**

Entri `GAMES`:

```ts
  {
    id: 'missing-number',
    category: 'logic',
    icon: 'hash',
    accent: 'amber',
    name: { id: 'Angka Hilang', en: 'Missing Number' },
    tagline: { id: 'Deretnya bolong satu. Isi!', en: 'One number is missing. Fill it!' },
    howTo: {
      id: 'Temukan pola deret dan pilih angka yang hilang (tombol 1-3) sebelum waktu habis.',
      en: 'Spot the pattern and pick the missing number (keys 1-3) before time runs out.',
    },
  },
```

Loader:

```ts
  'missing-number': () => import('./missing-number/engine').then((m) => new m.MissingNumberEngine()),
```

- [ ] **Step 7: Playtest** — `/play/missing-number`: deret tampil dengan satu `?`, tiga opsi bisa dipilih, timeout mengurangi nyawa.

- [ ] **Step 8: Commit**

```bash
git add src/games/missing-number src/games/registry.ts
git commit -m "feat: game Angka Hilang (logika)"
```

---

## Fase 4 — Game gelombang 2

### Task 16: Kata Acak (kata)

**Files:**
- Create: `src/games/word-scramble/words-id.ts`, `src/games/word-scramble/words-en.ts`, `src/games/word-scramble/logic.ts`, `src/games/word-scramble/logic.test.ts`, `src/games/word-scramble/engine.ts`
- Modify: `src/games/registry.ts`

- [ ] **Step 1: Failing test**

`src/games/word-scramble/logic.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../core/rng';
import { pickWord, scramble, wordLenForLevel, wordTimeMs } from './logic';
import { WORDS_ID } from './words-id';
import { WORDS_EN } from './words-en';

describe('kamus kata', () => {
  for (const [label, list] of [
    ['id', WORDS_ID],
    ['en', WORDS_EN],
  ] as const) {
    it(`${label}: lowercase, 4-7 huruf, unik`, () => {
      expect(new Set(list).size).toBe(list.length);
      for (const w of list) {
        expect(w).toBe(w.toLowerCase());
        expect(w.length).toBeGreaterThanOrEqual(4);
        expect(w.length).toBeLessThanOrEqual(7);
      }
      for (const len of [4, 5, 6, 7]) {
        expect(list.filter((w) => w.length === len).length).toBeGreaterThanOrEqual(8);
      }
    });
  }
});

describe('logic kata-acak', () => {
  it('panjang kata naik dengan level, maksimum 7', () => {
    expect(wordLenForLevel(1)).toBe(4);
    expect(wordLenForLevel(3)).toBe(5);
    expect(wordLenForLevel(5)).toBe(6);
    expect(wordLenForLevel(7)).toBe(7);
    expect(wordLenForLevel(99)).toBe(7);
  });
  it('pickWord menghormati panjang bila tersedia', () => {
    const rand = mulberry32(3);
    for (let i = 0; i < 50; i++) expect(pickWord(rand, WORDS_ID, 5).length).toBe(5);
  });
  it('scramble = permutasi dan berbeda dari kata asal', () => {
    const rand = mulberry32(9);
    for (const w of ['makan', 'bintang', 'rocket', 'kopi']) {
      const s = scramble(rand, w);
      expect([...s].sort().join('')).toBe([...w].sort().join(''));
      expect(s.join('')).not.toBe(w);
    }
  });
  it('waktu per kata menurun dengan floor 4000', () => {
    expect(wordTimeMs(1)).toBe(9000);
    expect(wordTimeMs(99)).toBe(4000);
  });
});
```

- [ ] **Step 2: Run test — FAIL** (`npm test`)

- [ ] **Step 3: Tulis kamus kata**

`src/games/word-scramble/words-id.ts`:

```ts
export const WORDS_ID: readonly string[] = [
  'buku', 'meja', 'kopi', 'susu', 'nasi', 'ayam', 'ikan', 'sapi', 'daun', 'laut',
  'kota', 'desa', 'toko', 'uang', 'topi', 'baju', 'main', 'lari', 'pagi', 'sore',
  'kata', 'roti', 'keju', 'gula', 'asin', 'biru', 'tari', 'lagu',
  'makan', 'minum', 'tidur', 'kursi', 'pintu', 'jalan', 'bunga', 'pohon', 'hujan',
  'panas', 'bulan', 'rumah', 'kamar', 'dapur', 'lampu', 'radio', 'musik', 'warna',
  'merah', 'hijau', 'hitam', 'putih', 'cepat', 'besar', 'kecil', 'murah', 'mahal',
  'takut', 'malas', 'rajin', 'gabut', 'teman', 'pasar', 'taman', 'mimpi', 'siang',
  'malam', 'besok', 'waktu', 'menit', 'detik', 'angka', 'huruf', 'pesta', 'badut',
  'telur', 'garam', 'manis', 'pahit', 'pedas', 'salju', 'sedih',
  'dingin', 'langit', 'gunung', 'pantai', 'sungai', 'lambat', 'tinggi', 'pendek',
  'senang', 'berani', 'pintar', 'kantor', 'kertas', 'pensil', 'sepatu', 'celana',
  'lompat', 'renang', 'cerita', 'kuning',
  'jendela', 'pelangi', 'bintang', 'kemarin', 'dongeng', 'sekolah', 'sahabat', 'terbang',
];
```

`src/games/word-scramble/words-en.ts`:

```ts
export const WORDS_EN: readonly string[] = [
  'time', 'play', 'game', 'rain', 'hill', 'door', 'tree', 'leaf', 'salt', 'milk',
  'rice', 'fish', 'star', 'moon', 'blue', 'slow', 'tall', 'lazy', 'snow', 'cake',
  'song', 'book', 'kite', 'frog', 'bear', 'lion', 'wolf', 'duck', 'gold',
  'bored', 'happy', 'smile', 'laugh', 'dream', 'cloud', 'sunny', 'storm', 'river',
  'ocean', 'beach', 'house', 'table', 'chair', 'apple', 'sugar', 'sweet', 'spicy',
  'water', 'juice', 'horse', 'tiger', 'zebra', 'panda', 'mouse', 'snake', 'eagle',
  'robot', 'light', 'night', 'lunch', 'snack', 'candy', 'music', 'dance', 'paint',
  'color', 'green', 'black', 'white', 'quick', 'small', 'large', 'short', 'cheap',
  'funny', 'brave', 'smart', 'money', 'paper', 'shoes', 'shirt', 'pants', 'magic',
  'pizza', 'train', 'plane',
  'window', 'garden', 'flower', 'cheese', 'rocket', 'planet', 'dinner', 'friend',
  'school', 'office', 'market', 'pencil', 'jacket', 'winter', 'summer', 'spring',
  'autumn', 'puzzle', 'riddle', 'secret', 'wizard', 'dragon', 'castle', 'bridge',
  'street', 'corner', 'pocket', 'button', 'banana', 'monkey', 'rabbit', 'turtle',
  'cookie', 'guitar', 'purple', 'orange', 'yellow',
  'morning', 'chicken', 'penguin', 'rainbow', 'bicycle', 'picture', 'teacher',
  'weather', 'holiday', 'diamond', 'unicorn', 'monster',
];
```

- [ ] **Step 4: Implementasi logic**

`src/games/word-scramble/logic.ts`:

```ts
import { pick, seededShuffle } from '../../core/rng';

export function wordLenForLevel(level: number): number {
  return Math.min(7, 3 + Math.ceil(level / 2));
}

export function wordTimeMs(level: number): number {
  return Math.max(4000, 9000 - (level - 1) * 500);
}

export function pickWord(rand: () => number, list: readonly string[], len: number): string {
  const candidates = list.filter((w) => w.length === len);
  return candidates.length > 0 ? pick(rand, candidates) : pick(rand, list);
}

export function scramble(rand: () => number, word: string): string[] {
  const letters = word.split('');
  if (new Set(letters).size < 2) return letters;
  for (let i = 0; i < 20; i++) {
    const s = seededShuffle(letters, rand);
    if (s.join('') !== word) return s;
  }
  return letters.reverse();
}
```

- [ ] **Step 5: Run test — PASS** (`npm test`)

- [ ] **Step 6: Implementasi engine**

`src/games/word-scramble/engine.ts`:

```ts
import { BaseEngine } from '../base';
import { ARCADE, centerText, drawRoundRect, inRect, pointerPos } from '../canvas';
import type { Rect } from '../canvas';
import { sfx } from '../../core/sound';
import { pickWord, scramble, wordLenForLevel, wordTimeMs } from './logic';
import { WORDS_ID } from './words-id';
import { WORDS_EN } from './words-en';

interface Tile {
  letter: string;
  taken: boolean;
  rect: Rect;
}

export class WordScrambleEngine extends BaseEngine {
  private word = '';
  private tiles: Tile[] = [];
  private progress = 0;
  private timeLeft = 0;

  private onPointer = (e: PointerEvent) => {
    if (!this.isRunning) return;
    const { x, y } = pointerPos(this.canvas, e, this.w, this.h);
    const tile = this.tiles.find((t) => !t.taken && inRect(x, y, t.rect));
    if (tile) this.tryLetter(tile);
  };

  private onKey = (e: KeyboardEvent) => {
    if (!this.isRunning || e.key.length !== 1) return;
    const k = e.key.toLowerCase();
    const tile = this.tiles.find((t) => !t.taken && t.letter === k);
    if (tile) this.tryLetter(tile);
  };

  protected setup(): void {
    this.levelEvery = 4;
    this.nextWord();
    this.canvas.addEventListener('pointerdown', this.onPointer);
    window.addEventListener('keydown', this.onKey);
  }

  protected teardown(): void {
    this.canvas.removeEventListener('pointerdown', this.onPointer);
    window.removeEventListener('keydown', this.onKey);
  }

  private nextWord(): void {
    const list = this.opts.locale === 'id' ? WORDS_ID : WORDS_EN;
    this.word = pickWord(this.rand, list, wordLenForLevel(this.level));
    const letters = scramble(this.rand, this.word);
    const size = 56;
    const gap = 10;
    const totalW = letters.length * (size + gap) - gap;
    const x0 = (this.w - totalW) / 2;
    this.tiles = letters.map((letter, i) => ({
      letter,
      taken: false,
      rect: { x: x0 + i * (size + gap), y: 400, w: size, h: size },
    }));
    this.progress = 0;
    this.timeLeft = wordTimeMs(this.level);
  }

  private tryLetter(tile: Tile): void {
    if (tile.letter === this.word[this.progress]) {
      sfx.play('tap');
      tile.taken = true;
      this.progress += 1;
      if (this.progress >= this.word.length) {
        sfx.play('good');
        this.success(this.word.length * 25 + Math.ceil(this.timeLeft / 300));
        this.nextWord();
      }
    } else {
      sfx.play('bad');
      this.fail();
      if (this.isFinished) return;
      this.tiles.forEach((t) => (t.taken = false));
      this.progress = 0;
    }
  }

  protected update(dt: number): void {
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      sfx.play('bad');
      this.fail();
      if (this.isFinished) return;
      this.nextWord();
    }
  }

  protected draw(): void {
    const c = this.ctx;
    c.fillStyle = ARCADE.bg;
    c.fillRect(0, 0, this.w, this.h);
    const frac = Math.max(0, this.timeLeft / wordTimeMs(this.level));
    drawRoundRect(c, { x: 40, y: 60, w: 400, h: 14 }, 7, ARCADE.bgSoft);
    drawRoundRect(c, { x: 40, y: 60, w: 400 * frac, h: 14 }, 7, frac < 0.3 ? ARCADE.pink : ARCADE.yellow);
    const n = this.word.length;
    const slotW = 44;
    const gap = 8;
    const x0 = (this.w - (n * (slotW + gap) - gap)) / 2;
    for (let i = 0; i < n; i++) {
      const r: Rect = { x: x0 + i * (slotW + gap), y: 230, w: slotW, h: 56 };
      drawRoundRect(c, r, 10, ARCADE.bgSoft, i < this.progress ? ARCADE.green : ARCADE.dim);
      if (i < this.progress) {
        centerText(c, this.word[i].toUpperCase(), r.x + slotW / 2, r.y + 30, '20px "Press Start 2P", monospace', ARCADE.green);
      }
    }
    for (const t of this.tiles) {
      c.globalAlpha = t.taken ? 0.2 : 1;
      drawRoundRect(c, t.rect, 12, ARCADE.bgSoft, ARCADE.yellow);
      centerText(c, t.letter.toUpperCase(), t.rect.x + t.rect.w / 2, t.rect.y + 30, '22px "Press Start 2P", monospace', ARCADE.yellow);
      c.globalAlpha = 1;
    }
  }
}
```

- [ ] **Step 7: Daftarkan di registry**

Entri `GAMES`:

```ts
  {
    id: 'word-scramble',
    category: 'word',
    icon: 'type',
    accent: 'pink',
    name: { id: 'Kata Acak', en: 'Word Jumble' },
    tagline: { id: 'Susun hurufnya sebelum otakmu nyerah.', en: 'Unscramble before your brain gives up.' },
    howTo: {
      id: 'Tap (atau ketik) huruf sesuai urutan kata yang benar. Salah tap = nyawa melayang.',
      en: 'Tap (or type) letters in the right order. A wrong tap costs a life.',
    },
  },
```

Loader:

```ts
  'word-scramble': () => import('./word-scramble/engine').then((m) => new m.WordScrambleEngine()),
```

- [ ] **Step 8: Playtest** — `/play/word-scramble`: kata sesuai bahasa aktif (ganti toggle ID/EN lalu mulai ulang), tap huruf benar mengisi slot, salah tap reset + kurangi nyawa, ketik via keyboard juga jalan.

- [ ] **Step 9: Commit**

```bash
git add src/games/word-scramble src/games/registry.ts
git commit -m "feat: game Kata Acak (kata) + kamus ID/EN"
```

### Task 17: Bubble Sniper (aim)

**Files:**
- Create: `src/games/bubble-sniper/logic.ts`, `src/games/bubble-sniper/logic.test.ts`, `src/games/bubble-sniper/engine.ts`
- Modify: `src/games/registry.ts`

- [ ] **Step 1: Failing test**

`src/games/bubble-sniper/logic.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { bubbleRadius, bubbleSpeed, hitPoints, skullChance, spawnMs } from './logic';

describe('kurva bubble-sniper', () => {
  it('kecepatan naik per level', () => {
    expect(bubbleSpeed(1)).toBe(90);
    expect(bubbleSpeed(5)).toBeGreaterThan(bubbleSpeed(1));
  });
  it('spawn menurun dengan floor 600', () => {
    expect(spawnMs(1)).toBe(1400);
    expect(spawnMs(99)).toBe(600);
  });
  it('radius mengecil dengan floor 16', () => {
    expect(bubbleRadius(1)).toBe(26);
    expect(bubbleRadius(99)).toBe(16);
  });
  it('skull muncul mulai level 3', () => {
    expect(skullChance(2)).toBe(0);
    expect(skullChance(3)).toBeCloseTo(0.2);
  });
  it('poin naik per level', () => {
    expect(hitPoints(1)).toBe(18);
    expect(hitPoints(5)).toBe(30);
  });
});
```

- [ ] **Step 2: Run test — FAIL** (`npm test`)

- [ ] **Step 3: Implementasi logic**

`src/games/bubble-sniper/logic.ts`:

```ts
export interface Bubble {
  x: number;
  baseY: number;
  dir: 1 | -1;
  phase: number;
  r: number;
  skull: boolean;
}

export function bubbleSpeed(level: number): number {
  return 90 + (level - 1) * 12;
}

export function spawnMs(level: number): number {
  return Math.max(600, 1400 - (level - 1) * 70);
}

export function bubbleRadius(level: number): number {
  return Math.max(16, 26 - (level - 1) * 1.5);
}

export function skullChance(level: number): number {
  return level >= 3 ? 0.2 : 0;
}

export function hitPoints(level: number): number {
  return 15 + level * 3;
}
```

- [ ] **Step 4: Run test — PASS** (`npm test`)

- [ ] **Step 5: Implementasi engine**

`src/games/bubble-sniper/engine.ts`:

```ts
import { BaseEngine } from '../base';
import { ARCADE } from '../canvas';
import { pointerPos } from '../canvas';
import { sfx } from '../../core/sound';
import { bubbleRadius, bubbleSpeed, hitPoints, skullChance, spawnMs } from './logic';
import type { Bubble } from './logic';

export class BubbleSniperEngine extends BaseEngine {
  private bubbles: Bubble[] = [];
  private spawnTimer = 0;
  private nextDir: 1 | -1 = 1;

  private onPointer = (e: PointerEvent) => {
    if (!this.isRunning) return;
    const { x, y } = pointerPos(this.canvas, e, this.w, this.h);
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      const by = this.yOf(b);
      if ((x - b.x) ** 2 + (y - by) ** 2 <= (b.r + 8) ** 2) {
        this.bubbles.splice(i, 1);
        if (b.skull) {
          sfx.play('bad');
          this.fail();
        } else {
          sfx.play('good');
          this.success(hitPoints(this.level));
        }
        return;
      }
    }
  };

  private yOf(b: Bubble): number {
    return b.baseY + 28 * Math.sin(b.phase + b.x * 0.02);
  }

  protected setup(): void {
    this.canvas.addEventListener('pointerdown', this.onPointer);
  }

  protected teardown(): void {
    this.canvas.removeEventListener('pointerdown', this.onPointer);
  }

  protected update(dt: number): void {
    this.spawnTimer += dt;
    if (this.spawnTimer >= spawnMs(this.level)) {
      this.spawnTimer = 0;
      const r = bubbleRadius(this.level);
      const dir = this.nextDir;
      this.nextDir = dir === 1 ? -1 : 1;
      this.bubbles.push({
        x: dir === 1 ? -r : this.w + r,
        baseY: 110 + this.rand() * (this.h - 260),
        dir,
        phase: this.rand() * Math.PI * 2,
        r,
        skull: this.rand() < skullChance(this.level),
      });
    }
    const v = bubbleSpeed(this.level);
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      b.x += ((b.dir * v) / 1000) * dt;
      b.phase += dt * 0.004;
      const out = b.dir === 1 ? b.x > this.w + b.r : b.x < -b.r;
      if (out) {
        this.bubbles.splice(i, 1);
        if (!b.skull) {
          sfx.play('bad');
          this.fail();
          if (this.isFinished) return;
        }
      }
    }
  }

  protected draw(): void {
    const c = this.ctx;
    c.fillStyle = ARCADE.bg;
    c.fillRect(0, 0, this.w, this.h);
    for (const b of this.bubbles) {
      const y = this.yOf(b);
      c.beginPath();
      c.arc(b.x, y, b.r, 0, Math.PI * 2);
      c.fillStyle = ARCADE.bgSoft;
      c.fill();
      c.lineWidth = 4;
      c.strokeStyle = b.skull ? ARCADE.pink : ARCADE.blue;
      c.stroke();
      if (b.skull) {
        c.fillStyle = ARCADE.pink;
        c.fillRect(b.x - b.r * 0.45, y - 3, b.r * 0.3, 3);
        c.fillRect(b.x + b.r * 0.15, y - 3, b.r * 0.3, 3);
      } else {
        c.beginPath();
        c.arc(b.x - b.r * 0.3, y - b.r * 0.3, Math.max(2, b.r * 0.18), 0, Math.PI * 2);
        c.fillStyle = ARCADE.white;
        c.fill();
      }
    }
  }
}
```

- [ ] **Step 6: Daftarkan di registry**

Entri `GAMES`:

```ts
  {
    id: 'bubble-sniper',
    category: 'aim',
    icon: 'target',
    accent: 'teal',
    name: { id: 'Bubble Sniper', en: 'Bubble Sniper' },
    tagline: { id: 'Tembak gelembungnya. Jangan yang pink.', en: 'Pop the bubbles. Not the pink ones.' },
    howTo: {
      id: 'Tap gelembung biru sebelum kabur dari layar. Gelembung pink = jebakan!',
      en: 'Tap blue bubbles before they escape. Pink bubbles are traps!',
    },
  },
```

Loader:

```ts
  'bubble-sniper': () => import('./bubble-sniper/engine').then((m) => new m.BubbleSniperEngine()),
```

- [ ] **Step 7: Playtest** — `/play/bubble-sniper`: gelembung melintas berkelok, tap meledakkan, lolos = nyawa hilang, level naik mempercepat.

- [ ] **Step 8: Commit**

```bash
git add src/games/bubble-sniper src/games/registry.ts
git commit -m "feat: game Bubble Sniper (aim)"
```

### Task 18: Ngindar! (ketangkasan)

**Files:**
- Create: `src/games/dodge/logic.ts`, `src/games/dodge/logic.test.ts`, `src/games/dodge/engine.ts`
- Modify: `src/games/registry.ts`

- [ ] **Step 1: Failing test**

`src/games/dodge/logic.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { circleRectOverlap, fallSpeed, spawnMs } from './logic';

describe('dodge', () => {
  it('kecepatan jatuh naik, spawn menurun dengan floor 320', () => {
    expect(fallSpeed(1)).toBe(160);
    expect(fallSpeed(5)).toBeGreaterThan(fallSpeed(1));
    expect(spawnMs(1)).toBe(800);
    expect(spawnMs(99)).toBe(320);
  });
  it('deteksi tabrakan lingkaran-persegi', () => {
    const rect = { x: 100, y: 100, w: 60, h: 20 };
    expect(circleRectOverlap(130, 110, 10, rect)).toBe(true);
    expect(circleRectOverlap(90, 95, 12, rect)).toBe(true);
    expect(circleRectOverlap(130, 200, 10, rect)).toBe(false);
    expect(circleRectOverlap(50, 50, 10, rect)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test — FAIL** (`npm test`)

- [ ] **Step 3: Implementasi logic**

`src/games/dodge/logic.ts`:

```ts
import type { Rect } from '../canvas';

export interface Obstacle extends Rect {
  scored: boolean;
}

export function fallSpeed(level: number): number {
  return 160 + (level - 1) * 25;
}

export function spawnMs(level: number): number {
  return Math.max(320, 800 - (level - 1) * 45);
}

export function circleRectOverlap(cx: number, cy: number, r: number, rect: Rect): boolean {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  return (cx - nx) ** 2 + (cy - ny) ** 2 <= r * r;
}
```

- [ ] **Step 4: Run test — PASS** (`npm test`)

- [ ] **Step 5: Implementasi engine**

`src/games/dodge/engine.ts`:

```ts
import { BaseEngine } from '../base';
import { ARCADE, drawRoundRect, pointerPos } from '../canvas';
import { sfx } from '../../core/sound';
import { circleRectOverlap, fallSpeed, spawnMs } from './logic';
import type { Obstacle } from './logic';

export class DodgeEngine extends BaseEngine {
  private px = 240;
  private targetX = 240;
  private readonly py = 640;
  private readonly pr = 16;
  private obstacles: Obstacle[] = [];
  private spawnTimer = 0;
  private invuln = 0;
  private keyDir = 0;

  private onMove = (e: PointerEvent) => {
    this.targetX = pointerPos(this.canvas, e, this.w, this.h).x;
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') this.keyDir = -1;
    if (e.key === 'ArrowRight') this.keyDir = 1;
  };

  private onKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && this.keyDir === -1) this.keyDir = 0;
    if (e.key === 'ArrowRight' && this.keyDir === 1) this.keyDir = 0;
  };

  protected setup(): void {
    this.levelEvery = 10;
    this.canvas.addEventListener('pointermove', this.onMove);
    this.canvas.addEventListener('pointerdown', this.onMove);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  protected teardown(): void {
    this.canvas.removeEventListener('pointermove', this.onMove);
    this.canvas.removeEventListener('pointerdown', this.onMove);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  protected update(dt: number): void {
    if (this.keyDir !== 0) this.targetX = this.px + this.keyDir * 0.45 * dt * 1.4;
    this.px += (this.targetX - this.px) * Math.min(1, dt / 80);
    this.px = Math.max(this.pr, Math.min(this.w - this.pr, this.px));
    this.invuln = Math.max(0, this.invuln - dt);

    this.spawnTimer += dt;
    if (this.spawnTimer >= spawnMs(this.level)) {
      this.spawnTimer = 0;
      const w = 40 + this.rand() * 60;
      this.obstacles.push({ x: this.rand() * (this.w - w), y: -30, w, h: 22, scored: false });
    }
    const v = fallSpeed(this.level);
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i];
      o.y += (v / 1000) * dt;
      if (!o.scored && o.y > this.py + this.pr) {
        o.scored = true;
        this.success(5);
      }
      if (o.y > this.h + 40) this.obstacles.splice(i, 1);
      else if (this.invuln <= 0 && circleRectOverlap(this.px, this.py, this.pr, o)) {
        sfx.play('bad');
        this.fail();
        if (this.isFinished) return;
        this.invuln = 1200;
      }
    }
  }

  protected draw(): void {
    const c = this.ctx;
    c.fillStyle = ARCADE.bg;
    c.fillRect(0, 0, this.w, this.h);
    for (const o of this.obstacles) drawRoundRect(c, o, 8, ARCADE.yellow);
    if (this.invuln > 0 && Math.floor(this.invuln / 100) % 2 === 0) return;
    c.beginPath();
    c.arc(this.px, this.py, this.pr, 0, Math.PI * 2);
    c.fillStyle = ARCADE.green;
    c.fill();
    c.fillStyle = ARCADE.bg;
    c.fillRect(this.px - 6, this.py - 5, 3, 6);
    c.fillRect(this.px + 3, this.py - 5, 3, 6);
  }
}
```

- [ ] **Step 6: Daftarkan di registry**

Entri `GAMES`:

```ts
  {
    id: 'dodge',
    category: 'dexterity',
    icon: 'move',
    accent: 'amber',
    name: { id: 'Ngindar!', en: 'Dodge!' },
    tagline: { id: 'Geser, hindar, bertahan hidup.', en: 'Slide, dodge, survive.' },
    howTo: {
      id: 'Gerakkan bola dengan jari (atau panah kiri/kanan). Jangan sampai kena balok jatuh.',
      en: 'Move with your finger (or arrow keys). Do not get hit by falling blocks.',
    },
  },
```

Loader:

```ts
  dodge: () => import('./dodge/engine').then((m) => new m.DodgeEngine()),
```

- [ ] **Step 7: Playtest** — `/play/dodge`: bola mengikuti jari/panah, balok jatuh makin rapat, tabrakan mengurangi nyawa + blink invulnerable.

- [ ] **Step 8: Commit**

```bash
git add src/games/dodge src/games/registry.ts
git commit -m "feat: game Ngindar! (ketangkasan)"
```

### Task 19: Ketuk Beat (ritme)

**Files:**
- Create: `src/games/beat-tap/logic.ts`, `src/games/beat-tap/logic.test.ts`, `src/games/beat-tap/engine.ts`
- Modify: `src/games/registry.ts`

- [ ] **Step 1: Failing test**

`src/games/beat-tap/logic.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../core/rng';
import { bpmForLevel, judge, makeBar } from './logic';

describe('beat-tap', () => {
  it('bpm naik per level, maksimum 180', () => {
    expect(bpmForLevel(1)).toBe(90);
    expect(bpmForLevel(2)).toBe(98);
    expect(bpmForLevel(99)).toBe(180);
  });
  it('bar punya 8 slot, slot 0 selalu berisi, kepadatan sesuai level', () => {
    const rand = mulberry32(6);
    for (const level of [1, 3, 6, 10]) {
      const bar = makeBar(rand, level);
      expect(bar.length).toBe(8);
      expect(bar[0]).toBe(true);
      expect(bar.filter(Boolean).length).toBe(Math.min(6, 2 + level));
    }
  });
  it('judge: perfect <=50ms, good <=130ms, selain itu null', () => {
    expect(judge(0)).toBe('perfect');
    expect(judge(-50)).toBe('perfect');
    expect(judge(80)).toBe('good');
    expect(judge(-130)).toBe('good');
    expect(judge(131)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test — FAIL** (`npm test`)

- [ ] **Step 3: Implementasi logic**

`src/games/beat-tap/logic.ts`:

```ts
import { seededShuffle } from '../../core/rng';

export type Judgement = 'perfect' | 'good';

export function bpmForLevel(level: number): number {
  return Math.min(180, 90 + (level - 1) * 8);
}

export function makeBar(rand: () => number, level: number): boolean[] {
  const density = Math.min(6, 2 + level);
  const extra = seededShuffle([1, 2, 3, 4, 5, 6, 7], rand).slice(0, density - 1);
  const bar = Array.from({ length: 8 }, () => false);
  bar[0] = true;
  for (const i of extra) bar[i] = true;
  return bar;
}

export function judge(deltaMs: number): Judgement | null {
  const d = Math.abs(deltaMs);
  if (d <= 50) return 'perfect';
  if (d <= 130) return 'good';
  return null;
}
```

- [ ] **Step 4: Run test — PASS** (`npm test`)

- [ ] **Step 5: Implementasi engine**

`src/games/beat-tap/engine.ts`:

```ts
import { BaseEngine } from '../base';
import { ARCADE, centerText } from '../canvas';
import { sfx } from '../../core/sound';
import { bpmForLevel, judge, makeBar } from './logic';

interface Note {
  time: number;
  judged: boolean;
}

const TRAVEL_MS = 1400;
const MISS_MS = 130;

export class BeatTapEngine extends BaseEngine {
  private notes: Note[] = [];
  private nextBarAt = 1600;
  private flash = '';
  private flashUntil = 0;
  private readonly hitY = 560;

  private onTap = () => {
    if (!this.isRunning) return;
    this.tryHit();
  };

  private onKey = (e: KeyboardEvent) => {
    if (!this.isRunning || e.repeat || e.key !== ' ') return;
    e.preventDefault();
    this.tryHit();
  };

  protected setup(): void {
    this.canvas.addEventListener('pointerdown', this.onTap);
    window.addEventListener('keydown', this.onKey);
  }

  protected teardown(): void {
    this.canvas.removeEventListener('pointerdown', this.onTap);
    window.removeEventListener('keydown', this.onKey);
  }

  private tryHit(): void {
    let best: Note | null = null;
    for (const n of this.notes) {
      if (n.judged) continue;
      if (!best || Math.abs(n.time - this.elapsed) < Math.abs(best.time - this.elapsed)) best = n;
    }
    const delta = best ? this.elapsed - best.time : Infinity;
    const j = best ? judge(delta) : null;
    if (best && j) {
      best.judged = true;
      sfx.play(j === 'perfect' ? 'good' : 'tap');
      this.success(j === 'perfect' ? 30 : 15);
      this.setFlash(j.toUpperCase());
    } else {
      sfx.play('tick');
      this.resetCombo();
      this.setFlash('...');
    }
  }

  private setFlash(s: string): void {
    this.flash = s;
    this.flashUntil = this.elapsed + 450;
  }

  protected update(dt: number): void {
    void dt;
    const beatMs = 60000 / bpmForLevel(this.level);
    while (this.nextBarAt < this.elapsed + 2200) {
      const bar = makeBar(this.rand, this.level);
      bar.forEach((on, slot) => {
        if (on) this.notes.push({ time: this.nextBarAt + (slot * beatMs) / 2, judged: false });
      });
      this.nextBarAt += beatMs * 4;
    }
    for (let i = this.notes.length - 1; i >= 0; i--) {
      const n = this.notes[i];
      if (!n.judged && this.elapsed - n.time > MISS_MS) {
        n.judged = true;
        sfx.play('bad');
        this.setFlash('MISS');
        this.fail();
        if (this.isFinished) return;
      }
      if (this.elapsed - n.time > 600) this.notes.splice(i, 1);
    }
  }

  protected draw(): void {
    const c = this.ctx;
    c.fillStyle = ARCADE.bg;
    c.fillRect(0, 0, this.w, this.h);
    c.strokeStyle = ARCADE.bgSoft;
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(this.w / 2, 0);
    c.lineTo(this.w / 2, this.h);
    c.stroke();
    c.beginPath();
    c.arc(this.w / 2, this.hitY, 34, 0, Math.PI * 2);
    c.strokeStyle = ARCADE.pink;
    c.stroke();
    for (const n of this.notes) {
      if (n.judged) continue;
      const progress = 1 - (n.time - this.elapsed) / TRAVEL_MS;
      if (progress < 0) continue;
      const y = -30 + (this.hitY + 30) * progress;
      c.beginPath();
      c.arc(this.w / 2, y, 22, 0, Math.PI * 2);
      c.fillStyle = ARCADE.green;
      c.fill();
    }
    centerText(c, `${bpmForLevel(this.level)} BPM`, this.w / 2, 60, '14px "Press Start 2P", monospace', ARCADE.dim);
    if (this.elapsed < this.flashUntil) {
      centerText(c, this.flash, this.w / 2, 640, '18px "Press Start 2P", monospace', this.flash === 'PERFECT' ? ARCADE.green : this.flash === 'MISS' ? ARCADE.pink : ARCADE.yellow);
    }
  }
}
```

- [ ] **Step 6: Daftarkan di registry**

Entri `GAMES`:

```ts
  {
    id: 'beat-tap',
    category: 'rhythm',
    icon: 'music',
    accent: 'coral',
    name: { id: 'Ketuk Beat', en: 'Beat Tap' },
    tagline: { id: 'Tap pas di ringnya. Rasakan iramanya.', en: 'Tap right on the ring. Feel the beat.' },
    howTo: {
      id: 'Tap layar (atau spasi) tepat saat nada menyentuh ring. Nada lolos = nyawa hilang.',
      en: 'Tap (or press space) exactly when a note hits the ring. Missed notes cost a life.',
    },
  },
```

Loader:

```ts
  'beat-tap': () => import('./beat-tap/engine').then((m) => new m.BeatTapEngine()),
```

- [ ] **Step 7: Playtest** — `/play/beat-tap`: nada turun mengikuti tempo, timing dinilai perfect/good, nada lolos mengurangi nyawa, BPM naik seiring level.

- [ ] **Step 8: Commit**

```bash
git add src/games/beat-tap src/games/registry.ts
git commit -m "feat: game Ketuk Beat (ritme)"
```

---

## Fase 5 — Fitur retensi & polish

### Task 20: Daily core (deterministik)

**Files:**
- Modify: `src/core/daily.ts`
- Create: `src/core/daily.test.ts`

- [ ] **Step 1: Failing test**

`src/core/daily.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { dailyLineup, dailySeed, stageSeed, todayKey } from './daily';

const IDS = [
  'tap-panic', 'bubble-sniper', 'simon', 'missing-number',
  'word-scramble', 'quick-math', 'dodge', 'beat-tap',
] as const;

describe('daily', () => {
  it('todayKey format YYYY-MM-DD', () => {
    expect(todayKey(new Date(2026, 6, 9))).toBe('2026-07-09');
    expect(todayKey(new Date(2026, 0, 1))).toBe('2026-01-01');
  });
  it('lineup: 5 game unik dari daftar, deterministik per tanggal', () => {
    const a = dailyLineup('2026-07-09', IDS);
    const b = dailyLineup('2026-07-09', IDS);
    expect(a).toEqual(b);
    expect(a.length).toBe(5);
    expect(new Set(a).size).toBe(5);
    for (const id of a) expect(IDS).toContain(id);
  });
  it('tanggal beda memberi seed beda', () => {
    expect(dailySeed('2026-07-09')).not.toBe(dailySeed('2026-07-10'));
  });
  it('stageSeed beda per index dan per tanggal', () => {
    expect(stageSeed('2026-07-09', 0)).not.toBe(stageSeed('2026-07-09', 1));
    expect(stageSeed('2026-07-09', 0)).not.toBe(stageSeed('2026-07-10', 0));
    expect(stageSeed('2026-07-09', 2)).toBe(stageSeed('2026-07-09', 2));
  });
});
```

- [ ] **Step 2: Run test — FAIL** (`npm test` — fungsi selain `todayKey` belum ada)

- [ ] **Step 3: Lengkapi implementasi**

Ganti `src/core/daily.ts`:

```ts
import { hashString, mulberry32, seededShuffle } from './rng';

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function dailySeed(key: string): number {
  return hashString(`ihnttd:${key}`);
}

export function dailyLineup<T extends string>(key: string, allIds: readonly T[], count = 5): T[] {
  return seededShuffle(allIds, mulberry32(dailySeed(key))).slice(0, count);
}

export function stageSeed(key: string, index: number): number {
  return hashString(`${key}#${index}`);
}
```

- [ ] **Step 4: Run test — PASS** (`npm test`)

- [ ] **Step 5: Commit**

```bash
git add src/core/daily.ts src/core/daily.test.ts
git commit -m "feat: daily lineup deterministik (seed tanggal)"
```

### Task 21: Landing page final

**Files:**
- Modify: `src/pages/Home.tsx`, `src/pages/Play.tsx`

- [ ] **Step 1: Home final**

Ganti `src/pages/Home.tsx`:

```tsx
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Header } from '../components/Header';
import { Mascot } from '../components/Mascot';
import { ChunkyButton } from '../components/ChunkyButton';
import { GameCard } from '../components/GameCard';
import { GAMES } from '../games/registry';
import { dailyLineup, todayKey } from '../core/daily';
import { sfx } from '../core/sound';
import { useI18n } from '../i18n';

export default function Home() {
  const { t, locale } = useI18n();
  const nav = useNavigate();
  const lineupNames = useMemo(() => {
    const ids = dailyLineup(todayKey(), GAMES.map((g) => g.id));
    return ids.map((id) => GAMES.find((g) => g.id === id)?.name[locale]).filter(Boolean).join(' · ');
  }, [locale]);

  const roulette = () => {
    sfx.unlock();
    sfx.play('coin');
    nav(`/play/${GAMES[Math.floor(Math.random() * GAMES.length)].id}`);
  };

  return (
    <div className="min-h-dvh">
      <Header />
      <main className="mx-auto max-w-3xl px-5 pb-16">
        <section className="flex flex-col items-center text-center pt-6 pb-12">
          <Mascot expression="happy" size={110} />
          <p className="mt-3 font-bold text-ink-soft">{t('site.tagline')}</p>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className="mt-6"
          >
            <ChunkyButton size="xl" color="coral" onClick={roulette}>
              {t('home.bored')}
            </ChunkyButton>
          </motion.div>
          <p className="mt-3 text-sm text-ink-soft">{t('home.bored.sub')}</p>
        </section>

        <section className="rounded-3xl border-[3px] border-ink bg-teal p-6 text-cream shadow-[0_6px_0_0_var(--color-ink)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-pixel text-[10px] opacity-80">{todayKey()}</p>
              <h2 className="mt-1 font-display text-2xl">{t('home.daily.title')}</h2>
              <p className="mt-1 max-w-sm text-sm opacity-90">{t('home.daily.sub')}</p>
              <p className="mt-2 text-xs font-bold opacity-80">{lineupNames}</p>
            </div>
            <ChunkyButton color="amber" size="lg" onClick={() => nav('/daily')}>
              {t('home.daily.cta')}
            </ChunkyButton>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 font-display text-2xl">{t('home.grid.title')}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {GAMES.map((meta, i) => (
              <motion.div
                key={meta.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <GameCard meta={meta} />
              </motion.div>
            ))}
          </div>
        </section>

        <footer className="mt-14 text-center text-sm text-ink-soft">{t('home.footer')}</footer>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Tampilkan cara main di halaman Play**

Di `src/pages/Play.tsx`, tepat setelah `<GameShell ... />` (di dalam cabang `else`), bungkus dengan fragment dan tambahkan:

```tsx
        <>
          <GameShell
            key={runId}
            gameId={meta.id as GameId}
            seed={seed}
            startLives={5}
            onFinish={onFinish}
            onQuit={() => nav('/')}
          />
          <p className="mx-auto max-w-md px-6 pb-8 pt-3 text-center text-sm text-ink-soft">
            {meta.howTo[locale]}
          </p>
        </>
```

- [ ] **Step 3: Verifikasi + commit**

Run: `npm run dev` — landing: tombol raksasa melempar ke game acak; kartu daily menampilkan 5 nama game hari ini; grid 8 game jalan; toggle ID/EN mengganti semua teks.

```bash
git add src/pages/Home.tsx src/pages/Play.tsx
git commit -m "feat: landing page (roulette, kartu daily, grid game)"
```

### Task 22: Daily Gauntlet

**Files:**
- Modify: `src/pages/Daily.tsx`

Aturan: 5 stage dari `dailyLineup(todayKey())`, tiap stage `roundMs = 45_000`, nyawa dibawa antar stage (`startLives = sisa`), skor akhir = jumlah. `endReason === 'lives'` menghentikan gauntlet lebih awal.

- [ ] **Step 1: Implementasi**

Ganti `src/pages/Daily.tsx`:

```tsx
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Header } from '../components/Header';
import { ChunkyButton } from '../components/ChunkyButton';
import { LivesBar } from '../components/LivesBar';
import { Mascot } from '../components/Mascot';
import { GameShell } from '../shell/GameShell';
import { GameOver } from '../shell/GameOver';
import { GAMES } from '../games/registry';
import { dailyLineup, stageSeed, todayKey } from '../core/daily';
import type { GameId, GameResult } from '../games/types';
import { useI18n } from '../i18n';

const ROUND_MS = 45_000;

type Phase =
  | { kind: 'intro' }
  | { kind: 'interlude'; stage: number }
  | { kind: 'playing'; stage: number }
  | { kind: 'done'; failed: boolean };

interface StageResult {
  name: string;
  score: number;
}

export default function Daily() {
  const { t, locale } = useI18n();
  const nav = useNavigate();
  const dateKey = todayKey();
  const [runId, setRunId] = useState(0);
  const [phase, setPhase] = useState<Phase>({ kind: 'intro' });
  const [lives, setLives] = useState(5);
  const [results, setResults] = useState<StageResult[]>([]);
  const [bestCombo, setBestCombo] = useState(0);
  const [durationMs, setDurationMs] = useState(0);

  const lineup = useMemo(
    () => dailyLineup(dateKey, GAMES.map((g) => g.id)) as GameId[],
    [dateKey],
  );
  const metaAt = (stage: number) => GAMES.find((g) => g.id === lineup[stage])!;

  const reset = () => {
    setPhase({ kind: 'intro' });
    setLives(5);
    setResults([]);
    setBestCombo(0);
    setDurationMs(0);
    setRunId((r) => r + 1);
  };

  const onStageFinish = (stage: number) => (r: GameResult) => {
    const entry = { name: metaAt(stage).name[locale], score: r.score };
    setResults((prev) => [...prev, entry]);
    setBestCombo((b) => Math.max(b, r.bestCombo));
    setDurationMs((d) => d + r.durationMs);
    setLives(r.livesLeft);
    if (r.endReason === 'lives') setPhase({ kind: 'done', failed: true });
    else if (stage + 1 >= lineup.length) setPhase({ kind: 'done', failed: false });
    else setPhase({ kind: 'interlude', stage: stage + 1 });
  };

  return (
    <div className="min-h-dvh">
      <Header />

      {phase.kind === 'intro' && (
        <main className="mx-auto flex max-w-md flex-col items-center px-6 pt-6 text-center">
          <p className="font-pixel text-[10px] text-ink-soft">{dateKey}</p>
          <h1 className="mt-2 font-display text-4xl">{t('daily.title')}</h1>
          <p className="mt-2 text-sm text-ink-soft">{t('home.daily.sub')}</p>
          <ol className="mt-6 w-full space-y-2">
            {lineup.map((id, i) => (
              <motion.li
                key={id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-xl border-[3px] border-ink bg-paper px-4 py-2 text-left font-bold"
              >
                {i + 1}. {metaAt(i).name[locale]}
              </motion.li>
            ))}
          </ol>
          <div className="mt-6">
            <LivesBar lives={lives} />
          </div>
          <div className="mt-6">
            <ChunkyButton size="lg" color="coral" onClick={() => setPhase({ kind: 'playing', stage: 0 })}>
              {t('home.daily.cta')}
            </ChunkyButton>
          </div>
        </main>
      )}

      {phase.kind === 'interlude' && (
        <main className="mx-auto flex max-w-md flex-col items-center px-6 pt-10 text-center">
          <Mascot expression="hype" size={100} />
          <p className="mt-4 font-pixel text-[10px] text-ink-soft">
            {t('daily.stage', { n: phase.stage + 1 })}
          </p>
          <h2 className="mt-2 font-display text-3xl">{metaAt(phase.stage).name[locale]}</h2>
          <p className="mt-2 text-sm text-ink-soft">{metaAt(phase.stage).howTo[locale]}</p>
          <p className="mt-5 text-xs font-bold uppercase tracking-wider text-ink-soft">{t('daily.livesLeft')}</p>
          <div className="mt-1">
            <LivesBar lives={lives} />
          </div>
          <div className="mt-6">
            <ChunkyButton size="lg" color="teal" onClick={() => setPhase({ kind: 'playing', stage: phase.stage })}>
              {t('daily.next')}
            </ChunkyButton>
          </div>
        </main>
      )}

      {phase.kind === 'playing' && (
        <>
          <p className="pb-1 text-center font-pixel text-[10px] text-ink-soft">
            {t('daily.stage', { n: phase.stage + 1 })} — {metaAt(phase.stage).name[locale]}
          </p>
          <GameShell
            key={`${runId}:${phase.stage}`}
            gameId={lineup[phase.stage]}
            seed={stageSeed(dateKey, phase.stage)}
            startLives={lives}
            roundMs={ROUND_MS}
            onFinish={onStageFinish(phase.stage)}
            onQuit={() => nav('/')}
          />
        </>
      )}

      {phase.kind === 'done' && (
        <GameOver
          mode="daily"
          heading={phase.failed ? t('daily.fail') : t('daily.clear')}
          entries={results}
          totalScore={results.reduce((s, e) => s + e.score, 0)}
          bestCombo={bestCombo}
          levelReached={results.length}
          durationMs={durationMs}
          dateKey={dateKey}
          sessionBest={false}
          primaryLabel={t('over.playAgain')}
          onPrimary={reset}
          onHome={() => nav('/')}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Playtest**

Run: `npm run dev`, buka `/daily`. Checklist: intro menampilkan 5 game hari ini → tiap stage maksimum 45 detik → nyawa dibawa antar stage → nyawa habis di stage mana pun mengakhiri gauntlet → selesai 5 stage menampilkan `daily.clear` + receipt berisi 5 baris skor + total → dua run di tanggal sama menghasilkan urutan & soal identik (seed deterministik).

- [ ] **Step 3: Commit**

```bash
git add src/pages/Daily.tsx
git commit -m "feat: Daily Gauntlet (5 stage, nyawa dibawa, receipt harian)"
```

### Task 23: Personality & polish

**Files:**
- Create: `src/core/idle.ts`
- Modify: `src/pages/Home.tsx`, `src/pages/NotFound.tsx`, `src/shell/GameOver.tsx`, `src/shell/GameShell.tsx`

- [ ] **Step 1: Hook idle**

`src/core/idle.ts`:

```ts
import { useEffect, useState } from 'react';

export type IdleState = 'awake' | 'yawn' | 'sleep';

export function useIdle(yawnMs = 20_000, sleepMs = 45_000): IdleState {
  const [state, setState] = useState<IdleState>('awake');

  useEffect(() => {
    let last = performance.now();
    const reset = () => {
      last = performance.now();
      setState('awake');
    };
    const events = ['pointerdown', 'pointermove', 'keydown', 'scroll'] as const;
    for (const ev of events) window.addEventListener(ev, reset, { passive: true });
    const iv = setInterval(() => {
      const idle = performance.now() - last;
      setState(idle >= sleepMs ? 'sleep' : idle >= yawnMs ? 'yawn' : 'awake');
    }, 1000);
    return () => {
      for (const ev of events) window.removeEventListener(ev, reset);
      clearInterval(iv);
    };
  }, [yawnMs, sleepMs]);

  return state;
}
```

- [ ] **Step 2: Maskot ikut gabut di Home**

Di `src/pages/Home.tsx`:

Tambah import:

```tsx
import { useEffect } from 'react';
import { useIdle } from '../core/idle';
import type { Expression } from '../components/Mascot';
```

Di dalam komponen `Home`, sebelum `return`:

```tsx
  const idle = useIdle();
  const expression: Expression = idle === 'sleep' ? 'sleep' : idle === 'yawn' ? 'yawn' : 'happy';
  useEffect(() => {
    document.title = idle === 'sleep' ? 'zzz… | ihavenothingtodo' : 'ihavenothingtodo';
    return () => {
      document.title = 'ihavenothingtodo';
    };
  }, [idle]);
```

Ganti `<Mascot expression="happy" size={110} />` menjadi `<Mascot expression={expression} size={110} />`.

- [ ] **Step 3: NotFound final**

Ganti `src/pages/NotFound.tsx`:

```tsx
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
```

- [ ] **Step 4: Confetti saat rekor sesi**

Di `src/shell/GameOver.tsx`, tambahkan komponen di bawah import:

```tsx
function Confetti() {
  const colors = ['#E4572E', '#0FA47F', '#F2A007', '#E0447C'];
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 18 }, (_, i) => (
        <motion.span
          key={i}
          initial={{ y: -24, rotate: 0, opacity: 1 }}
          animate={{ y: '105vh', rotate: 360 + i * 40, opacity: [1, 1, 0.5] }}
          transition={{ duration: 2.2 + (i % 5) * 0.3, ease: 'easeIn' }}
          className="absolute block h-3 w-3"
          style={{ left: `${(i * 100) / 18}vw`, backgroundColor: colors[i % 4] }}
        />
      ))}
    </div>
  );
}
```

dan render `{props.sessionBest && <Confetti />}` sebagai elemen pertama di dalam `motion.div` utama.

- [ ] **Step 5: Maskot kaget saat nyawa hilang (di GameShell)**

Di `src/shell/GameShell.tsx`:

Tambah import:

```tsx
import { Mascot } from '../components/Mascot';
```

Tambah state di dalam komponen:

```tsx
  const [shockUntil, setShockUntil] = useState(0);
```

Di callback `onLifeLost`, setelah `setLives(...)`, tambahkan:

```tsx
            setShockUntil(performance.now() + 800);
```

Ganti elemen `<LivesBar lives={lives} max={startLives} />` di top bar menjadi:

```tsx
        <div className="flex items-center gap-2">
          <Mascot expression={performance.now() < shockUntil ? 'shock' : 'happy'} size={34} />
          <LivesBar lives={lives} max={startLives} />
        </div>
```

(Ekspresi kembali normal pada render berikutnya — perubahan state `lives`/skor memicu re-render cukup sering saat bermain.)

- [ ] **Step 6: Verifikasi reduced-motion**

Run: `npm run dev`, di DevTools aktifkan emulasi `prefers-reduced-motion: reduce` — semua transisi CSS praktis instan (rule global di `global.css`). Cek juga maskot: diamkan Home 20 detik (menguap) lalu 45 detik (tidur + title tab "zzz…"), dan saat main, maskot kecil di HUD kaget ketika nyawa hilang.

- [ ] **Step 7: Commit**

```bash
git add src/core/idle.ts src/pages/Home.tsx src/pages/NotFound.tsx src/shell/GameOver.tsx src/shell/GameShell.tsx
git commit -m "feat: maskot idle + reaksi HUD, 404, confetti rekor sesi"
```

### Task 24: Deploy config, README, verifikasi akhir

**Files:**
- Create: `vercel.json`, `README.md`

- [ ] **Step 1: SPA rewrite**

`vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

(Alternatif Cloudflare Pages: buat `public/_redirects` berisi `/* /index.html 200`.)

- [ ] **Step 2: README**

`README.md`:

```markdown
# ihavenothingtodo

Website arcade untuk yang lagi gabut: 8 mini-game menantang, 5 nyawa,
tanpa akun, tanpa save. Ada Daily Gauntlet (tantangan harian yang sama
untuk semua orang — deterministik dari tanggal, tanpa server) dan
Boredom Receipt (skor bisa diunduh sebagai struk PNG).

## Development

- `npm run dev` — dev server
- `npm test` — unit test (Vitest)
- `npm run build` — typecheck + build statis ke `dist/`

## Deploy

Build statis murni. Vercel: langsung (ada `vercel.json` untuk SPA
rewrite). Cloudflare Pages: tambahkan `public/_redirects` berisi
`/* /index.html 200`.

Spec & plan: `docs/superpowers/`.
```

- [ ] **Step 3: Verifikasi penuh**

```bash
npm test
npm run build
npm run preview
```

Expected: test PASS semua, build exit 0. Di preview, jalani checklist akhir:
1. Landing → roulette → main → game over → unduh receipt (PNG berisi skor & gelar).
2. `/daily` → 5 stage → receipt harian berisi 5 baris + total.
3. Toggle ID/EN mengganti seluruh teks; reload mempertahankan pilihan bahasa.
4. Mute mematikan semua bunyi; reload mempertahankan mute.
5. Mobile viewport (DevTools): semua game playable via sentuhan; area game tidak men-scroll halaman.
6. Keyboard: quick-math (←/→), simon (1-4), missing-number (1-3), word-scramble (ketik), dodge (←/→), beat-tap (spasi).
7. Pindah tab saat main → otomatis pause; kembali → resume via tombol.
8. Refresh saat main memunculkan konfirmasi browser.

- [ ] **Step 4: Commit**

```bash
git add vercel.json README.md
git commit -m "chore: deploy config + README"
```

---

## Catatan untuk eksekutor

- Kode di plan ini adalah titik mulai yang presisi, bukan kitab suci — bila test/typecheck menemukan ketidakcocokan kecil (mis. nama API Motion versi terbaru), perbaiki di tempat dan pertahankan kontrak antar-modul (`types.ts`, `BaseEngine`, registry).
- Angka keseimbangan game (kecepatan, floor, poin) boleh di-tune saat playtest; test kurva menguji arah & batas, bukan angka keramat — bila menyetel angka, perbarui test-nya sekalian.
- Jangan menambah dependency di luar daftar Task 1 tanpa alasan kuat.
- Semua UI baru harus memakai token warna/font dari `global.css` — jangan hardcode hex baru di komponen (kecuali palet ARCADE di canvas).


