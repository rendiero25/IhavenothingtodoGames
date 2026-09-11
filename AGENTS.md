# AGENTS.md

Panduan kerja untuk repository `ihavenothingtodo`.

## Product

`ihavenothingtodo` adalah arcade mini-game client-side untuk pelajar, pekerja,
dan pengguna kasual yang ingin langsung bermain saat jeda singkat.

Prinsip produk:

- Game selalu menjadi fokus utama.
- Satu klik harus cukup untuk mulai bermain.
- Tidak ada akun, onboarding, backend, database, leaderboard, iklan, atau
  penyimpanan progres.
- Mobile harus linear, jelas, dan bebas horizontal overflow.
- Informasi pendukung membantu memilih game, bukan menghalangi permainan.

## Current visual system

Implementasi UI saat ini memakai arah yang lebih tenang dan monochrome daripada
spec awal playful-pop. Jika dokumentasi lama berbeda dengan source aktif, ikuti
source aktif dan perubahan user terbaru.

- Latar: dark paper dengan tinta putih/off-white berbasis OKLCH.
- Palette utama: hitam dan putih; jangan menambah warna dekoratif tanpa alasan
  produk yang jelas.
- Font: `Geist` untuk display/body, `Geist Mono` untuk metadata, dan
  `Geist Pixel` untuk judul game.
- Hindari gradient, glassmorphism, shadow dekoratif, layout SaaS generik, dan
  garis divider tambahan. Garis utama hanya berada di bawah header.
- Gunakan target sentuh minimal 44px, focus state yang terlihat, semantik HTML,
  dan dukungan `prefers-reduced-motion`.

## Application structure

```text
src/
  components/  # Header, GameCard, GameModal, shared UI
  core/        # RNG, score, daily mode, sound, receipts
  games/       # registry, shared canvas helpers, one engine per game
  i18n/        # typed ID/EN dictionaries and tests
  pages/       # Home, Play, Daily, NotFound
  shell/       # GameShell HUD/lifecycle and GameOver
  styles/      # Tailwind entry and global tokens
```

Routes:

- `/` home arcade hub: wheel game selector, filters, preview, random game.
- `/play/:gameId` free play.
- `/daily` deterministic Daily Gauntlet.
- unknown routes redirect to the home experience.

## Game architecture

Every game implements `GameEngine` from `src/games/types.ts`:

```ts
interface GameEngine {
  init(canvas: HTMLCanvasElement, opts: GameOptions): void;
  start(): void;
  pause(): void;
  resume(): void;
  destroy(): void;
}
```

- Add or edit game metadata in `src/games/registry.ts`.
- Keep game engines lazy-loaded through the registry loader map.
- Keep the frame loop in vanilla TypeScript/canvas or Three.js. React owns
  shell state and HUD state, not per-frame drawing.
- `BaseEngine` uses a logical 480x720 canvas for portrait mini-games. Preserve
  pointer coordinate conversion when changing canvas presentation styles.
- Arena FPS owns its own WebGL renderer and resizes from the canvas client
  bounds. Do not duplicate its render loop in React.
- Clean up engine listeners, timers, animation frames, WebGL resources, and
  pointer-lock state in `destroy()` or the engine lifecycle helper.

## Responsive game viewport

The game screen presentation is responsive by device width:

- Mobile: portrait `2:3`.
- Tablet (`md`): fluid `4:3`.
- Desktop (`lg`): landscape `16:9`.

The responsive aspect classes live in `src/shell/GameShell.tsx`. Keep the shell
width responsive as well: narrow on mobile, wider on tablet, and up to the
desktop max width. The modal and standalone play route must use the same shell
rules.

When changing canvas sizing:

- Keep `w-full`, touch interaction, and an explicit aspect ratio.
- Test pointer/touch hit areas at mobile width and resize transitions.
- Keep the center playfield readable; HUD overlays must not cover critical
  controls.
- Preserve pause on `visibilitychange` and the reduced-motion behavior.

## Home experience

- `Home.tsx` owns filtering, preview selection, random launch, and modal state.
- `GameCard` is a keyboard-accessible button. Hover/focus updates the preview;
  click launches the game modal.
- The left list is a clipped wheel scroller with the selected item centered and
  nearby rows scaled/rotated by distance.
- The right preview contains title and descriptive copy only. Keep it centered
  as a panel while allowing the copy alignment to follow the latest user
  request.
- The root home layout uses `h-dvh`; header, main content, and footer must be
  visible without forcing the document into unintended horizontal overflow.
- Footer includes the plain Ko-fi link `https://ko-fi.com/rendiero` with the
  label `Buy me a Coffee`, opened in a new tab with
  `rel="noopener noreferrer"`. Do not load the Ko-fi widget script or add
  credentials/webhooks.

## i18n

- Add every user-facing string to both dictionaries in `src/i18n/dict.ts`.
- Keep the key sets identical; `src/i18n/dict.test.ts` enforces this.
- Preserve ID/EN behavior and do not hard-code copy in shared components unless
  the string is intentionally identical in both locales.

## Verification

Run from the repository root on Windows:

```powershell
npm.cmd test -- --run
npm.cmd run build
```

`npm.cmd run build` performs TypeScript checking and the Vite production build.
Existing chunk-size warnings are informational; new TypeScript, bundler, or
runtime errors must be fixed.

Before handoff:

```powershell
git -c safe.directory=G:/WebsiteDevelopment/IhavenothingtodoWebsite diff --check
git -c safe.directory=G:/WebsiteDevelopment/IhavenothingtodoWebsite status -sb
```

Keep the `development` branch clean after commit. Use focused commits with
clear messages and push only the intended files.

## Change boundaries

- Prefer the smallest change that satisfies the user request.
- Preserve existing game mechanics and deterministic Daily behavior.
- Do not introduce a backend, account system, analytics, or new dependency for
  a UI-only request.
- Use `apply_patch` for source/document edits.
- Update tests when changing contracts, i18n keys, lifecycle behavior, or game
  logic.
- Read the relevant component and its tests before changing shared shell code.
