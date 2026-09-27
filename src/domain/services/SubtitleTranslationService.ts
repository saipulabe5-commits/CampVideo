import { SubtitleCue } from '../entities/Composition';

// High-precision marketing, technical, conversational & video editing phrase dictionary
const EN_TO_ID_PHRASES: [RegExp, string][] = [
  // Video editing & workflow phrases
  [/understanding without timeline fatigue/gi, 'pemahaman konten tanpa lelah potong timeline'],
  [/without timeline fatigue/gi, 'tanpa lelah potong manual'],
  [/timeline fatigue/gi, 'kelelahan potong timeline'],
  [/instead of having a video editor watch a long recording three times/gi, 'daripada editor harus menonton rekaman panjang tiga kali'],
  [/instead of having a video editor watch/gi, 'daripada editor harus menonton'],
  [/a video editor watch/gi, 'editor menonton video'],
  [/editor watch a long recording/gi, 'editor menonton rekaman panjang'],
  [/editor watch/gi, 'editor menonton'],
  [/watch a long recording three times/gi, 'menonton rekaman panjang tiga kali'],
  [/watch a long recording/gi, 'menonton rekaman panjang'],
  [/a long recording three times/gi, 'rekaman panjang tiga kali'],
  [/a long recording/gi, 'rekaman panjang'],
  [/three times is killing creative output/gi, 'tiga kali mematikan produktivitas kreatif'],
  [/is killing creative output/gi, 'mematikan hasil kreatif'],
  [/killing creative output/gi, 'mematikan kreativitas tim'],
  [/creative output/gi, 'produktivitas kreatif'],
  [/chopping timelines instead of building high-converting campaigns/gi, 'memotong timeline alih-alih membuat kampanye konversi tinggi'],
  [/chopping timelines instead of strategizing campaign angles/gi, 'memotong timeline alih-alih menyusun strategi campaign'],
  [/chopping timelines instead of/gi, 'memotong timeline daripada'],
  [/chopping timelines/gi, 'memotong-motong timeline'],
  [/instead of building high-converting campaigns/gi, 'daripada fokus bikin campaign konversi tinggi'],
  [/instead of strategizing campaign angles/gi, 'alih-alih menyusun strategi campaign'],
  [/instead of manual editing/gi, 'daripada potong timeline manual'],
  [/understand your video instead of manual editing/gi, 'pahami video otomatis tanpa edit manual'],
  [/understand your video/gi, 'pahami isi video Anda'],
  [/teams spend 14 hours per week/gi, 'tim menghabiskan 14 jam per minggu'],
  [/teams spend 14 hours/gi, 'tim menghabiskan 14 jam'],
  [/legacy video editing has hit a wall/gi, 'metode edit video konvensional sudah usang'],
  [/legacy video editing/gi, 'metode edit video konvensional'],
  [/has hit a wall/gi, 'sudah tidak efektif lagi'],
  [/our local knowledge extractor decomposes speech/gi, 'ekstraktor AI lokal membedah ucapan'],
  [/into hooks, core problems, validation evidence/gi, 'menjadi hook, masalah utama, bukti validasi'],
  [/and high-impact calls to action/gi, 'dan ajakan beli yang kuat'],
  [/download the local desktop build today/gi, 'download aplikasi desktop lokal hari ini'],
  [/download the local desktop build/gi, 'download versi desktop lokal'],
  [/experience instant campaign understanding/gi, 'rasakan kemudahan ekstrak campaign instan'],

  // Architecture & Local engine phrases
  [/here is the kicker:\s*all/gi, 'Inilah rahasianya: semua'],
  [/here is the kicker/gi, 'Inilah rahasianya'],
  [/the kicker/gi, 'kuncinya'],
  [/all rendering happens locally on your gpu using ffmpeg/gi, 'semua render berjalan lokal di GPU dengan FFmpeg'],
  [/all rendering happens locally/gi, 'semua render berjalan lokal'],
  [/rendering happens locally/gi, 'proses render berjalan lokal'],
  [/on your gpu using ffmpeg/gi, 'di GPU Anda memakai FFmpeg'],
  [/on your gpu/gi, 'di GPU komputer Anda'],
  [/using ffmpeg/gi, 'menggunakan engine FFmpeg'],
  [/no massive video files ever leave your desktop/gi, 'tidak ada file video besar yang keluar dari komputer Anda'],
  [/no massive video files/gi, 'tidak ada file video besar'],
  [/ever leave your desktop/gi, 'yang keluar dari perangkat'],
  [/leave your desktop/gi, 'keluar dari komputer Anda'],
  [/everything stays offline and encrypted in your local project database/gi, 'semuanya tersimpan offline dan terenkripsi di proyek lokal'],
  [/everything stays offline/gi, 'semuanya tersimpan 100% offline'],
  [/and encrypted in your local/gi, 'dan aman terenkripsi lokal'],
  [/in your local project database/gi, 'di database proyek lokal Anda'],
  [/in your local project/gi, 'di proyek lokal Anda'],
  [/encrypted in your local project/gi, 'terenkripsi aman di proyek lokal Anda'],
  [/never upload 10gb video to the cloud again/gi, 'jangan pernah upload video 10GB ke cloud lagi'],
  [/never upload a 10gb video/gi, 'jangan pernah upload video 10GB'],
  [/to the cloud again/gi, 'ke server cloud lagi'],
  [/100% local gpu rendering/gi, '100% proses render di GPU lokal'],
  [/zero cloud egress/gi, '100% lokal tanpa upload cloud'],
  [/from long-form to viral shorts/gi, 'dari video panjang jadi video pendek viral'],
  [/stop wasting hours on video timelines today/gi, 'hentikan buang waktu potong video sekarang'],
  [/stop wasting hours/gi, 'stop buang waktu berjam-jam'],
  [/instant 1-click viral subtitles/gi, 'subtitle viral instan 1-klik'],
  [/bold contrarian disruption/gi, 'sudut pandang berani pemecah pasar'],

  // E-commerce & Creator phrases
  [/checkout now/gi, 'checkout sekarang'],
  [/tiktok shop cart/gi, 'keranjang kuning TikTok'],
  [/long-lasting fragrance all day/gi, 'wangi tahan seharian'],
  [/smells incredible/gi, 'wanginya enak banget'],
  [/local premium perfume/gi, 'parfum lokal premium'],
  [/non-sticky/gi, 'gak lengket'],
  [/zero white cast/gi, 'tanpa white cast'],
  [/dull skin/gi, 'kulit kusam'],
  [/glowing radiant skin/gi, 'kulit glowing sehat'],
  [/skincare secret/gi, 'rahasia kulit sehat'],
  [/youthful look/gi, 'tampak awet muda'],
  [/must-have essentials/gi, 'produk wajib punya'],
  [/special discount/gi, 'diskon spesial'],
  [/limited time only/gi, 'terbatas hari ini'],
  [/free shipping/gi, 'gratis ongkir'],
  [/save the date/gi, 'catat tanggalnya'],
  [/before the promo ends/gi, 'sebelum promo berakhir'],
  [/click the link/gi, 'klik linknya'],
];

