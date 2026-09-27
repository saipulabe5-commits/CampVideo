import { Recommendation } from '../entities/Recommendation';
import { KnowledgeDatabase } from '../entities/Knowledge';
import { SubtitleTranslationService } from './SubtitleTranslationService';

export class TitleGenerationService {
  /**
   * Detects whether the speech/transcription voice is in Indonesian or English
   */
  public static detectVoiceLanguage(
    rec?: Recommendation,
    knowledge?: KnowledgeDatabase,
    sampleText?: string
  ): 'id' | 'en' {
    const textCorpus = [
      sampleText || '',
      rec?.title || '',
      rec?.hookStrategy || '',
      ...(knowledge?.transcripts?.map((t) => t.text) || []),
    ].join(' ').toLowerCase();

    // Indonesian indicative words
    const indonesianKeywords = [
      'yang', 'dan', 'ini', 'itu', 'di', 'ke', 'dari', 'bisa', 'gak', 'tidak', 
      'parfum', 'kulit', 'wangi', 'banget', 'cowok', 'cewek', 'kaget', 'nyobain', 
      'seharian', 'sekarang', 'rahasia', 'muka', 'keranjang', 'kuning', 'promo', 
      'diskon', 'mampir', 'tanggalnya', 'beneran', 'pakai', 'buat', 'banyak',
      'minum', 'resep', 'masak', 'kenapa', 'harus', 'simak', 'tonton'
    ];

    let idScore = 0;
    for (const kw of indonesianKeywords) {
      const regex = new RegExp(`\\b${kw}\\b`, 'gi');
      const matches = textCorpus.match(regex);
      if (matches) idScore += matches.length;
    }

    // English indicative words
    const englishKeywords = [
      'the', 'this', 'that', 'with', 'from', 'teams', 'hours', 'video', 'editing', 
      'timeline', 'workflow', 'instead', 'manual', 'cloud', 'how', 'why', 'what', 'never', 'again'
    ];

    let enScore = 0;
    for (const kw of englishKeywords) {
      const regex = new RegExp(`\\b${kw}\\b`, 'gi');
      const matches = textCorpus.match(regex);
      if (matches) enScore += matches.length;
    }

    return idScore >= enScore ? 'id' : 'en';
  }

  /**
   * Extracts a clean, punchy topic keyword from recommendation and knowledge
   */
  private static extractCleanTopic(rec: Recommendation, knowledge?: KnowledgeDatabase): string {
    // 1. Check knowledge keywords if available
    if (knowledge?.keywords && knowledge.keywords.length > 0) {
      const topKw = knowledge.keywords[0]?.keyword;
      if (topKw && topKw.length > 2 && !/^(scene|clip|video|01|take|output)$/i.test(topKw)) {
        return topKw.replace(/[_.\-]+/g, ' ').trim();
      }
    }

    // 2. Extract from recommendation title
    let raw = rec.title || '';
    raw = raw
      .replace(/\(Option \d+.*?\)/gi, '')
      .replace(/\(Opsi \d+.*?\)/gi, '')
      .replace(/\(Texture Proof\)/gi, '')
      .replace(/\(Fast Promo CTA\)/gi, '')
      .replace(/\(Opsi Hook Cepat\)/gi, '')
      .replace(/\(Opsi Solusi & CTA\)/gi, '')
      .replace(/tentang scene/gi, '')
      .replace(/\bscene\b/gi, '')
      .trim();

    if (raw.length > 3) {
      // If it ends with punctuation like !, remove it for topic
      return raw.replace(/[!?:.]+$/, '').trim();
    }

    // 3. Fallback from hookStrategy
    if (rec.hookStrategy && rec.hookStrategy.length > 4) {
      return rec.hookStrategy.slice(0, 36).trim();
    }

    return 'Konten Viral';
  }

