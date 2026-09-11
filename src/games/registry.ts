import type { GameEngine, GameId, GameMeta } from './types';

export const GAMES: GameMeta[] = [
  // Diisi satu entri per task game (Task 12-19), urutan: tap-panic, quick-math,
  // simon, missing-number, word-scramble, bubble-sniper, dodge, beat-tap.
  {
    id: 'tap-panic',
    category: 'reflex',
    icon: 'zap',
    accent: 'coral',
    viewport: 'portrait',
    name: { id: 'Tap Panic', en: 'Tap Panic' },
    tagline: { id: 'Tap sebelum lingkarannya kabur.', en: 'Tap before the circle vanishes.' },
    howTo: {
      id: 'Tap target hijau secepatnya. Jangan sentuh yang pink!',
      en: 'Tap green targets fast. Never touch the pink ones!',
    },
  },
  {
    id: 'quick-math',
    category: 'math',
    icon: 'calculator',
    accent: 'teal',
    viewport: 'portrait',
    name: { id: 'Hitung Kilat', en: 'Flash Math' },
    tagline: { id: 'Benar atau salah? Mikir cepat!', en: 'True or false? Think fast!' },
    howTo: {
      id: 'Persamaan benar → tombol hijau (→). Salah → tombol pink (←). Waktumu makin tipis.',
      en: 'Equation right → green button (→). Wrong → pink button (←). Time keeps shrinking.',
    },
  },
  {
    id: 'simon',
    category: 'memory',
    icon: 'brain',
    accent: 'pink',
    viewport: 'portrait',
    name: { id: 'Simon Gabut', en: 'Simon Says Nothing' },
    tagline: { id: 'Hafalkan urutannya. Terus. Terus.', en: 'Memorize the sequence. Again. And again.' },
    howTo: {
      id: 'Perhatikan urutan lampu menyala, lalu ulangi dengan menekan pad yang sama (atau tombol 1-4).',
      en: 'Watch the lights, then repeat the sequence on the pads (or keys 1-4).',
    },
  },
  {
    id: 'missing-number',
    category: 'logic',
    icon: 'hash',
    accent: 'amber',
    viewport: 'portrait',
    name: { id: 'Angka Hilang', en: 'Missing Number' },
    tagline: { id: 'Deretnya bolong satu. Isi!', en: 'One number is missing. Fill it!' },
    howTo: {
      id: 'Temukan pola deret dan pilih angka yang hilang (tombol 1-3) sebelum waktu habis.',
      en: 'Spot the pattern and pick the missing number (keys 1-3) before time runs out.',
    },
  },
  {
    id: 'word-scramble',
    category: 'word',
    icon: 'type',
    accent: 'pink',
    viewport: 'portrait',
    name: { id: 'Kata Acak', en: 'Word Jumble' },
    tagline: { id: 'Susun hurufnya sebelum otakmu nyerah.', en: 'Unscramble before your brain gives up.' },
    howTo: {
      id: 'Tap (atau ketik) huruf sesuai urutan kata yang benar. Salah tap = nyawa melayang.',
      en: 'Tap (or type) letters in the right order. A wrong tap costs a life.',
    },
  },
  {
    id: 'bubble-sniper',
    category: 'aim',
    icon: 'target',
    accent: 'teal',
    viewport: 'portrait',
    name: { id: 'Bubble Sniper', en: 'Bubble Sniper' },
    tagline: { id: 'Tembak gelembungnya. Jangan yang pink.', en: 'Pop the bubbles. Not the pink ones.' },
    howTo: {
      id: 'Tap gelembung biru sebelum kabur dari layar. Gelembung pink = jebakan!',
      en: 'Tap blue bubbles before they escape. Pink bubbles are traps!',
    },
  },
  {
    id: 'dodge',
    category: 'dexterity',
    icon: 'move',
    accent: 'amber',
    viewport: 'portrait',
    name: { id: 'Ngindar!', en: 'Dodge!' },
    tagline: { id: 'Geser, hindar, bertahan hidup.', en: 'Slide, dodge, survive.' },
    howTo: {
      id: 'Gerakkan bola dengan jari (atau panah kiri/kanan). Jangan sampai kena balok jatuh.',
      en: 'Move with your finger (or arrow keys). Do not get hit by falling blocks.',
    },
  },
  {
    id: 'beat-tap',
    category: 'rhythm',
    icon: 'music',
    accent: 'coral',
    viewport: 'portrait',
    name: { id: 'Ketuk Beat', en: 'Beat Tap' },
    tagline: { id: 'Tap pas di ringnya. Rasakan iramanya.', en: 'Tap right on the ring. Feel the beat.' },
    howTo: {
      id: 'Tap layar (atau spasi) tepat saat nada menyentuh ring. Nada lolos = nyawa hilang.',
      en: 'Tap (or press space) exactly when a note hits the ring. Missed notes cost a life.',
    },
  },
  {
    id: 'arena-fps',
    category: 'shooter',
    icon: 'crosshair',
    accent: 'coral',
    viewport: 'landscape',
    name: { id: 'Arena Gabut', en: 'Boredom Arena' },
    tagline: { id: 'Lima nyawa. Tiga senjata. Banyak masalah.', en: 'Five lives. Three weapons. Many problems.' },
    howTo: {
      id: 'WASD/joystick untuk bergerak, klik cursor mouse untuk menembak, R untuk reload, 1-3 untuk ganti senjata.',
      en: 'Move with WASD/joystick, click the mouse cursor to shoot, press R to reload, and 1-3 to switch weapons.',
    },
  },
  {
    id: 'stick-man-running',
    category: 'dexterity',
    icon: 'move',
    accent: 'amber',
    viewport: 'landscape',
    name: { id: 'Stick Man Brawl', en: 'Stick Man Brawl' },
    tagline: {
      id: 'Berlari, melompat, dan bertarung di atas halaman buku.',
      en: 'Run, jump, and brawl across a notebook page.',
    },
    howTo: {
      id: 'Gunakan A/D atau panah untuk bergerak, W/spasi untuk melompat, dan klik kiri untuk merangkai pukulan serta tendangan.',
      en: 'Use A/D or arrow keys to move, W/space to jump, and left click to chain punches and kicks.',
    },
  },
];

