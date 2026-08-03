# Arena FPS Low-Poly — Design Spec

- Tanggal: 2026-07-30
- Status: disetujui
- Scope: FPS sederhana sebagai game ke-9.
- Di luar scope: rail shooter, top-down shooter, dan racing; masing-masing perlu spec terpisah.

## Konsep

- FPS low-poly 3D memakai Three.js.
- Sesi endless dalam satu arena industri.
- Arena berubah ringan per level: susunan kontainer, spawn, lighting, dan kabut.
- Visual realistis melalui proporsi, material, lighting, dan animasi; tanpa gore atau texture besar.

## Gameplay

- Satu level berisi satu wave; boss muncul setiap 5 level.
- Musuh dicampur bertahap: drone, robot cepat, turret, tentara fiksi, dan zombie tanpa gore.
- Pemain memiliki 5 nyawa; satu serangan mengurangi satu nyawa dan memberi kebal 1 detik.
- Senjata dapat diganti:
  - Pistol: magazine terbatas dengan reserve amunisi tanpa batas.
  - Assault rifle: tembakan cepat.
  - Shotgun: kuat pada jarak dekat.
- Semua senjata memakai reload manual.
- Assault rifle dan shotgun memiliki reserve terbatas, diisi antar-wave atau melalui pickup.
- Tembakan manual; miss tidak mengurangi nyawa.
- Skor dan combo naik dari kill.
- Statistik hasil: kill, accuracy, headshot, wave, dan senjata favorit.
- Daily Gauntlet memakai seed deterministik dan batas 45 detik.

## Kontrol

- Desktop: WASD, mouse aim, klik tembak, tombol reload, tombol ganti senjata.
- Mobile: joystick kiri, drag kanan, tombol tembak, reload, dan ganti senjata.
- Arena memakai rasio 16:9; `GameShell` mendukung game portrait dan landscape.

## Arsitektur

- Tambah `arena-fps` ke registry dan metadata game.
- Three.js dimuat lewat dynamic import agar 8 game Canvas 2D lama tidak ikut memuat bundle 3D.
- `FpsEngine` mengimplementasikan `GameEngine` langsung tanpa mengubah engine lama.
- Pisahkan modul gameplay logic, input, scene, enemy AI, dan weapon system.
- Primitive geometry, material, dan object pool dipakai ulang.
- Maksimum 12 musuh aktif.

## HUD dan performa

- HUD 3D menampilkan crosshair, senjata, amunisi, reload, dan wave.
- Nyawa, skor, pause, serta game-over tetap memakai shell bersama.
- Efek dibatasi pada muzzle flash, kabut, recoil, hit marker, dan bayangan ringan.
- Pixel ratio dan kualitas shadow diturunkan pada perangkat lemah.
- `prefers-reduced-motion` mengurangi recoil, camera shake, dan flash.
- Target: 30 FPS pada mobile menengah dan 60 FPS pada desktop.

## Error handling

- WebGL gagal: tampilkan pesan dan tombol kembali; game lama tetap tersedia.
- WebGL context hilang: pause, coba pulihkan sekali, lalu tawarkan keluar.
- Pointer Lock ditolak: gunakan drag mouse untuk aim.
- Tab tersembunyi: pause otomatis.
- Resize atau rotasi: hitung ulang kamera dan kontrol.

## Testing

- Unit: seed wave, campuran musuh, damage, amunisi, reload, pergantian senjata, dan skor.
- Integration: init, pause, resume, serta destroy tanpa event atau renderer bocor.
- Manual: keyboard, mouse, touch, rotasi, Daily Gauntlet, WebGL fallback, dan perangkat lambat.