// Word-by-word translation dictionary
const EN_TO_ID_WORDS: Record<string, string> = {
  'here': 'di sini',
  'is': 'adalah',
  'are': 'adalah',
  'was': 'adalah',
  'were': 'adalah',
  'the': '',
  'a': 'sebuah',
  'an': 'sebuah',
  'kicker': 'kuncinya',
  'all': 'semua',
  'rendering': 'render',
  'happens': 'berjalan',
  'locally': 'lokal',
  'on': 'di',
  'your': 'Anda',
  'gpu': 'GPU',
  'cpu': 'CPU',
  'using': 'memakai',
  'ffmpeg': 'FFmpeg',
  'no': 'tanpa',
  'massive': 'besar',
  'video': 'video',
  'files': 'file',
  'ever': 'pernah',
  'leave': 'keluar dari',
  'desktop': 'komputer',
  'everything': 'semuanya',
  'stays': 'tetap',
  'offline': 'offline',
  'and': 'dan',
  'or': 'atau',
  'encrypted': 'terenkripsi',
  'in': 'di dalam',
  'project': 'proyek',
  'database': 'database',
  'legacy': 'konvensional',
  'editing': 'editing',
  'has': 'telah',
  'hit': 'mencapai',
  'wall': 'kebuntuan',
  'teams': 'tim',
  'spend': 'menghabiskan',
  'hours': 'jam',
  'per': 'per',
  'week': 'minggu',
  'chopping': 'memotong',
  'timelines': 'timeline',
  'timeline': 'timeline',
  'instead': 'alih-alih',
  'of': 'dari',
  'strategizing': 'merancang',
  'campaign': 'kampanye',
  'angles': 'sudut pandang',
  'with': 'dengan',
  'without': 'tanpa',
  'we': 'kami',
  'built': 'membangun',
  'ai': 'AI',
  'engine': 'mesin',
  'that': 'yang',
  'understands': 'memahami',
  'understanding': 'pemahaman',
  'narrative': 'narasi',
  'structure': 'struktur',
  'from': 'dari',
  'day': 'hari',
  'zero': 'nol',
  'to': 'ke',
  'for': 'untuk',
  'now': 'sekarang',
  'today': 'hari ini',
  'experience': 'rasakan',
  'instant': 'instan',
  'fatigue': 'kelelahan',
  'why': 'kenapa',
  'watching': 'menonton',
  'recordings': 'rekaman',
  'recording': 'rekaman',
  'three': 'tiga',
  'times': 'kali',
  'killing': 'mematikan',
  'creative': 'kreatif',
  'output': 'hasil',
  'having': 'membuat',
  'editor': 'editor',
  'watch': 'menonton',
  'long': 'panjang',
  'speech': 'ucapan',
  'into': 'menjadi',
  'hooks': 'hook',
  'core': 'utama',
  'problems': 'masalah',
  'validation': 'validasi',
  'evidence': 'bukti',
  'high-impact': 'berdampak tinggi',
  'calls': 'ajakan',
  'action': 'bertindak',
  'never': 'jangan pernah',
  'upload': 'unggah',
  'cloud': 'cloud',
  'again': 'lagi',
  'direct': 'langsung',
  'metric': 'metrik',
  'shock': 'kejutan',
  'wasted': 'terbuang',
  'every': 'setiap',
  'stop': 'hentikan',
  'wasting': 'buang-buang',
  'secret': 'rahasia',
  'proven': 'terbukti',
  'best': 'terbaik',
  'review': 'ulasan',
  'must': 'wajib',
  'have': 'punya',
  'try': 'coba',
  'results': 'hasil',
  'fast': 'cepat',
  'easy': 'mudah',
};

