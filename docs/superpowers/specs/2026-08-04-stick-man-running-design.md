# Stick Man Running Design Spec

Tanggal: 2026-08-04  
Status: Disetujui user untuk review tertulis

## Ringkasan

`Stick Man Running` adalah mini-game brawler 2D side-view di atas halaman buku
sekolah putih. Pemain menggerakkan stickman sendiri, melawan wave musuh yang
datang dari kiri dan kanan, memakai combo pukulan berbasis timing, dan
mengambil benda-benda notebook sebagai senjata sementara.

Game mengikuti kontrak arcade yang sudah ada: client-side, seeded, lima nyawa,
game-over standar, dan tidak membutuhkan backend.

## Tujuan pengalaman

- Terasa enerjik, fun, lincah, dan responsif dalam beberapa detik pertama.
- Combat memiliki ruang untuk timing dan positioning, bukan sekadar spam klik.
- Visual stickman terasa unik lewat garis tinta, arsiran, coretan, dan efek
  halaman kertas.
- Tetap mudah dipahami pengguna baru dan playable melalui keyboard, mouse, dan
  touch control.

## Gameplay loop

1. Stickman mulai di tengah arena satu lantai.
2. Musuh masuk dari kiri atau kanan.
3. Pemain bergerak bebas secara horizontal dan dapat melompat.
4. Left mouse menjalankan combo tiga pukulan.
5. Musuh dikalahkan, score/combo bertambah, lalu wave berikutnya masuk.
6. Kecepatan, jumlah, dan kombinasi musuh meningkat secara bertahap.
7. Lima kesalahan mengakhiri run dan membuka `GameOver` existing.

### Kontrol

- `A/D` atau `ArrowLeft/ArrowRight`: gerak horizontal.
- `W` atau `Space`: lompat.
- Left mouse: pukul.
- Mobile: D-pad kiri/kanan, tombol jump, dan tombol punch.
- Pemain menghadap ke arah gerak terakhir; serangan selalu mengarah ke depan.

### Combo

- Hit 1: jab cepat.
- Hit 2 dalam jendela timing: cross dengan jangkauan lebih jauh.
- Hit 3 dalam jendela timing: finisher dengan knockback besar.
- Jeda terlalu lama mereset combo.
- Setiap hit memberi hit-stop singkat, recoil tubuh, garis impact, dan burst
  tinta.

## Arena dan kamera

- Arena hanya memiliki satu lantai horizontal dengan obstacle kecil.
- Kamera side-view mengikuti posisi pemain dengan sedikit look-ahead ke arah
  hadap.
- Arena memiliki batas kiri/kanan agar pemain dan musuh tidak keluar dari
  halaman.
- Obstacle notebook mengubah spacing, bukan menjadi sistem platforming penuh.

## Roster musuh

- **Runner**: cepat dan langsung mengejar.
- **Blocker**: lambat, memiliki pertahanan lebih besar, dan mendorong pemain.
- **Thrower**: menyerang dari jarak jauh dengan projectile kertas.
- **Eraser Boss**: muncul setelah milestone wave; dapat menghapus sebagian
  garis arena sementara.

Musuh harus memiliki telegraph yang jelas melalui pose, garis gerak, atau
arsiran, bukan hanya perbedaan warna.

## Weapon pickup

- **Ruler**: jangkauan pukulan panjang dan lurus.
- **Eraser**: serangan berat dengan knockback besar.
- **Pencil**: projectile lurus.
- **Paperclip**: combo cepat dengan damage kecil.

Pickup muncul sebagai benda yang baru dicoret di halaman dan memiliki feedback
visual saat diambil. Senjata bersifat sementara agar combo tangan tetap menjadi
mekanik inti.

## Visual dan mikro-interaksi

- Background berupa halaman buku sekolah putih dengan garis horizontal tipis.
- Stickman memakai stroke tinta hitam dengan variasi ketebalan kecil agar tidak
  terasa seperti sprite statis.
- Langkah menghasilkan debu grafit.
- Landing memberi tekanan kecil pada halaman.
- Pukulan menghasilkan ink burst, motion lines, hit-stop, dan perubahan pose.
- Damage memberi retak/arsiran pada siluet musuh.
- Knockback memberi page-shift kecil tanpa mengganggu input.
- Finisher meninggalkan coretan serangan yang lebih panjang.
- Tidak memakai gradient atau efek neon; kedalaman dibuat lewat stroke, arsiran,
  ukuran, timing, dan pergerakan kamera.

## Arsitektur teknis

Game ditambahkan melalui engine baru:

```text
src/games/stick-man-running/
  engine.ts       # lifecycle, input, update loop
  logic.ts        # movement, combo, collision, wave rules
  draw.ts         # paper background, stickman, enemies, effects
  config.ts       # enemy, weapon, dan tuning values
  logic.test.ts   # unit test state, combat, dan wave
```

Integrasi:

- Tambahkan `stick-man-running` ke `GameId`.
- Tambahkan metadata category `dexterity` dan lazy loader di registry.
- Gunakan logical canvas `960x540` untuk side-brawler.
- Implementasikan `GameEngine` tanpa memindahkan frame loop ke React.
- Gunakan `opts.seed` untuk wave dan pickup deterministik.
- Kirim score, life loss, game-over, dan fatal error lewat callback shell.
- Bersihkan keyboard listener, pointer listener, timer, dan animation frame di
  `destroy()`.
- Touch controls dirender sebagai DOM controls dan diteruskan melalui input
  adapter engine, bukan hitbox visual yang menutupi playfield.

## Responsive behavior

- Mobile: canvas portrait `2:3` dan touch controls terlihat.
- Tablet: canvas fluid `4:3`; controls menyesuaikan ruang.
- Desktop: canvas landscape `16:9`; keyboard dan mouse menjadi input utama.
- Shell width mengikuti breakpoint existing.
- Resize, rotasi perangkat, dan `prefers-reduced-motion` harus aman.

## Error handling dan lifecycle

- Engine gagal load: gunakan `onFatalError` dan fallback shell yang bisa
  kembali ke home.
- `visibilitychange` mem-pause game saat tab tidak terlihat.
- Game over hanya dikirim sekali per run.
- Semua listener/resource harus dilepas ketika modal ditutup atau run diulang.

## Testing

Unit test wajib mencakup:

- Gerak horizontal dan batas arena.
- Jump state dan landing.
- Timing combo tiga hit.
- Hitbox player/enemy dan knockback.
- Weapon pickup dan durasi efeknya.
- Spawn wave deterministik berdasarkan seed.
- Eraser Boss milestone.
- Game-over setelah lima nyawa.
- Cleanup lifecycle engine.

Manual playtest mencakup keyboard, mouse, touch, resize mobile/tablet/desktop,
pause/resume, reduced motion, pickup weapon, wave escalation, dan game-over.

## Acceptance criteria

- Game dapat dipilih dari home dan dibuka melalui modal/game route existing.
- Pemain dapat bergerak, lompat, dan menyelesaikan combo tiga pukulan.
- Minimal tiga tipe musuh dan Eraser Boss berfungsi dengan telegraph berbeda.
- Weapon pickup notebook memberi perilaku serangan berbeda.
- Mobile playable dengan touch controls; desktop playable dengan keyboard dan
  mouse.
- Visual konsisten dengan kertas putih, tinta hitam, dan mikro-interaksi yang
  terasa hidup.
- Test suite dan production build tetap lulus.
