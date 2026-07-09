# ihavenothingtodo — Design Spec

Tanggal: 2026-07-09
Status: Disetujui user (brainstorming session)

## Ringkasan

Website arcade berisi mini-game untuk mengisi waktu kosong. Murni statis (tanpa
backend), sistem 5 nyawa, tidak menyimpan progres, skor bisa di-download sebagai
"Boredom Receipt". Dua fondasi retensi: tombol Boredom Roulette (langsung main
game acak) dan Daily Gauntlet (tantangan harian deterministik ala Wordle).

## Keputusan produk

| Keputusan | Pilihan |
|---|---|
| Konsep inti | Arcade hub + Daily Gauntlet |
| Backend | Tidak ada — 100% client-side, share-card saja |
| Jumlah game rilis pertama | 8 game, satu per kategori |
| Gaya visual | Playful pop (shell) + retro arcade (layar game), anti AI-slop |
| Bahasa | Dua bahasa, toggle ID/EN, default ikut bahasa browser |
| Stack | Vite + React + TypeScript + Tailwind v4, game di canvas vanilla TS |

## 1. Konsep & alur pengalaman

### Landing page
- Hero: satu tombol raksasa **"aku gabut" / "i'm bored"** → Boredom Roulette,
  langsung membuka game acak tanpa memilih.
- Di bawah hero: kartu **Daily Gauntlet** (tantangan hari ini + status) dan
  **grid 8 game** dengan label kategori.

### Free play
1. User memilih game dari grid (atau dilempar roulette).
2. Main dengan 5 nyawa; 1 kesalahan = 1 nyawa hilang.
3. Game over → layar hasil: skor, statistik, gelar lucu.
4. Opsi: download/share Boredom Receipt, main lagi (mulai dari nol), ganti game.

### Daily Gauntlet
- Setiap hari, 5 dari 8 game dipilih dan diurutkan lewat RNG deterministik
  dengan seed dari tanggal lokal (format `YYYY-MM-DD`).
- Semua pengunjung di tanggal yang sama mendapat rangkaian dan tantangan yang
  identik — tanpa server.
- 5 nyawa berlaku untuk seluruh rangkaian (bukan per game).
- Skor tiap game digabung menjadi skor akhir + share-card khusus harian
  (menampilkan tanggal, agar teman bisa membandingkan hari yang sama).