const ID_TO_EN_PHRASES: [RegExp, string][] = [
  [/semua render berjalan lokal/gi, 'all rendering happens locally'],
  [/render berjalan lokal/gi, 'rendering happens locally'],
  [/di gpu anda memakai ffmpeg/gi, 'on your GPU using FFmpeg'],
  [/di gpu komputer anda/gi, 'on your local GPU'],
  [/tanpa file video besar/gi, 'no massive video files'],
  [/tidak ada file video besar/gi, 'no massive video files'],
  [/keluar dari komputer anda/gi, 'ever leave your desktop'],
  [/semuanya tersimpan offline/gi, 'everything stays offline'],
  [/terenkripsi di proyek lokal/gi, 'encrypted in your local project'],
  [/jangan pernah upload video/gi, 'never upload video'],
  [/ke cloud lagi/gi, 'to the cloud again'],
  [/alih-alih dari membuat sebuah video/gi, 'instead of having a video'],
  [/alih-alih membuat video/gi, 'instead of making a video'],
  [/daripada membuat video/gi, 'instead of creating videos'],
  [/editor menonton rekaman panjang/gi, 'editor watching a long recording'],
  [/editor harus menonton/gi, 'editor has to watch'],
  [/menonton rekaman panjang tiga kali/gi, 'watch a long recording three times'],
  [/tiga kali mematikan produktivitas/gi, 'three times is killing productivity'],
  [/memotong-motong timeline/gi, 'chopping timelines'],
  [/memotong timeline/gi, 'chopping timelines'],
  [/bismillah sebelum minum/gi, 'bismillah before drinking'],
  [/jangan lupa baca doa/gi, 'do not forget to pray'],
  // Conversational, Islamic & Kid storytelling phrases
  [/hai teman-teman/gi, 'hi friends'],
  [/teman-teman/gi, 'friends'],
  [/simak pesan baik ini/gi, 'listen to this good message'],
  [/simak pesan ini/gi, 'listen to this message'],
  [/pesan penting/gi, 'important message'],
  [/pesan baik/gi, 'good message'],
  [/niat baik dan doa/gi, 'good intentions and prayer'],
  [/niat baik/gi, 'good intention'],
  [/baca doa/gi, 'say a prayer'],
  [/adab yang baik/gi, 'good manners'],
  [/adab baik/gi, 'good manners'],
  [/selalu mulai hari/gi, 'always start the day'],
  [/selalu mulai/gi, 'always start'],
  [/yuk amalkan bersama/gi, "let's practice this together"],
  [/yuk amalkan/gi, "let's practice this"],
  [/bagikan ke teman-temanmu/gi, 'share with your friends'],
  [/bagikan ke temanmu/gi, 'share with your friends'],
  [/bagikan ke teman/gi, 'share with friends'],
  [/semoga berkah/gi, 'may it be blessed'],
  [/semoga bermanfaat/gi, 'hope this is helpful'],
  [/kenapa harus minum air/gi, 'why should we drink water'],
  [/kenapa harus/gi, 'why should we'],
  [/tubuh tetap terhidrasi/gi, 'body stays hydrated'],
  [/tahukah kamu/gi, 'did you know'],
  [/jangan lupa baca doa/gi, 'do not forget to pray'],
  [/jangan lupa selalu/gi, 'do not forget to always'],
  [/jangan lupa/gi, 'do not forget to'],
  [/gunakan tangan kanan/gi, 'use your right hand'],
  [/minum sambil duduk/gi, 'drink while sitting down'],
  [/keranjang kuning/gi, 'TikTok shop cart'],
  [/checkout sekarang/gi, 'checkout now'],
  [/wanginya tahan seharian/gi, 'long-lasting fragrance all day'],
  [/wangi banget/gi, 'smells incredible'],
  [/parfum lokal/gi, 'local premium perfume'],
  [/gak lengket/gi, 'non-sticky'],
  [/tanpa white cast/gi, 'zero white cast'],
  [/kulit kusam/gi, 'dull skin'],
  [/kulit glowing/gi, 'glowing radiant skin'],
  [/rahasia kulit/gi, 'skincare secret'],
  [/awet muda/gi, 'youthful look'],
  [/wajib punya/gi, 'must-have essentials'],
  [/diskon spesial/gi, 'special discount'],
  [/terbatas hari ini/gi, 'limited time only'],
  [/gratis ongkir/gi, 'free shipping'],
  [/banyak yang gak nyangka/gi, 'many people did not expect'],
  [/kaget nyobain/gi, 'shocked after trying'],
  [/kayak parfum jutaan/gi, 'smells like a luxury perfume'],
  [/bikin percaya diri/gi, 'boosts your confidence'],
  [/nyaman dipakai seharian/gi, 'comfortable to wear all day'],
  [/jangan lupa mampir/gi, 'do not forget to visit'],
  [/save tanggalnya/gi, 'save the date'],
  [/sebelum promonya berakhir/gi, 'before the promo ends'],
  [/klik link/gi, 'click the link'],
];