GAMES.push(
  { id: 'kurir-gabut', category: 'adventure', icon: 'move', accent: 'amber', viewport: 'landscape',
    name: { id: 'Kurir Gabut', en: 'Little Courier' },
    tagline: { id: 'Lima titipan. Gas motor. Kejar waktu.', en: 'Five parcels. Ride out. Beat the clock.' },
    howTo: { id: 'W/S atau panah untuk maju/mundur, A/D untuk belok. Shift untuk ngebut, spasi untuk rem. Tap jalan untuk rute otomatis. B untuk naik/turun motor saat berhenti. Bawa paket ke penanda sebelum waktu habis, turun lalu tekan E untuk ketuk pintu. Waspadai kendaraan, anjing, dan cuaca. Kontrol sentuh tersedia.', en: 'W/S or arrows to move, A/D to turn. Shift to boost, space to brake. Tap a street for automatic routing. B to mount/dismount while stopped. Bring the parcel to the marker before time runs out, dismount, then press E to knock. Watch for traffic, dogs, and weather. Touch controls available.' } },
  { id: 'highway-rush', category: 'racing', icon: 'move', accent: 'teal', viewport: 'portrait',
    name: { id: 'Highway Rush', en: 'Highway Rush' },
    tagline: { id: 'Selip di antara mobil. Kuasai jalan malam.', en: 'Thread the traffic. Own the night road.' },
    howTo: { id: 'Panah kiri/kanan atau geser layar untuk menyetir. Tahan spasi atau Rem untuk melambat. Salip mobil tanpa menabrak.', en: 'Arrow keys or drag to steer. Hold space or Brake to slow down. Overtake without crashing.' } },
  { id: 'apex-rally', category: 'racing', icon: 'move', accent: 'amber', viewport: 'portrait',
    name: { id: 'Apex Rally', en: 'Apex Rally' },
    tagline: { id: 'Baca tikungan. Tembus setiap gerbang.', en: 'Read the bends. Hit every gate.' },
    howTo: { id: 'Panah kiri/kanan atau geser untuk menyetir melewati gerbang putih. Tahan spasi atau Rem sebelum tikungan. Keluar lintasan mengurangi nyawa.', en: 'Arrow keys or drag to steer through white gates. Hold space or Brake before bends. Leaving the road costs a life.' } },
  { id: 'slipstream', category: 'racing', icon: 'move', accent: 'coral', viewport: 'portrait',
    name: { id: 'Slipstream', en: 'Slipstream' },
    tagline: { id: 'Ikuti rival. Isi tenaga. Salip tepat waktu.', en: 'Follow rivals. Build speed. Time the pass.' },
    howTo: { id: 'Panah kiri/kanan atau geser untuk menyetir. Ikuti mobil dari belakang untuk mengisi boost otomatis, lalu menyingkir sebelum tabrakan. Spasi atau Rem untuk melambat.', en: 'Arrow keys or drag to steer. Follow a rival to charge automatic boost, then pull out before impact. Space or Brake slows you down.' } },
);

const loaders: Partial<Record<GameId, () => Promise<GameEngine>>> = {
  'kurir-gabut': () => import('./kurir-gabut/engine').then(async m => {await m.prepareCourierPhysics();return new m.CourierEngine();}),
  'highway-rush': () => import('./racing/engine').then((m) => new m.RacingEngine('highway')),
  'apex-rally': () => import('./racing/engine').then((m) => new m.RacingEngine('rally')),
  slipstream: () => import('./racing/engine').then((m) => new m.RacingEngine('slipstream')),
  // Diisi per task game.
  'tap-panic': () => import('./tap-panic/engine').then((m) => new m.TapPanicEngine()),
  'quick-math': () => import('./quick-math/engine').then((m) => new m.QuickMathEngine()),
  simon: () => import('./simon/engine').then((m) => new m.SimonEngine()),
  'missing-number': () => import('./missing-number/engine').then((m) => new m.MissingNumberEngine()),
  'word-scramble': () => import('./word-scramble/engine').then((m) => new m.WordScrambleEngine()),
  'bubble-sniper': () => import('./bubble-sniper/engine').then((m) => new m.BubbleSniperEngine()),
  dodge: () => import('./dodge/engine').then((m) => new m.DodgeEngine()),
  'beat-tap': () => import('./beat-tap/engine').then((m) => new m.BeatTapEngine()),
  'arena-fps': () => import('./arena-fps/engine').then((m) => new m.FpsEngine()),
  'stick-man-running': () => import('./stick-man-running/engine').then((m) => new m.StickManRunningEngine()),
};

export function getMeta(id: string): GameMeta | undefined {
  return GAMES.find((g) => g.id === id);
}

export async function loadEngine(id: GameId): Promise<GameEngine> {
  const loader = loaders[id];
  if (!loader) throw new Error(`Unknown game: ${id}`);
  return loader();
}
