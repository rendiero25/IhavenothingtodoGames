# Kota

Kota adalah diorama 3D interaktif di `/city`. Semua simulasi berjalan di browser,
tanpa backend atau penyimpanan progres. Bentuk bangunan tetap bergaya miniatur;
efek alam memodelkan arah, perkembangan, dan lokasi kejadian secara visual,
bukan perhitungan atau prakiraan bencana nyata.

## Menjelajah

- WASD atau tombol sentuh: bergerak mengikuti arah kamera. Tahan untuk terus bergerak.
- Seret tombol kiri mouse atau satu jari: putar kamera 360° dan ubah elevasi.
- Shift + seret, tombol kanan mouse, atau dua jari: geser pusat pandangan.
- Gulir atau cubit: zoom. Tombol putar dan zoom juga tersedia di pengaturan.
- Pilihan tempat: pusat kota, sungai, pantai/dermaga, stasiun, taman, dan perbukitan.
- Kecepatan aktivitas: 0,25× sampai 3×. Jam dan kecepatan aktivitas terpisah.

## Dunia dan aktivitas

Peta berukuran 216 × 148 satuan, dari 128 × 100 sebelumnya. Sungai berkelok di
tengah kota. Pantai dan laut berada di tenggara, yaitu kanan bawah pada pandangan
awal. Enam jalan melintang menjembatani sungai; setiap ujung jalan bertemu jalan
lain. Plot bangunan dan rute pedestrian memakai geografi yang sama.

Kota memiliki rumah, apartemen, perkantoran, apartemen tepi sungai, rumah sakit,
sekolah, stasiun, stadion, pasar, kantor polisi, pemadam, taman, dan fasilitas
tenaga surya. Kendaraan, motor, bus, kereta, perahu, burung, dan pedestrian
memiliki aktivitas sendiri. Warga memakai payung saat hujan dan menuju sudut
blok untuk berlindung saat bencana. Kendaraan darurat muncul ketika bencana aktif.

Apartemen tepi sungai mengikuti ruang kering di setiap lengkung. Blok tengah
tetap taman umum dengan jalur jalan kaki, air mancur dan bangku di kedua tepi.
Koridor rel terpisah dari jalan dan rumah. Seluruh rangkaian tiga gerbong tetap
di dalam batas rel saat berhenti di stasiun, berakselerasi, dan kembali.
Model kendaraan menggunakan bodi berkontur, roda bundar dan detail kaca, lampu,
spion atau mesin. Kendaraan darat membelok secara bertahap di persimpangan,
bukan memutar langsung 90 derajat. Perahu berlambung V memiliki jejak buih; pesawat bermesin
kembar dan perahu menghadap garis singgung jalurnya, tanpa teleportasi di ujung peta.
Detail model tetap bergaya diorama, bukan fotorealistis; lapisan material digabung
sebelum di-instance agar tidak membuat satu draw call per detail kendaraan.

Menghentikan jam atau menyeret pengatur waktu hanya mengubah gerakan matahari.
Aktivitas dan umur kejadian terus berjalan. Tab tersembunyi menghentikan pembaruan
visual; kembali ke tab tidak menyebabkan lompatan waktu. Preferensi reduced motion
menghentikan animasi otomatis dan kilat; kontrol kamera tetap dapat digunakan.

## Cuaca, musim, dan bencana

Awan menggunakan volume solid dengan pencahayaan, bukan objek transparan.
Badai dan kilat menampilkan cabang petir dan kilatan singkat yang tidak seragam.
Hujan miring, badai salju, kabut, akumulasi salju atap dan pencairan, daun gugur,
serta bunga musim semi memberi perubahan lebih dari warna saja.

Banjir melebar mengikuti sungai. Gempa memiliki getaran yang mereda, retakan,
dan puing. Kebakaran memiliki api, asap yang naik mengikuti angin, dan tanaman
terbakar. Tsunami bergerak dari laut menuju pesisir dengan permukaan melengkung,
buih dan genangan. Tornado memiliki pusaran bertingkat dan puing berputar.
Hujan es jatuh dan menumpuk; longsor berasal dari perbukitan; kekeringan menyusutkan
aliran sungai secara bertahap.

Pratinjau Awal/Puncak/Setelah kejadian melompat ke umur kejadian tanpa mengubah jam
kota. Semua bahaya berkembang lalu mereda; kerusakan terakumulasi dan bertahan.
Genangan meninggalkan endapan lumpur, puing kayu dan garis air pada fasad.
Gempa/tornado/tsunami/hujan es meninggalkan kerusakan atap, jendela pecah dan puing.
Kebakaran meninggalkan lahan hangus dan tanaman terbakar; tornado/tsunami/longsor
dapat merobohkan pohon. Longsor meninggalkan batu dan lumpur; kekeringan meninggalkan
tanaman kering, retakan dan sungai yang menyusut. Dampak mengikuti sumber kejadian,
bukan mengubah seluruh kota secara sama rata. Kerusakan tsunami dimulai setelah
gelombang mencapai pesisir, tidak saat gelombang masih jauh di laut.

Memilih Tidak ada menghentikan bahaya, tidak menghapus kerusakan. Berganti bencana
menambah dampak; mengganti jam/cuaca/musim tidak menghapusnya. Pulihkan kota atau
Atur ulang menghapus seluruh bekas dan mengembalikan keadaan kota. Pratinjau Awal
tidak memundurkan kerusakan yang sudah terjadi; pulihkan dahulu untuk mengulang
kejadian dari kota yang utuh. Tidak ada progres yang disimpan setelah meninggalkan halaman.

## Modul dan verifikasi

- `world.ts`: geografi, plot, jaringan jalan, rute, dan pergerakan kamera.
- `simulation.ts`: waktu aktivitas, salju, umur dan kekuatan kejadian.
- `scenery.ts`: bangunan dan fasilitas berbasis instance, sungai dan pesisir.
- `effects.ts`: cuaca, musim, dan tampilan bencana.
- `impacts.ts`: paparan kumulatif, lokasi dampak, kerusakan dan pemulihan.
- `vehicles.ts`: model kendaraan berlapis material dan aktivitasnya.
- `scene.ts`: renderer, aktivitas, input, lifecycle, dan hubungan dengan DOM.

Jalankan `npm.cmd test -- --run` dan `npm.cmd run build`. Tes mencakup konektivitas
jalan, clearance bangunan, rute pedestrian, pemisahan jam/aktivitas, seluruh
kombinasi cuaca/bencana/musim, input, reduced motion, context recovery, dan cleanup.
Uji browser juga perlu memeriksa drag 360°, tombol sentuh, pinch, pergantian ukuran,
keadaan jam dijeda, cuaca, pratinjau bencana, serta ID/EN.