const ID_TO_EN_WORDS: Record<string, string> = {
  'semua': 'all',
  'render': 'rendering',
  'berjalan': 'happens',
  'lokal': 'locally',
  'di': 'on',
  'dalam': 'in',
  'dengan': 'with',
  'tanpa': 'without',
  'anda': 'your',
  'kamu': 'your',
  'kami': 'we',
  'kita': 'we',
  'saya': 'I',
  'komputer': 'desktop',
  'perangkat': 'device',
  'tersimpan': 'stored',
  'terenkripsi': 'encrypted',
  'proyek': 'project',
  'video': 'video',
  'editor': 'editor',
  'rekaman': 'recording',
  'panjang': 'long',
  'tiga': 'three',
  'kali': 'times',
  'memotong': 'chopping',
  'potong': 'cut',
  'alih-alih': 'instead of',
  'daripada': 'instead of',
  'membuat': 'making',
  'menonton': 'watching',
  'sebelum': 'before',
  'sesudah': 'after',
  'minum': 'drinking',
  'makan': 'eating',
  'jangan': 'do not',
  'lupa': 'forget',
  'baca': 'read',
  'doa': 'prayer',
  'gunakan': 'use',
  'tangan': 'hand',
  'kanan': 'right',
  'kiri': 'left',
  'sambil': 'while',
  'duduk': 'sitting',
  'teman-teman': 'friends',
  'hari': 'day',
  'ini': 'this',
  'itu': 'that',
  'puasa': 'fasting',
  'berbuka': 'breaking fast',
  'keluarga': 'family',
  'berkah': 'blessing',
  'rahasia': 'secret',
  'penting': 'important',
  'banyak': 'many',
  'orang': 'people',
  'tahu': 'know',
  'tonton': 'watch',
  'sampai': 'until',
  'habis': 'end',
  'biar': 'so that',
  'produk': 'product',
  'wajib': 'must-have',
  'coba': 'try',
  'diskon': 'discount',
  'spesial': 'special',
  'gratis': 'free',
  'ongkir': 'shipping',
  'hai': 'hi',
  'yuk': "let's",
  'simak': 'listen to',
  'pesan': 'message',
  'baik': 'good',
  'niat': 'intentions',
  'amalkan': 'practice',
  'bersama': 'together',
  'bagikan': 'share',
  'teman': 'friends',
  'adab': 'good manners',
  'poin': 'point',
  'tentang': 'about',
  'kenapa': 'why',
  'harus': 'should',
  'terhidrasi': 'hydrated',
};

