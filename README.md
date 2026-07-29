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
