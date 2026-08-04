# Ko-fi Footer Link Design

Status: Pending user review

## Tujuan

Menambahkan akses dukungan Ko-fi ke `ihavenothingtodo` tanpa mengubah alur memilih atau memainkan game. Integrasi menggunakan link publik biasa, bukan widget embed, API, atau webhook.

## Keputusan desain

Ko-fi ditempatkan di footer sebagai secondary call to action. Header tetap fokus pada brand, pilihan bahasa, Daily, dan kontrol sound. Footer menjadi tiga area:

- kiri: `ihavenothingtodo`
- tengah: `Buy me a Coffee`
- kanan: teks footer existing dari i18n

Pada layar kecil, tiga area boleh membungkus atau berpindah baris secara rapi agar tidak menyebabkan horizontal overflow. Gaya tetap monochrome, tanpa logo atau warna tambahan dari Ko-fi.

## Data dan perilaku link

- URL tujuan: `https://ko-fi.com/rendiero`
- Label tampilan: `Buy me a Coffee`
- Link dibuka di tab baru.
- Link memakai `rel="noopener noreferrer"`.
- State aplikasi tidak berubah ketika link diklik.
- Widget script yang diberikan user tidak dipasang karena scope yang dipilih adalah link biasa.
- Tidak ada password, API key, webhook, atau data akun yang disimpan di repository.

## Batasan scope

Termasuk:

- Link Ko-fi pada footer halaman home.
- Focus state keyboard dan target sentuh yang tetap nyaman.
- Responsive layout desktop dan mobile.
- Verifikasi URL, target tab baru, dan tidak adanya overflow.

Tidak termasuk:

- Floating Ko-fi widget atau tip panel.
- Integrasi pembayaran di dalam aplikasi.
- Webhook, API, membership, shop, atau commissions.
- Pelacakan tambahan di luar perilaku link biasa.

## Implementasi yang direncanakan

Perubahan utama berada di `src/pages/Home.tsx`, pada footer yang sudah ada. Label akan ditambahkan sebagai key `home.kofi` di `src/i18n/dict.ts` untuk locale Indonesia dan Inggris, dengan nilai `Buy me a Coffee` pada keduanya agar sesuai CTA yang diberikan user.

## Verifikasi

1. `npm.cmd test -- --run` tetap lulus.
2. `npm.cmd run build` lulus.
3. Footer menampilkan link `Buy me a Coffee`.
4. Klik link membuka `https://ko-fi.com/rendiero` di tab baru.
5. Keyboard focus terlihat dan footer tidak overflow pada viewport sempit.

## Acceptance criteria

- Pengguna dapat mencapai Ko-fi dari footer home dalam satu klik.
- Header dan wheel scroller tidak berubah perilakunya.
- Tidak ada script Ko-fi yang dimuat untuk versi link ini.
- Layout tetap bersih, monochrome, dan responsive.
