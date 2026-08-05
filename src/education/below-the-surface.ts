import type { EducationCategory, EducationLayer, EducationStop } from './types';

const VALID_CATEGORIES = new Set<EducationCategory>(['life', 'human', 'geology', 'tech']);
const VALID_LAYERS = new Set<EducationLayer>([
  'surface',
  'soil',
  'groundwater',
  'underground',
  'crust',
  'mantle',
  'core',
]);

export const BELOW_THE_SURFACE_STOPS: readonly EducationStop[] = Object.freeze([
  {
    id: 'surface-life',
    depthMeters: 0.2,
    layer: 'surface',
    category: 'life',
    title: {
      id: 'Kehidupan permukaan',
      en: 'Surface life',
    },
    fact: {
      id: 'Tanah bukan benda mati; USDA NRCS menjelaskannya sebagai ekosistem hidup yang menopang tumbuhan, hewan, dan manusia. Lapisan paling atas menjadi titik awal sisa daun, benih, dan akar halus masuk ke siklus hara.',
      en: 'Soil is not inert material; USDA NRCS describes it as a living ecosystem that sustains plants, animals, and humans. The topmost layer is where leaf litter, seeds, and fine roots begin cycling nutrients back into food webs.',
    },
    comparison: {
      id: 'Sedalam sol sepatu tebal.',
      en: 'About as deep as a thick shoe sole.',
    },
    source: {
      label: 'USDA NRCS Soil Health',
      url: 'https://www.nrcs.usda.gov/conservation-basics/soil/soil-health',
    },
    visual: {
      kind: 'cutaway',
      label: 'Rumput dan serasah di atas tanah gelap',
    },
  },
  {
    id: 'root-zone',
    depthMeters: 0.5,
    layer: 'soil',
    category: 'life',
    title: {
      id: 'Zona akar',
      en: 'Root zone',
    },
    fact: {
      id: 'USDA menjelaskan root zone sebagai area di sekitar akar tempat aktivitas fisik, kimia, dan biologis mengatur pertumbuhan tanaman. Di sinilah air, mineral, dan mikroba paling langsung bertemu dengan akar hidup.',
      en: 'USDA describes the root zone as the area around roots where physical, chemical, and biological activity governs plant growth. It is where water, minerals, and microbes most directly meet living roots.',
    },
    comparison: {
      id: 'Mirip tinggi penggaris sekolah pendek.',
      en: 'About the length of a short school ruler.',
    },
    source: {
      label: 'USDA ARS Get Into the Zone—the Root Zone',
      url: 'https://www.ars.usda.gov/news-events/news/research-news/2007/get-into-the-zone-the-root-zone/',
    },
    visual: {
      kind: 'roots',
      label: 'Jaringan akar tipis menyebar dari batang tanaman',
    },
  },
  {
    id: 'soil-organisms',
    depthMeters: 1.2,
    layer: 'soil',
    category: 'life',
    title: {
      id: 'Organisme tanah',
      en: 'Soil organisms',
    },
    fact: {
      id: 'Soil Biology Primer NRCS menekankan bahwa makhluk hidup di tanah sangat penting bagi kesehatan tanah. Mereka membentuk struktur tanah, membantu dekomposisi dan daur hara, serta memengaruhi ketersediaan air.',
      en: 'The NRCS Soil Biology Primer explains that the creatures living in soil are critical to soil health. They shape soil structure, help decomposition and nutrient cycling, and influence water availability.',
    },
    comparison: {
      id: 'Lebih dalam dari sekop kebun penuh.',
      en: 'Deeper than a full garden shovel.',
    },
    source: {
      label: 'USDA NRCS Soil Biology Primer',
      url: 'https://www.nrcs.usda.gov/resources/education-and-teaching-materials/soil-biology-primer',
    },
    visual: {
      kind: 'soil-food-web',
      label: 'Penampang tanah dengan cacing, jamur, dan akar',
    },
  },
  {
    id: 'utility-corridor',
    depthMeters: 1.8,
    layer: 'underground',
    category: 'tech',
    title: {
      id: 'Koridor utilitas',
      en: 'Utility corridor',
    },
    fact: {
      id: 'Perusahaan utilitas mengingatkan bahwa jaringan gas, listrik, dan uap dapat berada di bawah properti publik maupun pribadi. Karena itu orang diminta menghubungi 811 sebelum menggali agar posisi fasilitas bawah tanah bisa ditandai.',
      en: 'Utilities warn that gas, electric, and steam facilities can run beneath both public and private property. That is why people are told to call 811 before digging so underground infrastructure can be marked.',
    },
    comparison: {
      id: 'Kurang lebih setinggi orang dewasa.',
      en: 'Roughly as tall as an adult.',
    },
    source: {
      label: 'Con Edison Call 811 Before You Dig',
      url: 'https://www.coned.com/en/safety/energy-safety/gas-safety/call-before-you-dig',
    },
    visual: {
      kind: 'pipes',
      label: 'Pipa dan kabel warna-warni melintas horizontal',
    },
  },
  {
    id: 'groundwater-aquifer',
    depthMeters: 10,
    layer: 'groundwater',
    category: 'human',
    title: {
      id: 'Air tanah',
      en: 'Groundwater',
    },
    fact: {
      id: 'EPA menjelaskan bahwa air tanah adalah air bawah permukaan yang mengisi retakan dan ruang pada tanah, pasir, dan batuan. Air ini bisa muncul kembali sebagai mata air atau diambil melalui sumur untuk kebutuhan manusia.',
      en: 'EPA explains that groundwater is underground water filling cracks and spaces in soil, sand, and rock. It can reappear as springs or be withdrawn through wells for human use.',
    },
    comparison: {
      id: 'Sekitar tinggi rumah dua sampai tiga lantai, tetapi ke bawah.',
      en: 'About the height of a two- to three-story house, but downward.',
    },
    source: {
      label: 'US EPA Superfund Groundwater Introduction',
      url: 'https://www.epa.gov/superfund/superfund-groundwater-introduction',
    },
    visual: {
      kind: 'water-table',
      label: 'Lapisan biru mengisi pori batuan dan tanah',
    },
  },
  {
    id: 'subway-depth',
    depthMeters: 55,
    layer: 'underground',
    category: 'human',
    title: {
      id: 'Terowongan kereta bawah tanah',
      en: 'Subway tunnel',
    },
    fact: {
      id: 'NYC DOT menyebut stasiun 191st Street sebagai salah satu yang terdalam di jaringan Subway New York, sekitar 180 kaki di bawah permukaan jalan. Kedalaman seperti ini memungkinkan transportasi menembus batuan dasar sambil menjaga kota tetap berfungsi di atasnya.',
      en: 'NYC DOT describes 191st Street as one of the deepest stations in the New York City Subway, at about 180 feet below street level. Depth like this lets transit pass through bedrock while the city keeps operating above.',
    },
    comparison: {
      id: 'Lebih dalam dari gedung sekitar 15 lantai.',
      en: 'Deeper than a roughly 15-story building is tall.',
    },
    source: {
      label: 'NYC DOT 191st Street Tunnel press release',
      url: 'https://www.nyc.gov/html/dot/html/pr2023/dot-search-artists-beautify-street.shtml',
    },
    visual: {
      kind: 'tunnel',
      label: 'Peron kereta berada jauh di bawah jalan kota',
    },
  },
  {
    id: 'cave-fossils',
    depthMeters: 100,
    layer: 'crust',
    category: 'geology',
    title: {
      id: 'Lapisan gua dan fosil',
      en: 'Cave fossil layer',
    },
    fact: {
      id: 'National Park Service menjelaskan bahwa Mammoth Cave menyimpan fosil batuan dasar Paleozoikum pada batugamping yang terbentuk di laut dangkal sekitar 300 sampai 325 juta tahun lalu. Masuk lebih dalam ke batuan sering berarti masuk juga ke catatan lingkungan purba.',
      en: 'The National Park Service explains that Mammoth Cave preserves Paleozoic bedrock fossils in limestone formed in a shallow sea about 300 to 325 million years ago. Going deeper into rock can also mean entering Earth’s archive of ancient environments.',
    },
    comparison: {
      id: 'Kira-kira sepanjang lapangan sepak bola.',
      en: 'About the length of a football field.',
    },
    source: {
      label: 'NPS Mammoth Cave fossils',
      url: 'https://www.nps.gov/maca/learn/nature/fossils.htm',
    },
    visual: {
      kind: 'fossil-wall',
      label: 'Dinding batu kapur dengan jejak fosil laut',
    },
  },
  {
    id: 'deep-mine',
    depthMeters: 3740,
    layer: 'crust',
    category: 'human',
    title: {
      id: 'Tambang sangat dalam',
      en: 'Deep mine',
    },
    fact: {
      id: 'Harmony menyebut Mponeng sebagai tambang terdalam di dunia, dengan area penambangan aktif sekitar 3.160 sampai 3.740 meter di bawah permukaan. Kedalaman ini hanya bisa dicapai dengan sistem shaft, ventilasi, dan operasi bawah tanah yang sangat terkontrol.',
      en: 'Harmony identifies Mponeng as the deepest mine in the world, with active mining around 3,160 to 3,740 meters below surface. Reaching depths like this requires tightly controlled shafts, ventilation, and underground operations.',
    },
    comparison: {
      id: 'Jauh lebih dalam daripada pencakar langit mana pun.',
      en: 'Far deeper than any skyscraper is tall.',
    },
    source: {
      label: 'Harmony Gold Mponeng',
      url: 'https://www.harmony.co.za/operations/south-africa/mponeng/',
    },
    visual: {
      kind: 'mine-shaft',
      label: 'Shaft tambang turun ke batuan emas yang panas',
    },
  },
  {
    id: 'deep-borehole',
    depthMeters: 12262,
    layer: 'crust',
    category: 'tech',
    title: {
      id: 'Lubang bor kerak',
      en: 'Deep borehole',
    },
    fact: {
      id: 'USGS mencatat bahwa lubang bor di Semenanjung Kola mencapai sekitar 12 kilometer. Rekor ini menunjukkan bahwa bahkan pengeboran terdalam manusia masih hanya menggores sebagian kecil kerak Bumi.',
      en: 'USGS notes that the borehole on the Kola Peninsula reached about 12 kilometers deep. That record shows that even the deepest human drilling only scratches a tiny fraction of Earth’s crust.',
    },
    comparison: {
      id: 'Seperti menumpuk lebih dari seratus Menara Eiffel ke bawah.',
      en: 'Like stacking more than a hundred Eiffel Towers downward.',
    },
    source: {
      label: 'USGS The Interior of the Earth',
      url: 'https://pubs.usgs.gov/gip/interior/index.html',
    },
    visual: {
      kind: 'drill',
      label: 'Lubang bor sempit menembus jauh ke kerak',
    },
  },
  {
    id: 'moho-boundary',
    depthMeters: 35000,
    layer: 'mantle',
    category: 'geology',
    title: {
      id: 'Batas kerak dan mantel',
      en: 'Crust-to-mantle boundary',
    },
    fact: {
      id: 'USGS menjelaskan bahwa batas kerak dan mantel disebut Mohorovičić discontinuity atau Moho. Di bawah benua, kedalamannya rata-rata sekitar 35 kilometer, sementara kerak samudra biasanya jauh lebih tipis.',
      en: 'USGS explains that the boundary between crust and mantle is the Mohorovičić discontinuity, or Moho. Beneath continents it averages about 35 kilometers deep, while oceanic crust is usually much thinner.',
    },
    comparison: {
      id: 'Sekitar ketinggian jelajah beberapa pesawat, tetapi arahnya ke bawah.',
      en: 'About the cruising altitude of some jets, but downward.',
    },
    source: {
      label: 'USGS Volcano Watch on drilling to the Moho',
      url: 'https://www.usgs.gov/observatories/hvo/news/volcano-watch-after-50-years-a-renewed-effort-drill-moho',
    },
    visual: {
      kind: 'boundary',
      label: 'Garis terang menandai peralihan kerak ke mantel',
    },
  },
  {
    id: 'upper-mantle',
    depthMeters: 150000,
    layer: 'mantle',
    category: 'geology',
    title: {
      id: 'Mantel atas panas',
      en: 'Hot upper mantle',
    },
    fact: {
      id: 'USGS menulis bahwa pada kedalaman sekitar 100 sampai 200 kilometer, batuan mantel mendekati titik lelehnya. Zona panas dan padat ini membantu menjelaskan sumber magma dan gerak lempeng di atasnya.',
      en: 'USGS writes that at roughly 100 to 200 kilometers deep, mantle rock is near its melting point. This hot, dense zone helps explain magma generation and the plate motions above it.',
    },
    comparison: {
      id: 'Sekitar empat kali lebih dalam daripada Moho benua rata-rata.',
      en: 'About four times deeper than the average continental Moho.',
    },
    source: {
      label: 'USGS The Interior of the Earth',
      url: 'https://pubs.usgs.gov/gip/interior/index.html',
    },
    visual: {
      kind: 'mantle-flow',
      label: 'Lapisan mantel berpijar dengan arus lambat',
    },
  },
  {
    id: 'outer-core',
    depthMeters: 2890000,
    layer: 'core',
    category: 'geology',
    title: {
      id: 'Inti luar cair',
      en: 'Liquid outer core',
    },
    fact: {
      id: 'USGS menjelaskan bahwa inti luar bersifat cair dan tidak meneruskan gelombang geser. Gerakan logam cair pada lapisan ini berkaitan dengan terbentuknya medan magnet Bumi.',
      en: 'USGS explains that the outer core is liquid and does not transmit shear waves. Motion in this liquid metallic layer is tied to the generation of Earth’s magnetic field.',
    },
    comparison: {
      id: 'Jaraknya seperti penerbangan regional panjang, tetapi lurus ke bawah.',
      en: 'The distance is like a long regional flight, but straight down.',
    },
    source: {
      label: 'USGS Inside the Earth',
      url: 'https://pubs.usgs.gov/gip/dynamic/inside.html',
    },
    visual: {
      kind: 'liquid-core',
      label: 'Cincin logam cair mengelilingi pusat Bumi',
    },
  },
  {
    id: 'inner-core',
    depthMeters: 5150000,
    layer: 'core',
    category: 'geology',
    title: {
      id: 'Inti dalam padat',
      en: 'Solid inner core',
    },
    fact: {
      id: 'NASA menjelaskan bahwa inti dalam adalah bola padat dari besi dan nikel di pusat Bumi. Radiusnya sekitar 1.221 kilometer dan ia tetap padat karena tekanannya ekstrem.',
      en: 'NASA explains that the inner core is a solid sphere of iron and nickel at Earth’s center. Its radius is about 1,221 kilometers and it stays solid because the pressure is extreme.',
    },
    comparison: {
      id: 'Lebih dari lima ribu kilometer ke bawah, jauh di luar jangkauan bor manusia.',
      en: 'More than five thousand kilometers down, far beyond the reach of human drilling.',
    },
    source: {
      label: 'NASA Earth Facts',
      url: 'https://science.nasa.gov/earth/facts/',
    },
    visual: {
      kind: 'solid-core',
      label: 'Bola logam padat di pusat Bumi',
    },
  },
]);