- Selesai/gagal → bisa diulang kapan saja (tidak ada penguncian "sudah main
  hari ini", karena tidak ada penyimpanan).

### Boredom Receipt
- Gambar struk kasir retro yang di-generate via offscreen canvas → PNG.
- Isi: nama situs, mode (free play / daily), nama game, skor, statistik singkat
  (akurasi, combo terbaik, level tercapai), "waktu berhasil dibuang: X menit",
  gelar berdasar performa, tanggal.
- Gelar dua bahasa, bertingkat berdasarkan skor (contoh ID: "Baru Belajar
  Gabut" → "Gabut Profesional" → "Suhu Gabut Nasional"; EN: "Boredom Intern" →
  "Certified Time Waster" → "Grandmaster of Nothing").
- Aksi: download PNG, share via Web Share API (fallback: download saja).

### Kepribadian situs
- Maskot blob sederhana (SVG) di landing page: idle lama → menguap/tertidur,
  title tab berubah "zzz…"; saat main: kaget saat nyawa hilang, heboh saat
  rekor sesi baru.
- Microcopy bernada bercanda soal gabut, aman semua umur, tersedia ID & EN.

### Yang sengaja TIDAK ada (YAGNI)
Akun, login, backend, database, leaderboard online, ads, analytics/tracking,
penyimpanan progres. Satu-satunya persistensi: preferensi bahasa dan mute di
`localStorage`.

## 2. Delapan game

Kontrak umum semua game:
- Mulai mudah, kesulitan menanjak terus (kecepatan/kompleksitas) — tidak ada
  akhir; game selalu berakhir karena nyawa habis.
- 1 kesalahan = 1 nyawa. Skor + sistem combo untuk permainan tanpa salah.
- Playable penuh via sentuhan (mobile) dan keyboard/mouse (desktop).
- Menerima seed RNG (untuk Daily Gauntlet yang identik antar pengunjung).

| # | Kategori | Nama kerja | Mekanik | Kontrol |
|---|---|---|---|---|
| 1 | Refleks | Tap Panic | Target muncul lalu mengecil; tap sebelum hilang. Tempo naik, target jebakan muncul di level tinggi. | Tap / klik |
| 2 | Aim | Bubble Sniper | Bidik target bergerak; umpan jebakan tidak boleh kena. Gerakan makin cepat & kecil. | Tap / klik |
| 3 | Memori | Simon Gabut | Urutan pola warna+nada yang memanjang; ulangi dengan benar. | Tap / klik / angka keyboard |
| 4 | Logika | Angka Hilang | Deret/pola angka, isi yang hilang; timer per soal makin pendek. | Tap pilihan / keyboard |
| 5 | Kata | Kata Acak | Susun huruf acak jadi kata; kamus mengikuti bahasa aktif (ID/EN). | Tap huruf / ketik |
| 6 | Matematika | Hitung Kilat | Pernyataan aritmetika benar/salah beruntun melawan waktu. | Tap kiri-kanan / panah keyboard |
| 7 | Ketangkasan | Dodge! | Kendalikan karakter menghindari rintangan yang makin rapat. | Drag-sentuh / panah keyboard |
| 8 | Ritme | Ketuk Beat | Tap mengikuti irama yang di-generate; pola makin rumit. | Tap / spasi |

Nama final game (dan padanan EN-nya) digodok saat implementasi; nama di atas
adalah nama kerja.

## 3. Arsitektur

### Stack
- Vite + React + TypeScript, Tailwind CSS v4.
- Animasi UI shell: Motion (Framer Motion). Game loop: `requestAnimationFrame`
  di canvas, vanilla TS — React tidak menyentuh frame loop.
- Vitest untuk unit test.

### Kontrak GameEngine
Setiap game adalah modul yang mengimplementasikan interface yang sama:

```ts
interface GameEngine {
  init(canvas: HTMLCanvasElement, opts: GameOptions): void;
  start(): void;
  pause(): void;
  resume(): void;
  destroy(): void;
}

interface GameOptions {
  seed: number;              // RNG deterministik
  locale: 'id' | 'en';       // untuk game berbasis kata/angka
  callbacks: {
    onScore(points: number, combo: number): void;
    onLifeLost(): void;
    onGameOver(result: GameResult): void;
  };
}

interface GameResult {
  score: number;
  bestCombo: number;
  levelReached: number;
  durationMs: number;
  stats: Record<string, number>; // statistik spesifik game utk receipt
}
```

Shell React menyediakan: HUD (nyawa hati, skor, combo), overlay pause,
countdown mulai, alur game-over, dan transisi "coin drop" masuk/keluar arcade.
Menambah game baru = menambah satu modul + satu entri registry.

### Registry game
Satu file registry berisi metadata semua game: id, nama (ID/EN), kategori,
ikon, deskripsi singkat, cara main, dan referensi modul engine (lazy-loaded
per game via dynamic import agar bundle awal kecil).

### RNG & Daily Gauntlet
- `mulberry32` (PRNG sederhana, deterministik, cukup untuk game).
- Seed harian: hash dari string tanggal lokal `YYYY-MM-DD`.
- Pemilihan gauntlet: shuffle deterministik daftar 8 game dengan seed harian,
  ambil 5 pertama. Setiap game menerima sub-seed turunan.

### i18n
- Dictionary TS: `{ id: {...}, en: {...} }`, diketik ketat supaya key yang
  hilang jadi error compile.
- Default bahasa: `navigator.language` (id-* → ID, selainnya EN).
- Toggle di header; pilihan disimpan di `localStorage`.

### Routing
- `/` — landing (hero roulette, kartu daily, grid game).
- `/play/:gameId` — free play.
- `/daily` — Daily Gauntlet.
- 404 → redirect ke landing dengan pesan bercanda.

### Deploy
Build statis (`vite build`) → Vercel atau Cloudflare Pages. Tidak ada env var,
tidak ada API.

## 4. Desain visual & UX

### Prinsip anti AI-slop
Tidak memakai: gradien ungu/biru generik, glassmorphism, kartu bertumpuk
dalam kartu, emoji sebagai ikon, font default tanpa karakter, hero tiga kolom
template. Setiap keputusan visual harus punya alasan dari konsep "gabut/arcade".

### Shell situs — playful pop
- Latar krem hangat, teks tinta gelap; aksen coral, teal, amber, pink.
- Tombol chunky: border tebal + hard shadow offset (bukan blur); saat ditekan,
  tombol benar-benar "turun" (translate + shadow mengecil).
- Font display berkarakter (dipilih saat implementasi, mis. kelas Bricolage
  Grotesque/Lilita One) + font body yang sangat terbaca untuk semua umur.
- Maskot blob SVG dengan beberapa ekspresi (netral, menguap, kaget, senang).

### Layar game — retro arcade
- Panel game gelap (navy pekat) dengan aksen neon-flat (pink, hijau, kuning,
  biru) dan font pixel/mono untuk angka skor.
- Transisi masuk game = momen "coin drop"; keluar = "cabinet off".
- HUD: 5 hati; kehilangan nyawa → hati pecah beranimasi + getar halus layar.

### Motion & feel
- Spring/bounce untuk elemen UI; stagger pada grid game saat load.
- Perayaan (confetti canvas ringan) saat rekor sesi baru.
- Seluruh animasi menghormati `prefers-reduced-motion` (fallback: fade
  sederhana, tanpa getar).

### Suara
- SFX bleep-blop pendek di-generate via WebAudio API (tanpa file audio):
  tap, benar, salah, nyawa hilang, game over, rekor.
- Tombol mute jelas di HUD dan header; preferensi disimpan di `localStorage`.
- Audio baru diinisialisasi setelah gesture pertama user (kebijakan autoplay
  browser).

### Aksesibilitas
- Target sentuh minimal 44×44 px; kontras teks minimal AA.
- Sinyal benar/salah tidak bergantung warna saja (ikon/bentuk/gerak).
- Navigasi shell penuh via keyboard; semua game punya skema keyboard.
- Bahasa sederhana yang dipahami segala umur.

## 5. Edge case & penanganan error

- `visibilitychange` → game otomatis pause; tidak ada nyawa hilang saat tab
  tidak terlihat.
- Saat run aktif, `beforeunload` memunculkan konfirmasi ("run kamu akan
  hilang").
- Resize/rotasi: canvas menyesuaikan; saat main di mobile, scroll,
  pinch-zoom, dan pull-to-refresh dinonaktifkan pada area game.
- Kamus kata & bank soal cukup besar agar sesi berulang tidak terasa sama;
  di luar Daily Gauntlet, seed diambil dari waktu mulai run.
- Jika `localStorage` tidak tersedia (mode private ketat), situs tetap jalan —
  preferensi hanya bertahan selama sesi.

## 6. Testing

- **Unit (Vitest)**:
  - Determinisme: seed sama → urutan gauntlet & nilai RNG sama.
  - Pemilihan Daily Gauntlet: selalu 5 game unik dari 8.
  - Skor/combo/gelar: batas tingkat gelar benar.
  - i18n: setiap key ada di ID dan EN (test kelengkapan otomatis).
  - Logika inti tiap game (spawn, penilaian benar/salah) diuji tanpa canvas —
    logika dipisah dari rendering.
- **Manual playtest checklist per game**: touch di mobile, keyboard di
  desktop, resize, reduced-motion, mute, pause/resume, alur game-over lengkap
  sampai download receipt.

## Fase implementasi (gambaran kasar)

1. Fondasi: scaffold proyek, design system (token, tombol, font), i18n, routing.
2. Shell game: HUD, sistem nyawa, pause, alur game-over, kontrak GameEngine.
3. Game gelombang 1 (4 game) + Boredom Receipt.
4. Game gelombang 2 (4 game) + Daily Gauntlet + Boredom Roulette.
5. Polish: maskot & personality, SFX, animasi transisi, aksesibilitas, deploy.

Rincian menjadi tugas per langkah disusun di implementation plan terpisah.