  /**
   * Generates high-converting, viral AI title and hook suggestions tailored to the video topic
   */
  public static generateTitles(
    rec: Recommendation,
    knowledge?: KnowledgeDatabase,
    language?: 'id' | 'en'
  ): string[] {
    const lang = language || 'id';

    const corpus = [
      rec.title || '',
      rec.hookStrategy || '',
      rec.reason || '',
      ...(knowledge?.transcripts?.map((t) => t.text) || []),
      ...(knowledge?.keywords?.map((k) => k.keyword) || []),
    ].join(' ').toLowerCase();

    const topic = this.extractCleanTopic(rec, knowledge);
    const upperTopic = topic.toUpperCase();

    // Specific category detection
    const isWater = /minum air|air putih|hidrasi|kenapa harus minum|rajin minum air/i.test(corpus);
    const isFood = /resep|masak|kuliner|makan|food|ayam|dapur|bumbu|goreng|panggang|chef|resto/i.test(corpus);
    const isBeauty = /skincare|serum|kulit|wajah|glowing|sunscreen|parfum|perfume|wangi|makeup|beauty/i.test(corpus);
    const isTech = /review|unboxing|gadget|hp|iphone|android|laptop|game|gaming|tech|pc/i.test(corpus);
    const isFitness = /workout|gym|fitness|diet|olahraga|sehat|cardio|senam|kalori/i.test(corpus);
    const isBiz = /bisnis|omset|cuan|marketing|jual|investasi|crypto|saham|startup|closing/i.test(corpus);
    const isIslamic = /dakwah|ceramah|santri|adab doa|baca doa|mengaji|pesantren|kajian/i.test(corpus);

    if (lang === 'id') {
      if (isWater) {
        return [
          'KENAPA HARUS RAJIN MINUM AIR PUTIH?',
          'RAHASIA TUBUH TETAP SEHAT & TERHIDRASI!',
          'JANGAN LUPA MINUM AIR SEKARANG BIAR BUGAR!',
          'TIPS SEHAT SEDERHANA: CUKUPI KEBUTUHAN AIR!',
          'EFEK LUAR BIASA RAJIN MINUM AIR PUTIH!',
          'YUK MINUM AIR SEKARANG BERSAMA-SAMA!',
        ];
      }

      if (isFood) {
        return [
          `RAHASIA ${upperTopic} SUPER LEZAT & ANTI GAGAL!`,
          'KUNCINYA ADA DI BUMBU DAN TEKNIK INI!',
          `RESEP ${upperTopic} PALING ENAK DIBIKIN DI RUMAH!`,
          'SAVE RESEP INI SEBELUM HILANG YA!',
          'DIJAMIN BIKIN NAGIH DAN DISUKAI SEMUA KELUARGA!',
          'COBAIN SEKARANG! TRIK MASAK LEZAT & PRAKTIS',
        ];
      }

      if (isBeauty) {
        return [
          `RAHASIA ${upperTopic} GLOWING & SEGAR SEHARIAN!`,
          'JANGAN SAMPAI SALAH URUTAN PEMAKAIAN YA!',
          'FORMULA RINGAN GAK LENGKET DENGAN HASIL NYATA!',
          'SPILL PRODUK VIRAL INI SEBELUM KEHABISAN!',
          'AUTO PERCAYA DIRI! REKOMENDASI WAJIB PUNYA',
          'CEK KERANJANG KUNING SEKARANG SELAGI PROMO!',
        ];
      }

      if (isTech) {
        return [
          `REVIEW JUJUR: APAKAH ${upperTopic} MASIH WORTH IT?`,
          'JANGAN BELI DULU SEBELUM NONTON REVIEW INI!',
          'PERFORMA DAN KETAHANANNYA DI LUAR EKSPEKTASI!',
          'KELEBIHAN & KEKURANGAN YANG WAJIB KAMU TAHU!',
          'TES SEHARIAN PENUH: HASILNYA MENGEJUTKAN!',
          'CEK HARGA PROMO TERBARUNYA SEKARANG!',
        ];
      }

      if (isFitness) {
        return [
          `CUKUP 5 MENIT! GERAKAN ${upperTopic} BAKAR KALORI`,
          'LAKUKAN INI SETIAP HARI UNTUK HASIL MAKSIMAL!',
          'TIPS KONSISTEN OLAHRAGA DENGAN GERAKAN EFISIEN!',
          'RAHASIA OTOT KENCANG DAN TUBUH LEBIH BUGAR!',
          'SAVE VIDEO INI DAN MULAI HARI INI JUGA!',
          'PEMULA WAJIB TAHU! FORM GERAKAN YANG TEPAT',
        ];
      }

      if (isBiz) {
        return [
          `STRATEGI ${upperTopic} YANG BIKIN HASIL BERLIPAT!`,
          'BANYAK YANG STUCK KARENA BELUM TAHU FRAMEWORK INI!',
          'KUNCI TINGKATKAN KONVERSI TANPA BUANG BUDGET!',
          'CARA PRAKTIS SCALE-UP BISNIS DI TAHUN INI!',
          'RAHASIA FUNNEL PENJUALAN YANG TERBUKTI EFEKTIF!',
          'SHARE KE TIM KAMU DAN PRAKTIKKAN SEKARANG!',
        ];
      }

      if (isIslamic) {
        return [
          `PESAN PENTING & AMALAN BAIK HARI INI: ${upperTopic}`,
          'JANGAN LUPA SELALU MULAI DENGAN DOA & NIAT BAIK!',
          'MUTIARA HIKMAH YANG MENENANGKAN HATI!',
          'AMALKAN BERSAMA UNTUK HARI YANG LEBIH BERKAH!',
          'PELAJARAN BERHARGA YANG WAJIB KITA INGAT!',
          'SIMAK DAN BAGIKAN KEBAIKAN INI KE SESAMA!',
        ];
      }

      // General High-Converting Creator Titles
      return [
        `${upperTopic.length > 5 ? upperTopic : 'HIGHLIGHT PENTING INI'} WAJIB KAMU SIMAK!`,
        'RAHASIA PENTING YANG JARANG DIKETAHUI BANYAK ORANG!',
        'JANGAN LAKUKAN INI SEBELUM TAHU TRIK LENGKAPNYA!',
        'HASILNYA BENERAN BIKIN KAGET, SIMAK SAMPAI AKHIR!',
        'TRIK PRAKTIS DAN CEPAT YANG BIKIN BEDA JAUH!',
        'SAVE VIDEO INI SEKARANG DAN BAGIKAN KE TEMANMU!',
      ];
    }

    // English Titles
    if (isWater) {
      return [
        'WHY WE MUST DRINK ENOUGH WATER EVERY DAY!',
        'THE SECRET TO STAYING HYDRATED AND ENERGIZED!',
        'DRINK WATER NOW TO STAY FRESH AND HEALTHY!',
        'SIMPLE DAILY HABITS FOR BETTER HEALTH!',
        'DO NOT FORGET TO DRINK WATER TODAY!',
        'ESSENTIAL HYDRATION FACTS YOU NEED TO KNOW!',
      ];
    }

    if (isFood) {
      return [
        `SECRET RECIPE FOR THE BEST ${upperTopic}!`,
        'THE ONE COOKING TECHNIQUE YOU NEED TO MASTER!',
        'TRY THIS DELICIOUS RECIPE AT HOME TODAY!',
        'SAVE THIS RECIPE BEFORE YOU FORGET!',
        'EVERYONE IN THE FAMILY WILL LOVE THIS DISH!',
        'EASY, QUICK, AND INCREDIBLY TASTY HACK!',
      ];
    }

    if (isBeauty) {
      return [
        `THE SECRET TO ALL-DAY GLOWING SKIN: ${upperTopic}!`,
        'NEVER MAKE THIS APPLICATION MISTAKE AGAIN!',
        'LIGHTWEIGHT FORMULA WITH INSTANT REAL RESULTS!',
        'VIRAL MUST-HAVE PRODUCT SPILL BEFORE IT SELLS OUT!',
        'BOOST YOUR CONFIDENCE ALL DAY LONG!',
        'CHECK OUT TODAY WHILE SPECIAL PROMO LASTS!',
      ];
    }

    if (isTech) {
      return [
        `HONEST REVIEW: IS ${upperTopic} STILL WORTH IT?`,
        'DO NOT BUY THIS BEFORE WATCHING FULL BREAKDOWN!',
        'REAL-WORLD TESTING: EXCEEDED ALL EXPECTATIONS!',
        'KEY PROS AND CONS YOU ABSOLUTELY MUST KNOW!',
        'ALL-DAY BATTERY & PERFORMANCE VERDICT!',
        'CHECK LATEST PRICING AND AVAILABILITY NOW!',
      ];
    }

    return [
      `THE KEY HIGHLIGHT OF ${upperTopic} YOU MUST KNOW!`,
      'THE SECRET TRICK THAT CHANGES EVERYTHING!',
      'DO NOT MAKE THIS MISTAKE BEFORE YOU KNOW THIS!',
      'INCREDIBLE RESULTS: WATCH TILL THE VERY END!',
      'SIMPLE & PRACTICAL HACK FOR MAXIMUM RESULTS!',
      'SAVE THIS VIDEO RIGHT NOW AND SHARE WITH FRIENDS!',
    ];
  }
}