export function validateEducationStops(stops: readonly EducationStop[]): string[] {
  const issues: string[] = [];
  const seenIds = new Set<string>();
  let previousDepth = Number.NEGATIVE_INFINITY;

  for (const stop of stops) {
    if (seenIds.has(stop.id)) {
      issues.push(`Stop "${stop.id}" has a duplicate id.`);
    } else {
      seenIds.add(stop.id);
    }

    if (stop.depthMeters <= 0) {
      issues.push(`Stop "${stop.id}" must have a depth greater than 0 meters.`);
    }

    if (stop.depthMeters <= previousDepth) {
      issues.push(`Stop "${stop.id}" must be deeper than the previous stop.`);
    }

    if (!VALID_LAYERS.has(stop.layer)) {
      issues.push(`Stop "${stop.id}" has an invalid layer "${String(stop.layer)}".`);
    }

    if (!VALID_CATEGORIES.has(stop.category)) {
      issues.push(`Stop "${stop.id}" has an invalid category "${String(stop.category)}".`);
    }

    if (stop.title.id.trim().length === 0) {
      issues.push(`Stop "${stop.id}" is missing title.id copy.`);
    }

    if (stop.title.en.trim().length === 0) {
      issues.push(`Stop "${stop.id}" is missing title.en copy.`);
    }

    if (stop.fact.id.trim().length === 0) {
      issues.push(`Stop "${stop.id}" is missing fact.id copy.`);
    }

    if (stop.fact.en.trim().length === 0) {
      issues.push(`Stop "${stop.id}" is missing fact.en copy.`);
    }

    if (stop.comparison.id.trim().length === 0) {
      issues.push(`Stop "${stop.id}" is missing comparison.id copy.`);
    }

    if (stop.comparison.en.trim().length === 0) {
      issues.push(`Stop "${stop.id}" is missing comparison.en copy.`);
    }

    if (!stop.source.url.startsWith('https://')) {
      issues.push(`Stop "${stop.id}" source.url must start with https://.`);
    }

    if (stop.visual.kind.trim().length === 0) {
      issues.push(`Stop "${stop.id}" is missing visual.kind.`);
    }

    if (stop.visual.label.trim().length === 0) {
      issues.push(`Stop "${stop.id}" is missing visual.label.`);
    }

    previousDepth = stop.depthMeters;
  }

  return issues;
}
