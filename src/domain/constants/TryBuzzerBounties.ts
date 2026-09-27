export interface TryBuzzerBountyPreset {
  id: string;
  key: 'cave_duo_bahlul' | 'wardah_skinverse' | 'kahf_fuji' | 'custom';
  title: string;
  brand: string;
  cpmRateIdr: number;
  minViews: number;
  maxViews: number;
  platforms: {
    tiktok: boolean;
    instagram: boolean;
    threads: boolean;
  };
  mentions: {
    tiktok?: string;
    instagram?: string;
  };
  hashtags: readonly string[];
  yellowCart: 'Wajib' | 'Tidak Wajib';
  yellowCartLink?: string;
  sourceVideoUrls: readonly string[];
  hookMaxSeconds: number;
  niche: 'Product' | 'Beauty' | 'Entertainment' | 'General';
  objective: readonly string[];
  disclaimerNotes?: readonly string[];
  referenceHooks: readonly string[];
  mandatoryKeywords: readonly string[];
  dos: readonly string[];
  donts: readonly string[];
}

export const TRYBUZZER_CAMPAIGN_PRESETS: readonly TryBuzzerBountyPreset[] = [
  {
    id: 'tb-cave-duobahlul',
    key: 'cave_duo_bahlul',
    title: 'Cave X Duo Bahlul Gofar',
    brand: 'Cave Men Care',
    cpmRateIdr: 5000,
    minViews: 5000,
    maxViews: 250000,
    platforms: {
      tiktok: true,
      instagram: false,
      threads: false,
    },
    mentions: {
      tiktok: '@cave.id',
    },
    hashtags: [
      '#clippercavetrybuzzer',
      '#trybuzzerseptember',
      '#podcastduobahlulxcave',
    ],
    yellowCart: 'Wajib',
    yellowCartLink: 'Search langsung produknya di Akun Official Cave.id',
    sourceVideoUrls: [
      'https://youtu.be/bXPjYSFEAOI?si=zXm9xsK8t-3spMrI',
    ],
    hookMaxSeconds: 7,
    niche: 'Product',
    objective: [
      'Angkat pembahasan Talent dan Tamu podcast',
      'Angkat pembahasan Parfum Cave',
    ],
    disclaimerNotes: [
      'Penggunaan HOOK (Maks. 7 detik) bisa dari luar materi',
      'Keranjang Kuning WAJIB ditautkan pada video TikTok',
    ],
    referenceHooks: [
      'Gofar kaget nyobain parfum lokal yang aromanya kayak parfum jutaan!',
      'Alasan kenapa cowok wajib punya parfum yang tahan seharian.',
      'Duo Bahlul bongkar rahasia wangi yang disukai cewek.',
    ],
    mandatoryKeywords: ['Cave', 'Parfum Cave'],
    dos: [
      'Edit minimal subtitle atau headline',
      'Durasi video minimal 15 detik',
      'Sertakan mention @cave.id dan hashtag kampanye',
      'Sematkan keranjang kuning produk Cave',
    ],
    donts: [
      'Dilarang mencuri konten sesama clipper',
      'Dilarang menggunakan AI clip maker generik (Opus AI, Vizard, dll)',
      'Dilarang efek berlebihan atau suara aneh yang merusak esensi video',
      'Dilarang posting di akun yang tidak berniche Product',
      'Dilarang menggunakan bot / views suntikan / iklan berbayar',
    ],
  },
  {
    id: 'tb-wardah-skinverse',
    key: 'wardah_skinverse',
    title: 'Wardah: Teaser SkinVerse 2026 (NYC)',
    brand: 'Wardah Beauty',
    cpmRateIdr: 7000,
    minViews: 1000,
    maxViews: 300000,
    platforms: {
      tiktok: true,
      instagram: false,
      threads: false,
    },
    mentions: {},
    hashtags: [
      '#WardahSkinverseTeam',
      '#WardahSkinverse2026',
      '#WardahSkinLongevityClinic',
      '#WardahSkinverse',
    ],
    yellowCart: 'Tidak Wajib',
    sourceVideoUrls: [
      'https://www.tiktok.com/@aalmassaid/video/7673486258793942290',
      'https://www.instagram.com/p/DcBGe-yP21D/',
      'https://www.instagram.com/p/Db-r8T3z5_7/',
      'https://www.tiktok.com/@rachelvennya/video/7678593400714743060',
    ],
    hookMaxSeconds: 7,
    niche: 'Beauty',
    objective: [
      'Mempromosikan Event "Wardah Skin Longevity Clinic: 29 Sept - 6 Okt 2026 di Mall Ashta SCBD" di akhir video',
    ],
    disclaimerNotes: [
      'Setiap Clip WAJIB fokus ke promosi event "Wardah Skin Longevity Clinic"',
      'Klip yang ada unsur review produk maks. hanya 60% dari total durasi video',
      'Footage Skinverse 2025 WAJIB ditaruh di akhir video',
    ],
    referenceHooks: [
      'Rahasia skin longevity Ibu arash yang mukanya sehat, fresh, kayak masih 20 tahun',
      'Cita-cita punya skin longevity kayak ibu Arash, kulit sehat bening',
      'Pesona skin longevity ibu Aal',
      'Manifesting punya kulit sehat, cakep, baday kaya Caitlin',
      'Cita-cita punya skin longevity kayak Caitlin',
      'Produk yang dipake sama semua seleb',
    ],
    mandatoryKeywords: [
      'Wardah Skin Longevity Clinic',
      'Skin Longevity',
    ],
    dos: [
      'Alur: Hook (0-7s) -> Momen KOL pakai Wardah -> CTA Mention Event Ashta SCBD',
      'WAJIB memakai keyword Wardah Skin Longevity Clinic',
      'Durasi video minimal 15 detik dengan subtitle jelas',
      'Taruh footage Skinverse di akhir video',
    ],
    donts: [
      'DILARANG memakai hook yang sensitif & tidak sopan',
      'Dilarang porsi review produk melebihi 60% durasi total',
      'Dilarang menggunakan tools auto clip scraper Opus AI/Vizard',
    ],
  },
  {
    id: 'tb-kahf-fuji',
    key: 'kahf_fuji',
    title: 'Kahf x Fuji 2.0 (YC)',
    brand: 'Kahf Men',
    cpmRateIdr: 5000,
    minViews: 10000,
    maxViews: 1000000,
    platforms: {
      tiktok: true,
      instagram: false,
      threads: false,
    },
    mentions: {},
    hashtags: [
      '#kahfss2',
      '#Sunscreenkahffuji',
      '#SunscreenBiruKahf',
      '#fjn2309',
    ],
    yellowCart: 'Wajib',
    yellowCartLink: 'https://vt.tokopedia.com/t/ZS9AaUGsVJS4H-liZoc/',
    sourceVideoUrls: [
      'https://vt.tiktok.com/ZSqaY6hhe/',
    ],
    hookMaxSeconds: 7,
    niche: 'Product',
    objective: [
      'Mempromosikan produk Kahf SS Biru (Sunscreen)',
    ],
    disclaimerNotes: [
      'Hook BOLEH lebih dari 7 detik SELAMA masih sesuai Objective + TIDAK ADA UNSUR BLACK CAMPAIGN',
      'Keranjang Kuning Tokopedia/TikTok Shop WAJIB disematkan',
    ],
    referenceHooks: [
      'Fuji spill sunscreen andalan yang bikin kulit cowok anti kusam seharian!',
      'Gak heran Kahf SS Biru viral banget, formulanya bener-bener seringan itu.',
      'Perbedaan muka setelah rutin pakai Kahf Sunscreen Biru.',
    ],
    mandatoryKeywords: ['Kahf SS Biru', 'Sunscreen Kahf'],
    dos: [
      'Fokus promosi Kahf SS Biru',
      'Wajib sematkan link keranjang kuning',
      'Minimal durasi 15 detik dengan teks/headline jelas',
      'Pastikan akun berniche Product',
    ],
    donts: [
      'Dilarang Black Campaign (merusak/menjatuhkan reputasi/fitnah kompetitor)',
      'Dilarang menggunakan bot / views suntikan',
      'Dilarang menghapus video yang sudah disubmit ke campaign',
      'Dilarang menggunakan AI clip maker Opus AI / Vizard',
    ],
  },
];
