# Below the Surface — Education Scroll Experience

Tanggal: 2026-08-05
Status: desain disetujui dalam sesi brainstorming; menunggu review spec tertulis
Route: `/education/below-the-surface`

## Ringkasan

`Below the Surface` adalah halaman edukasi interaktif tentang dunia di bawah
permukaan bumi. Pengguna turun secara vertikal dari permukaan tanah menuju
inti bumi. Sepanjang perjalanan, halaman memperlihatkan gabungan kehidupan,
aktivitas manusia, teknologi, geologi, serta perbandingan skala yang membantu
pengguna memahami kedalaman.

Pengalaman mengambil pola umum dari halaman edukasi scroll seperti [The Deep
Sea](https://neal.fun/deep-sea/): satu sumbu perjalanan, objek dan fakta yang
muncul bertahap, lalu titik akhir yang memberi perspektif. Visual, copy, data,
dan susunan halaman dibuat mandiri untuk tema bumi.

Tujuan utama: satu perpindahan scroll menghasilkan satu penemuan edukatif yang
jelas, menarik, dan mudah diingat.

## Tujuan

- Menjelaskan lapisan dan kedalaman bumi melalui perjalanan visual.
- Menghubungkan angka kedalaman dengan benda yang mudah dibayangkan.
- Menggabungkan kategori `LIFE`, `HUMAN`, `GEOLOGY`, dan `TECH` tanpa
  membuat halaman terasa seperti dashboard.
- Menjaga pengalaman sederhana, client-side, cepat, responsif, dan nyaman di
  mobile.
- Memastikan setiap fakta memiliki sumber yang dapat dibuka pengguna.

## Bukan tujuan

- Menjadi buku teks geologi lengkap.
- Membuat simulasi fisika bumi atau model 3D presisi.
- Menambahkan akun, backend, database, leaderboard, analytics, atau iklan.
- Menambahkan kuis wajib sebelum pengguna dapat melanjutkan.
- Mengubah mekanik game arcade yang sudah ada.

## Pengalaman pengguna

### 1. Opening

Halaman dibuka dengan judul `Below the Surface` dan copy pendek tentang dunia
di bawah kaki manusia. Opening langsung memperlihatkan garis depth ruler dan
lapisan pertama sehingga pengguna memahami bahwa scroll adalah alat navigasi.

### 2. Surface

Perjalanan dimulai dari permukaan: tanah, akar, organisme kecil, dan air.
Objek utama pertama tampil sebagai pengantar bahwa ruang yang terlihat sehari-
hari hanya bagian tipis dari bumi.

### 3. Vertical descent

Scroll membawa pengguna melewati titik-titik kedalaman yang berurutan. Depth
ruler tetap menjadi referensi utama. Lapisan bumi berubah secara perlahan,
sementara objek dan fakta aktif berganti pada titik yang relevan.

### 4. Discovery stops

Setiap stop menampilkan:

- satu objek utama;
- kedalaman relatif terhadap permukaan;
- satu fakta edukatif utama dalam satu atau dua kalimat;
- perbandingan skala dengan manusia, bangunan, tambang, gunung, atau benda
  lain yang familiar;
- label kategori;
- sumber fakta.

Objek pendukung boleh muncul sebagai detail visual, tetapi tidak boleh
mengubah fokus dari objek utama.

### 5. Deep layers

Bagian bawah memperkenalkan gua, fosil, tambang, pengeboran, kerak, mantel,
inti luar, dan inti dalam. Perubahan suhu, tekanan, material, serta kondisi
kehidupan disampaikan sebagai fakta ringkas, bukan simulasi numerik.

### 6. Ending

Perjalanan berakhir di pusat bumi. Ending menampilkan ringkasan perspektif:
rentang kedalaman, perbedaan kondisi, titik terdalam yang pernah dicapai
manusia, serta satu kesimpulan bahwa permukaan layak huni hanyalah lapisan
yang sangat tipis dibanding ukuran bumi.

## Struktur konten

Dataset awal memiliki minimal 12 discovery stop dan mencakup seluruh kategori
berikut:

- `LIFE`: akar, organisme tanah, hewan bawah tanah, atau kehidupan ekstrem;
- `HUMAN`: fondasi, terowongan, tambang, atau aktivitas manusia;
- `GEOLOGY`: tanah, batuan, fosil, kerak, mantel, dan inti;
- `TECH`: pipa, sensor, pengeboran, atau alat penelitian.

Stop disusun dari kedalaman terkecil ke terbesar. Setiap kategori muncul
minimal dua kali. Dataset mencakup permukaan, zona tanah, air tanah, ruang
bawah tanah buatan, gua atau fosil, tambang atau pengeboran, kerak, mantel,
inti luar, dan inti dalam.

Kontrak data konseptual:

```ts
type EducationCategory = 'life' | 'human' | 'geology' | 'tech';

type EducationLayer =
  | 'surface'
  | 'soil'
  | 'groundwater'
  | 'underground'
  | 'crust'
  | 'mantle'
  | 'core';

interface EducationStop {
  id: string;
  depthMeters: number;
  layer: EducationLayer;
  category: EducationCategory;
  title: { id: string; en: string };
  fact: { id: string; en: string };
  comparison: { id: string; en: string };
  source: { label: string; url: string };
  visual: { kind: string; label: string };
}
```

Aturan dataset:

- `id` unik;
- `depthMeters` selalu naik secara berurutan;
- setiap teks memiliki versi ID dan EN;
- setiap stop memiliki source URL;
- `visual.kind` selalu memiliki renderer atau fallback line-art;
- fakta mengutamakan sumber berotoritas seperti geological survey, museum,
  universitas, USGS, NOAA, atau NASA sesuai topiknya.

## Arah visual

Arah visual menggabungkan dua pendekatan yang dipilih:

### Vertical Expedition

Satu garis vertikal menjadi tulang punggung halaman. Pengguna merasa seperti
turun menggunakan lift penelitian. Titik kedalaman, objek, dan fakta tersusun
di sepanjang garis tersebut.

### Layer Atlas

Lapisan bumi terlihat sebagai strata horizontal yang berubah ketika pengguna
turun. Setiap strata memiliki tekstur dan label sederhana, bukan dekorasi
berlebihan. Informasi tetap terasa seperti atlas yang dapat dipindai.

Komposisi viewport:

- depth ruler sebagai orientasi;
- strata sebagai konteks ruang;
- satu hero object sebagai fokus;
- discovery card untuk fakta dan perbandingan;
- source note sebagai referensi kecil yang selalu dapat dibuka.

Visual mengikuti sistem aktif proyek: dark paper, tinta putih/off-white,
monokrom, tanpa gradient, glassmorphism, atau shadow dekoratif. Perbedaan
lapisan dibuat lewat tekstur, kepadatan, ukuran, dan kontras; informasi tidak
bergantung pada warna saja.

## Motion system

Animasi digerakkan oleh posisi scroll, bukan autoplay yang mengambil alih
navigasi.

Urutan setiap objek:

1. **Dormant** — objek belum terlihat atau berupa siluet tipis.
2. **Reveal** — objek muncul ketika titik kedalaman masuk viewport.
3. **Settle** — objek turun atau bergeser ke posisi kedalamannya.
4. **Idle** — objek melakukan loop kecil selama stop aktif.

Perilaku berdasarkan kategori:

- `LIFE`: napas, goyang, renang, atau drift kecil;
- `HUMAN`: indikator berkedip, roda berputar pelan, atau struktur bergeser;
- `GEOLOGY`: strata bergeser, retakan muncul, atau denyut panas yang sangat
  halus;
- `TECH`: lampu status, sensor, atau garis data bergerak perlahan.

Gerakan tidak boleh mengalahkan teks. Hanya satu hero object yang boleh
memiliki gerakan utama dalam satu viewport. Idle loop bersifat opsional dan
dinonaktifkan atau diperkecil saat `prefers-reduced-motion: reduce` aktif.
Pada reduced motion, reveal dan settle diganti crossfade serta perubahan posisi
minimal.

## Arsitektur teknis

Route baru menggunakan halaman React statis:

- `src/pages/Education.tsx` — entry page dan state stop aktif;
- `src/education/below-the-surface.ts` — dataset typed;
- `src/components/education/DepthJourney.tsx` — orkestrasi scroll journey;
- `src/components/education/DepthRuler.tsx` — indikator kedalaman;
- `src/components/education/LayerBand.tsx` — strata bumi;
- `src/components/education/DiscoveryCard.tsx` — fakta, perbandingan, source;
- `src/components/education/ObjectScene.tsx` — renderer visual dan fallback.

Data flow:

1. `Education.tsx` memuat dataset statis.
2. `DepthJourney` membuat satu section per stop.
3. `IntersectionObserver` mengubah `activeStopId` saat stop memasuki area
   fokus.
4. `DepthRuler`, `LayerBand`, `DiscoveryCard`, dan `ObjectScene` membaca
   stop aktif.
5. CSS transform dan opacity mengatur motion; React tidak menjalankan frame
   loop per detik.

SVG dan CSS menjadi pilihan utama untuk objek ringan. Canvas atau Three.js
tidak diperlukan untuk versi pertama karena halaman membutuhkan ilustrasi
edukatif yang terbaca, bukan simulasi real-time.

## Responsive dan aksesibilitas

Desktop memakai ruler sticky di sisi kiri atau tengah, scene besar di tengah,
dan discovery card di sisi yang berlawanan. Mobile memakai alur satu kolom:
ruler dipadatkan menjadi indikator horizontal atau marker di atas card, lalu
scene dan fakta ditumpuk secara linear.

Persyaratan:

- tidak ada horizontal overflow;
- target sentuh minimal 44px;
- heading dan section memakai struktur semantik;
- semua source berupa link yang dapat difokuskan keyboard;
- stop aktif memiliki `aria-current` atau status aksesibel yang setara;
- fakta aktif tidak diumumkan berulang kali secara mengganggu;
- focus state terlihat;
- `prefers-reduced-motion` dihormati;
- teks tetap tersedia tanpa bergantung pada animasi.

## Fallback dan error handling

- Visual gagal atau belum tersedia: tampilkan line-art sederhana dengan label
  objek.
- Source tidak dapat dimuat: halaman tetap menampilkan fakta statis dan label
  `Source unavailable`.
- Stop tidak valid: dataset test menolaknya; renderer melewati stop tersebut
  tanpa menghentikan perjalanan lain.
- Data kosong: tampilkan pesan edukasi singkat dan link kembali ke arcade.

## Testing dan verifikasi

Unit test:

- urutan `depthMeters`;
- ID unik;
- key ID/EN identik;
- kategori dan layer valid;
- source URL tersedia;
- setiap `visual.kind` memiliki renderer atau fallback.

Component test:

- stop aktif berubah ketika observer memicu section;
- ruler menandai stop aktif;
- discovery card menampilkan fakta dan source yang benar;
- fallback visual tampil ketika kind tidak dikenal;
- link kembali menuju route arcade.

Manual browser verification:

- opening dan ending terbaca;
- scroll desktop menunjukkan strata dan object reveal;
- mobile tetap linear dan bebas overflow;
- keyboard dapat mencapai source dan navigasi;
- reduced motion mengurangi pergerakan;
- tidak ada animasi yang menutupi fakta.

Project verification:

```powershell
npm.cmd test -- --run
npm.cmd run build
git -c safe.directory=G:/WebsiteDevelopment/IhavenothingtodoWebsite diff --check
git -c safe.directory=G:/WebsiteDevelopment/IhavenothingtodoWebsite status -sb
```

## Kriteria penerimaan

Fitur siap masuk implementasi jika desain menghasilkan halaman yang:

1. dapat dibuka melalui `/education/below-the-surface`;
2. membawa pengguna dari surface sampai core dengan urutan kedalaman yang
   benar;
3. menampilkan minimal 12 stop source-backed;
4. mencakup `LIFE`, `HUMAN`, `GEOLOGY`, dan `TECH`;
5. memberi satu fakta dan satu perbandingan skala pada setiap stop;
6. memakai reveal + settle dan layer emerge sebagai motion utama;
7. tetap terbaca dan dapat dinavigasi pada mobile, keyboard, serta reduced
   motion;
8. tidak menambah backend, akun, analytics, dependency baru, atau perubahan
   mekanik game;
9. lulus seluruh verifikasi project.

## Batas implementasi berikutnya

Implementasi berikutnya mencakup penambahan route, dataset awal, komponen
journey, renderer line-art, source-backed copy, test kontrak data, dan browser
verification. Penentuan fakta final dilakukan saat penyusunan dataset dengan
sumber berotoritas; kontrak visual dan interaksi di atas tetap menjadi batas
implementasi.
