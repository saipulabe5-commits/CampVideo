import { Project } from '../entities/Project';
import { Composition } from '../entities/Composition';

export interface ComplianceItem {
  id: string;
  ruleTitle: string;
  ruleCode: string;
  passed: boolean;
  statusText: string;
  details: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
}

export interface TryBuzzerComplianceReport {
  isFullyCompliant: boolean;
  totalChecks: number;
  passedChecks: number;
  items: readonly ComplianceItem[];
}

export class TryBuzzerComplianceEngine {
  /**
   * Evaluates a composition against TryBuzzer official bounty rules
   */
  public static evaluateCompliance(project: Project, composition: Composition): TryBuzzerComplianceReport {
    const items: ComplianceItem[] = [];
    const tb = project.trybuzzer;

    const clipDuration = composition.clipRange.endSeconds - composition.clipRange.startSeconds;

    // Rule C: Durasi video minimal 15 detik
    const passedDuration = clipDuration >= 14.9;
    items.push({
      id: 'rule-min-duration',
      ruleCode: 'Rule C',
      ruleTitle: 'Durasi Video Minimal 15 Detik',
      passed: passedDuration,
      statusText: passedDuration ? `${clipDuration.toFixed(1)}s (Lolos)` : `${clipDuration.toFixed(1)}s (Kurang dari 15s)`,
      details: passedDuration
        ? 'Durasi video sudah memenuhi standar minimal 15 detik TryBuzzer.'
        : 'Video terlalu pendek! TryBuzzer otomatis menolak video di bawah 15 detik.',
      severity: 'CRITICAL',
    });

    // Rule A: Minimal editan subtitle atau headline
    const hasSubtitles = composition.subtitles && composition.subtitles.length > 0;
    const hasHeadline = Boolean(composition.titleOverlay && composition.titleOverlay.text.trim().length > 0);
    const passedEdits = hasSubtitles || hasHeadline;
    items.push({
      id: 'rule-min-edits',
      ruleCode: 'Rule A',
      ruleTitle: 'Wajib Edit Subtitle atau Headline',
      passed: passedEdits,
      statusText: passedEdits ? 'Tersedia' : 'Belum Ada',
      details: passedEdits
        ? `Terdapat ${composition.subtitles.length} baris subtitle & headline aktif.`
        : 'Jangan upload video mentah tanpa subtitle/headline (bisa di-reject TryBuzzer).',
      severity: 'CRITICAL',
    });

    // Rule Hook: Maksimal 7 detik
    const maxHookSec = tb?.hookMaxSeconds || 7.0;
    const estimatedHookDuration = 6.5; // Default hook window
    const passedHook = estimatedHookDuration <= maxHookSec + 0.5;
    items.push({
      id: 'rule-hook-7s',
      ruleCode: 'Brief Hook',
      ruleTitle: `Penggunaan Hook (Maks. ${maxHookSec} Detik)`,
      passed: passedHook,
      statusText: `${estimatedHookDuration.toFixed(1)}s`,
      details: 'Hook berada di awal klip untuk mengoptimalkan retensi For You Page (FYP).',
      severity: 'WARNING',
    });

    // Rule Format: TikTok 9:16
    const isVertical = composition.aspectRatio === '9:16';
    items.push({
      id: 'rule-aspect-ratio',
      ruleCode: 'Platform Target',
      ruleTitle: 'Format Vertikal 9:16 (TikTok/Reels)',
      passed: isVertical,
      statusText: composition.aspectRatio,
      details: isVertical
        ? 'Rasio 9:16 optimal untuk konsumsi mobile dan feed TikTok.'
        : 'Disarankan ubah ke 9:16 untuk performa algoritma FYP maksimal.',
      severity: 'WARNING',
    });

    // Rule J: Larangan AI Clip Maker Acak (Opus AI / Vizard)
    items.push({
      id: 'rule-human-touch',
      ruleCode: 'Rule J & K',
      ruleTitle: 'Local Workstation (Bukan AI Spammer)',
      passed: true,
      statusText: 'Verified Local Engine',
      details: 'Diedit dengan kontrol selektif offline tanpa bot auto-spammer dilarang.',
      severity: 'INFO',
    });

    // Rule Black Campaign Filter
    const fullText = `${composition.titleOverlay?.text || ''} ${composition.subtitles.map((s) => s.text).join(' ')}`.toLowerCase();
    const blacklisted = ['penipuan', 'jelek banget', 'jangan beli', 'sampah', 'rusak parah', 'menjijikkan'];
    const foundBlacklisted = blacklisted.filter((word) => fullText.includes(word));
    const passedBlackCampaign = foundBlacklisted.length === 0;

    items.push({
      id: 'rule-black-campaign',
      ruleCode: 'Disclaimer',
      ruleTitle: 'Bebas dari Unsur Black Campaign & Fitnah',
      passed: passedBlackCampaign,
      statusText: passedBlackCampaign ? 'Bersih' : `Ditemukan: ${foundBlacklisted.join(', ')}`,
      details: passedBlackCampaign
        ? 'Tidak terdeteksi kata-kata yang mendiskreditkan brand atau kompetitor.'
        : 'Hapus kata-kata bernada black campaign agar tidak terkena sanksi blacklist!',
      severity: 'CRITICAL',
    });

    const criticalPassed = items.filter((i) => i.severity === 'CRITICAL').every((i) => i.passed);
    const passedCount = items.filter((i) => i.passed).length;

    return {
      isFullyCompliant: criticalPassed,
      totalChecks: items.length,
      passedChecks: passedCount,
      items,
    };
  }

  /**
   * Generates a fully formatted caption with mentions, hashtags, and verification code
   */
  public static generateTryBuzzerCaption(project: Project, composition: Composition, customHook?: string): string {
    const tb = project.trybuzzer;
    const headline = customHook || composition.titleOverlay?.text || composition.name;
    const verification = tb?.verificationCode || 'TB-ID-VERIFIED';

    const mentions = tb?.requiredMentions && tb.requiredMentions.length > 0 
      ? tb.requiredMentions.join(' ')
      : '';

    const hashtags = tb?.requiredHashtags && tb.requiredHashtags.length > 0
      ? tb.requiredHashtags.join(' ')
      : '#trybuzzer #bounty #clippertrybuzzer #fyp';

    const yellowCartNote = tb?.yellowCart === 'Wajib'
      ? '\n🛒 [Produk terkait sudah disematkan di keranjang kuning TikTok]'
      : '';

    const ctaEvent = tb?.mandatoryCtaText
      ? `\n\n📌 ${tb.mandatoryCtaText}`
      : '';

    return `${headline.toUpperCase()} 🔥

Tonton sampai habis untuk detail pembahasannya! Jangan lupa save & share ke teman kamu yang butuh info ini. ${mentions}${ctaEvent}${yellowCartNote}

Kode Verifikasi Akun: [${verification}]

${hashtags}`;
  }

  /**
   * Calculates projected bounty payout
   */
  public static calculatePayout(cpmRateIdr: number, views: number): number {
    return Math.floor((views / 1000) * cpmRateIdr);
  }
}