export class SubtitleTranslationService {
  /**
   * Checks if a string contains identifiable Indonesian words
   */
  public static isLikelyIndonesian(text: string): boolean {
    if (!text || !text.trim()) return false;
    const idMarkers = [
      'yang', 'dan', 'di', 'ke', 'dari', 'ini', 'itu', 'bisa', 'gak', 'tidak', 'nggak',
      'kami', 'kita', 'saya', 'anda', 'kamu', 'mereka', 'semua', 'rahasia', 'kuncinya',
      'tanpa', 'alih-alih', 'daripada', 'membuat', 'menonton', 'potong', 'waktu', 'jam',
      'rekaman', 'pemahaman', 'kelelahan', 'unggah', 'terenkripsi', 'proyek', 'berjalan',
      'pakai', 'memakai', 'keluar', 'komputer', 'perangkat', 'tersimpan', 'aman', 'metode',
      'lama', 'efisien', 'buang', 'tiap', 'minggu', 'isi', 'mudah', 'rasakan', 'mati',
      'mematikan', 'panjang', 'ucapan', 'masalah', 'bukti', 'nyata', 'ajakan', 'beli',
      'kuat', 'jangan', 'pernah', 'besar', 'lagi', 'wangi', 'kulit', 'kusam', 'glowing',
      'minum', 'makan', 'baca', 'doa', 'bismillah', 'alhamdulillah', 'duduk'
    ];
    const words = text.toLowerCase().split(/[^a-zA-Z0-9]+/);
    return words.some((w) => idMarkers.includes(w));
  }

  /**
   * Detects if a text string is predominantly English
   */
  public static isLikelyEnglish(text: string): boolean {
    if (!text || !text.trim()) return false;
    if (this.isLikelyIndonesian(text)) return false;

    const enMarkers = [
      'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'without',
      'here', 'is', 'are', 'was', 'were', 'kicker', 'all', 'rendering', 'happens',
      'locally', 'using', 'ffmpeg', 'no', 'massive', 'video', 'files', 'ever', 'leave',
      'desktop', 'everything', 'stays', 'offline', 'encrypted', 'project', 'database',
      'legacy', 'editing', 'has', 'hit', 'wall', 'teams', 'spend', 'hours', 'per', 'week',
      'chopping', 'timelines', 'timeline', 'instead', 'strategizing', 'campaign', 'angles',
      'built', 'ai', 'engine', 'understands', 'understanding', 'narrative', 'structure',
      'from', 'day', 'zero', 'download', 'experience', 'instant', 'fatigue', 'why',
      'watching', 'recordings', 'recording', 'three', 'times', 'killing', 'creative',
      'output', 'having', 'editor', 'watch', 'long', 'speech', 'into', 'hooks', 'core',
      'problems', 'validation', 'evidence', 'high-impact', 'calls', 'action', 'never',
      'upload', 'cloud', 'again', 'stop', 'wasting', 'today', 'now', 'bold', 'option'
    ];
    const words = text.toLowerCase().split(/[^a-zA-Z0-9]+/);
    return words.some((w) => enMarkers.includes(w));
  }

