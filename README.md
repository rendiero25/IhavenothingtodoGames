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

Build statis menghasilkan halaman crawlable untuk setiap route publik, `404.html`,
`robots.txt`, dan sitemap. Canonical default adalah `https://ihavenothingtodo.xyz`.
Salin `.env.example` menjadi `.env.production` hanya bila domain produksi pindah, lalu
set nilai sama di environment produksi Vercel. Nilai harus origin final, tanpa path
route atau URL preview.

Vercel: deploy langsung. Jangan tambah catch-all SPA rewrite atau `_redirects`
fallback; route publik sudah dibuat sebagai file statis dan URL tak dikenal harus
tetap memberi HTTP 404.

Spec & plan: `docs/superpowers/`.