  /**
   * Translates English text to Natural Bahasa Indonesia
   */
  public static translateEnToId(text: string): string {
    if (!text || !text.trim()) return '';

    let result = text.trim();

    // 1. Phase 1: Match multi-word marketing & contextual phrases
    for (const [regex, replacement] of EN_TO_ID_PHRASES) {
      result = result.replace(regex, replacement);
    }

    // 2. Phase 2: Word-by-word translation fallback
    const tokens = result.split(/(\s+|[,.:;!?]+)/);
    const translatedTokens = tokens.map((tok) => {
      const cleanLower = tok.toLowerCase().trim();
      if (EN_TO_ID_WORDS[cleanLower] !== undefined) {
        const replacement = EN_TO_ID_WORDS[cleanLower];
        if (!replacement) return ''; // Skip empty articles
        if (tok[0] === tok[0]?.toUpperCase() && tok.length > 1) {
          return replacement.charAt(0).toUpperCase() + replacement.slice(1);
        }
        return replacement;
      }
      return tok;
    });

    result = translatedTokens.join('').replace(/\s+/g, ' ').trim();
    return result || text;
  }

  /**
   * Translates Indonesian text to English
   */
  public static translateIdToEn(text: string): string {
    if (!text || !text.trim()) return '';

    let result = text.trim();
    for (const [regex, replacement] of ID_TO_EN_PHRASES) {
      result = result.replace(regex, replacement);
    }

    const tokens = result.split(/(\s+|[,.:;!?]+)/);
    const translatedTokens = tokens.map((tok) => {
      const cleanLower = tok.toLowerCase().trim();
      if (ID_TO_EN_WORDS[cleanLower] !== undefined) {
        const replacement = ID_TO_EN_WORDS[cleanLower];
        if (tok[0] === tok[0]?.toUpperCase() && tok.length > 1) {
          return replacement.charAt(0).toUpperCase() + replacement.slice(1);
        }
        return replacement;
      }
      return tok;
    });

    result = translatedTokens.join('').replace(/\s+/g, ' ').trim();
    return result || text;
  }

  /**
   * Formats a cue based on desired language target without corrupting valid text
   */
  public static getDisplayText(cue: SubtitleCue, lang: 'id' | 'en' | 'dual' = 'id'): string {
    const mainText = cue.text?.trim() || cue.textId?.trim() || cue.textEn?.trim() || '';
    if (lang === 'en') {
      return cue.textEn?.trim() || mainText;
    }
    if (lang === 'dual' && cue.textEn && cue.text && cue.textEn.toLowerCase() !== cue.text.toLowerCase()) {
      return `${mainText}\n(${cue.textEn.trim()})`;
    }
    return mainText;
  }

  /**
   * Transforms an array of cues to ensure BOTH textId (Indonesian) and textEn (English) are fully populated without destroying user edits
   */
  public static enrichBilingualCues(cues: readonly SubtitleCue[], activeLang: 'id' | 'en' | 'dual' = 'id'): SubtitleCue[] {
    return cues.map((cue) => {
      let textId = cue.textId?.trim() || '';
      let textEn = cue.textEn?.trim() || '';
      const rawText = cue.text?.trim() || '';

      // If textId is missing, derive it from textEn or rawText
      if (!textId) {
        if (textEn && this.isLikelyEnglish(textEn)) {
          textId = this.translateEnToId(textEn);
        } else {
          textId = rawText;
        }
      }

      // If textEn is missing, derive it from textId or rawText
      if (!textEn) {
        if (textId && this.isLikelyIndonesian(textId)) {
          textEn = this.translateIdToEn(textId);
        } else if (this.isLikelyEnglish(rawText)) {
          textEn = rawText;
        } else {
          textEn = this.translateIdToEn(rawText || textId);
        }
      }

      // Determine the active display text according to selected language
      let displayText = textId;
      if (activeLang === 'en') {
        displayText = textEn || textId;
      } else if (activeLang === 'dual') {
        displayText = textId !== textEn && textEn ? `${textId}\n(${textEn})` : textId;
      }

      return {
        ...cue,
        text: displayText || rawText,
        textId: textId || rawText,
        textEn: textEn || rawText,
      };
    });
  }
}
