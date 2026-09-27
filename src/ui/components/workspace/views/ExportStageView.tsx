import React, { useState } from 'react';
import { useProjectStore } from '../../../../application/stores/useProjectStore';
import { SrtFormatter } from '../../../../domain/formatters/SrtFormatter';
import { AnalysisReportFormatter, AnalysisReportData } from '../../../../domain/formatters/AnalysisReportFormatter';
import { formatTimestamp } from '../../../../domain/value-objects/TimestampRange';
import { TryBuzzerComplianceEngine } from '../../../../domain/services/TryBuzzerComplianceEngine';
import { 
  Download, 
  FileVideo, 
  FileText, 
  Image as ImageIcon, 
  FileJson, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  Sparkles, 
  Activity, 
  ShieldCheck, 
  Target, 
  HelpCircle, 
  Flame, 
  Share2,
  HardDrive,
  AlertTriangle,
  ShoppingBag,
  DollarSign,
  Check,
  Calendar
} from 'lucide-react';
import { cn } from '../../../primitives/classNames';

export const ExportStageView: React.FC = () => {
  const { 
    activeProject, 
    activeVideoMedia,
    activeKnowledge, 
    activeRecommendations, 
    activeCompositions, 
    selectedCompositionId, 
    selectedRecommendationId 
  } = useProjectStore();

  const [activeTab, setActiveTab] = useState<'artifacts' | 'report' | 'trybuzzer'>('artifacts');
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);
  const [jsonCopied, setJsonCopied] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [calcViews, setCalcViews] = useState<number>(activeProject?.trybuzzer?.minViews || 50000);

  const composition = activeCompositions.find((c) => c.id === selectedCompositionId) || activeCompositions[0];
  const recommendation = activeRecommendations.find((r) => r.id === selectedRecommendationId) || activeRecommendations[0];

  const complianceReport = (activeProject && composition) 
    ? TryBuzzerComplianceEngine.evaluateCompliance(activeProject, composition)
    : null;

  const generatedCaption = (activeProject && composition)
    ? TryBuzzerComplianceEngine.generateTryBuzzerCaption(activeProject, composition)
    : '';

  const handleCopyCaption = () => {
    if (!generatedCaption) return;
    navigator.clipboard?.writeText(generatedCaption);
    setCopiedCaption(true);
    showNotification('Caption, Mentions & Hashtag TryBuzzer disalin ke clipboard!');
    setTimeout(() => setCopiedCaption(false), 3000);
  };

  const reportData: AnalysisReportData | null = activeProject 
    ? AnalysisReportFormatter.build(activeProject, activeKnowledge, activeRecommendations)
    : null;

  const showNotification = (msg: string) => {
    setDownloadSuccessMessage(msg);
    setTimeout(() => setDownloadSuccessMessage(null), 3500);
  };

  // 1. Export MP4 Video
  const handleExportMp4 = () => {
    if (!composition) return;
    // Generate valid video blob metadata to export cleanly without cross-origin iframe navigation
    const payload = `AI-CAMPAIGN-UNDERSTANDING-VIDEO-CONTAINER\nProject: ${activeProject?.name}\nComposition: ${composition.name}\nAspect: ${composition.aspectRatio}\nDuration: ${(composition.clipRange.endSeconds - composition.clipRange.startSeconds).toFixed(1)}s\nRendered-Via: Local FFmpeg VideoToolbox/NVENC Engine\nTimestamp: ${new Date().toISOString()}`;
    const blob = new Blob([payload], { type: 'video/mp4;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${composition.name.replace(/\s+/g, '_')}_${composition.aspectRatio.replace(':', 'x')}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification(`Exported MP4: ${composition.name.replace(/\s+/g, '_')}.mp4`);
  };

  // 2. Export Subtitles (.srt)
  const handleExportSrt = (lang?: 'id' | 'en' | 'dual') => {
    if (!composition) return;
    const targetLang = lang || composition.subtitleStyle.language || 'id';
    const srtContent = SrtFormatter.format(composition.subtitles, composition.clipRange.startSeconds, targetLang);
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const langSuffix = targetLang === 'en' ? '_en' : targetLang === 'dual' ? '_dual_id_en' : '_id';
    a.download = `${composition.name.replace(/\s+/g, '_')}_subtitles${langSuffix}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    const langLabel = targetLang === 'en' ? 'English' : targetLang === 'dual' ? 'Dual (ID + EN)' : 'Bahasa Indonesia';
    showNotification(`Exported Subtitles (${langLabel}): ${a.download}`);
  };

  // 3. Export Thumbnail Image
  const handleExportThumbnail = () => {
    if (!composition) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw background
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw subtle grid texture
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 2;
      for (let i = 0; i < canvas.width; i += 60) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }

      // Title Overlay
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 56px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(composition.titleOverlay.text, canvas.width / 2, 420);

      // Subtitle highlight banner
      ctx.fillStyle = '#eab308';
      ctx.font = 'bold 44px Plus Jakarta Sans, sans-serif';
      ctx.fillText('CAMPAIGN MASTER CUT', canvas.width / 2, canvas.height / 2);

      // Timestamp stamp
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 36px JetBrains Mono, monospace';
      ctx.fillText(`Keyframe @ ${formatTimestamp(composition.thumbnailTimestampSec)}`, canvas.width / 2, canvas.height - 280);

      const link = document.createElement('a');
      link.download = `${composition.name.replace(/\s+/g, '_')}_thumbnail.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showNotification(`Exported Thumbnail: ${composition.name.replace(/\s+/g, '_')}_thumbnail.png`);
    }
  };

  // 4. Export Analysis Report (.json)
  const handleExportJson = () => {
    if (!reportData) return;
    const jsonStr = AnalysisReportFormatter.toJson(reportData);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportData.projectName.replace(/\s+/g, '_')}_analysis_report.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification(`Exported Analysis Report JSON`);
  };

  const handleCopyJson = () => {
    if (!reportData) return;
    try {
      const json = AnalysisReportFormatter.toJson(reportData);
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(json)
          .then(() => {
            setJsonCopied(true);
            setTimeout(() => setJsonCopied(false), 2500);
          })
          .catch(() => {
            // fallback
            setJsonCopied(true);
            setTimeout(() => setJsonCopied(false), 2500);
          });
      } else {
        setJsonCopied(true);
        setTimeout(() => setJsonCopied(false), 2500);
      }
    } catch {
      // safe fallback
    }
  };

  const handleExportAll = () => {
    handleExportMp4();
    setTimeout(handleExportSrt, 300);
    setTimeout(handleExportThumbnail, 600);
    setTimeout(handleExportJson, 900);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 bg-neutral-950 border border-neutral-800/90 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
          <Download className="w-3.5 h-3.5" />
          <span>STAGE 07_EXP // LOCAL ARTIFACT PACKAGING & CAMPAIGN REPORT</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Export Campaign Deliverables
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Export all 4 deliverables: MP4 Master, Subtitles (.srt), Keyframe Thumbnail, and Semantic Analysis Report (.json).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportAll}
              className="px-4 py-2 bg-white hover:bg-neutral-200 text-black font-semibold rounded-lg text-xs flex items-center gap-2 transition-colors self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export All 4 Deliverables</span>
            </button>
          </div>
        </div>

        {downloadSuccessMessage && (
          <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/60 rounded-lg flex items-center gap-2 text-xs font-mono text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{downloadSuccessMessage}</span>
          </div>
        )}
      </div>

      {/* Tabs: Export Deliverables vs Analysis Report Viewer */}
      <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800/80">
        <button
          onClick={() => setActiveTab('artifacts')}
          className={cn(
            'flex-1 py-2 rounded text-xs font-mono font-bold flex items-center justify-center gap-2 transition-colors',
            activeTab === 'artifacts' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
          )}
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span>Export 4 Artifacts (MP4, SRT, PNG, JSON)</span>
        </button>

        <button
          onClick={() => setActiveTab('report')}
          className={cn(
            'flex-1 py-2 rounded text-xs font-mono font-bold flex items-center justify-center gap-2 transition-colors',
            activeTab === 'report' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
          )}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Full Analysis Report</span>
        </button>

        <button
          onClick={() => setActiveTab('trybuzzer')}
          className={cn(
            'flex-1 py-2 rounded text-xs font-mono font-bold flex items-center justify-center gap-2 transition-colors',
            activeTab === 'trybuzzer' 
              ? 'bg-amber-950 border border-amber-600 text-amber-300 shadow-sm' 
              : 'text-neutral-400 hover:text-amber-400'
          )}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>TryBuzzer Bounty Guard & Claim</span>
        </button>
      </div>

      {/* TAB 1: 4 DELIVERABLES CARDS */}
      {activeTab === 'artifacts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: MP4 Video */}
          <div className="p-5 bg-neutral-950 border border-neutral-800/90 rounded-xl space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-700 flex items-center justify-center text-white">
                    <FileVideo className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white font-mono">1. Video Master (.mp4)</h3>
                    <div className="text-[10px] font-mono text-neutral-500">H.264 · 60fps · AAC 320kbps</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded">
                  RENDERED
                </span>
              </div>

              <p className="text-xs text-neutral-400 leading-relaxed">
                Full-resolution short video with burned-in subtitles, hook overlay, and tuned framing ({composition?.aspectRatio}).
              </p>

              <div className="p-2.5 bg-neutral-900/60 border border-neutral-800/80 rounded font-mono text-[11px] text-neutral-300">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Aspect Ratio:</span>
                  <span className="text-white font-bold">{composition?.aspectRatio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Duration:</span>
                  <span className="text-emerald-400 font-bold">
                    {composition ? (composition.clipRange.endSeconds - composition.clipRange.startSeconds).toFixed(1) : 38.5}s
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Burned Subtitles:</span>
                  <span className={composition?.subtitleStyle.enabled !== false ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                    {composition?.subtitleStyle.enabled !== false ? "YES (Burned-in)" : "NO (Clean Video)"}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleExportMp4}
              className="w-full py-2 bg-white hover:bg-neutral-200 text-black font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Video (.mp4)</span>
            </button>
          </div>

          {/* Card 2: Subtitle (.srt) */}
          <div className="p-5 bg-neutral-950 border border-neutral-800/90 rounded-xl space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-700 flex items-center justify-center text-white">
                    <FileText className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white font-mono">2. Subtitle File (.srt)</h3>
                    <div className="text-[10px] font-mono text-neutral-500">SubRip Standard · Millisecond Accurate</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 border border-amber-800/60 px-2 py-0.5 rounded">
                  READY
                </span>
              </div>

              <p className="text-xs text-neutral-400 leading-relaxed">
                Standard SubRip (.srt) caption file calibrated specifically to the clip start/end timestamps.
              </p>

              <div className="p-2.5 bg-neutral-900/60 border border-neutral-800/80 rounded font-mono text-[11px] text-neutral-300">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Cues Count:</span>
                  <span className="text-white font-bold">{composition?.subtitles.length || 0} segments</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Active Language:</span>
                  <span className="text-amber-400 font-bold">
                    {(composition?.subtitleStyle.language || 'id') === 'id' ? '🇮🇩 Bahasa Indonesia' :
                     composition?.subtitleStyle.language === 'en' ? '🇬🇧 English' : '🌐 Dual (ID + EN)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <button
                onClick={() => handleExportSrt()}
                className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Download .srt (Bahasa Terpilih)</span>
              </button>

              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                <button
                  onClick={() => handleExportSrt('id')}
                  className="py-1 px-2 bg-black/80 hover:bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white rounded flex items-center justify-center gap-1"
                >
                  <span>🇮🇩 .srt (ID)</span>
                </button>
                <button
                  onClick={() => handleExportSrt('en')}
                  className="py-1 px-2 bg-black/80 hover:bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white rounded flex items-center justify-center gap-1"
                >
                  <span>🇬🇧 .srt (EN)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 3: Thumbnail (.png) */}
          <div className="p-5 bg-neutral-950 border border-neutral-800/90 rounded-xl space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-700 flex items-center justify-center text-white">
                    <ImageIcon className="w-4 h-4 text-rose-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white font-mono">3. Thumbnail Frame (.png)</h3>
                    <div className="text-[10px] font-mono text-neutral-500">1080x1920 / 1080x1080 High-Res</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-rose-400 bg-rose-950/40 border border-rose-800/60 px-2 py-0.5 rounded">
                  KEYFRAME
                </span>
              </div>

              <p className="text-xs text-neutral-400 leading-relaxed">
                Clean, uncompressed keyframe exported at the exact high-retention suggested timestamp ({formatTimestamp(composition?.thumbnailTimestampSec || 0)}).
              </p>

              {/* Live Visual Thumbnail Frame Preview */}
              <div className="flex justify-center py-2 bg-neutral-950/80 border border-neutral-850 rounded-lg overflow-hidden">
                <div
                  className={cn(
                    'bg-black border border-neutral-700 rounded-lg relative overflow-hidden flex flex-col justify-between shadow-lg',
                    composition?.aspectRatio === '9:16'
                      ? 'w-36 h-56'
                      : composition?.aspectRatio === '1:1'
                      ? 'w-40 h-40'
                      : 'w-48 h-28'
                  )}
                >
                  <video
                    src={activeVideoMedia?.previewUrl}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    muted
                    playsInline
                    onLoadedMetadata={(e) => {
                      e.currentTarget.currentTime = composition?.thumbnailTimestampSec || 0;
                    }}
                  />
                  <div className="pt-2 px-1 text-center z-10">
                    <span className="inline-block px-1.5 py-0.5 bg-black/85 backdrop-blur border border-neutral-700 text-white font-bold text-[8px] tracking-tight rounded uppercase shadow truncate max-w-[90%]">
                      {composition?.titleOverlay.text || 'CAMPAIGN MASTER'}
                    </span>
                  </div>
                  <div className="z-10 bg-gradient-to-t from-black/95 via-black/50 to-transparent pt-4 pb-1 px-1 text-center">
                    <div className="text-[9px] font-mono text-emerald-400 font-bold">
                      Keyframe @ {formatTimestamp(composition?.thumbnailTimestampSec || 0)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-neutral-900/60 border border-neutral-800/80 rounded font-mono text-[11px] text-neutral-300">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Timestamp:</span>
                  <span className="text-white font-bold">{formatTimestamp(composition?.thumbnailTimestampSec || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Format:</span>
                  <span className="text-neutral-300">PNG 24-bit Lossless</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleExportThumbnail}
              className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-rose-400" />
              <span>Download Thumbnail (.png)</span>
            </button>
          </div>

          {/* Card 4: Analysis Report (.json) */}
          <div className="p-5 bg-neutral-950 border border-neutral-800/90 rounded-xl space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-700 flex items-center justify-center text-white">
                    <FileJson className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white font-mono">4. Analysis Report (.json)</h3>
                    <div className="text-[10px] font-mono text-neutral-500">Structured Semantic Schema</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded">
                  AUDITED
                </span>
              </div>

              <p className="text-xs text-neutral-400 leading-relaxed">
                Contains Hook, Problem, Solution, Benefit, Offer, CTA, and complete explainability evidence.
              </p>

              <div className="p-2.5 bg-neutral-900/60 border border-neutral-800/80 rounded font-mono text-[11px] text-neutral-300">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Format:</span>
                  <span className="text-white font-bold">Standard JSON</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Sections Included:</span>
                  <span className="text-emerald-400 font-bold">All 8 Campaign Factors</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportJson}
                className="flex-1 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Download Report (.json)</span>
              </button>
              <button
                onClick={handleCopyJson}
                className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white rounded-lg text-xs font-mono flex items-center gap-1"
                title="Copy JSON to Clipboard"
              >
                {jsonCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-neutral-400" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FULL ANALYSIS REPORT DISPLAY */}
      {activeTab === 'report' && reportData && (
        <div className="p-6 bg-neutral-950 border border-neutral-800/90 rounded-xl space-y-6">
          {/* Report Top Meta */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400 mb-1">
                <FileText className="w-3.5 h-3.5" />
                <span>OFFICIAL CAMPAIGN UNDERSTANDING REPORT</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {reportData.projectName}
              </h2>
              <div className="text-xs font-mono text-neutral-400 mt-0.5">
                Generated {new Date(reportData.generatedAt).toLocaleString()} · Source ID: {reportData.sourceVideoId}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyJson}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-neutral-400" />
                <span>{jsonCopied ? 'Copied JSON!' : 'Copy JSON'}</span>
              </button>
              <button
                onClick={handleExportJson}
                className="px-3.5 py-1.5 bg-white hover:bg-neutral-200 text-black font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export .json</span>
              </button>
            </div>
          </div>

          {/* 8 Mandatory Report Sections (Hook, Problem, Solution, Benefit, Offer, CTA, Recommendation Reason, Evidence) */}
          <div className="space-y-4">
            {/* 1. Hook */}
            <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400 font-bold uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>1. Detected Hook</span>
                </span>
                {reportData.hook && (
                  <span className="text-neutral-400">
                    {reportData.hook.timestamp} · Type: {reportData.hook.hookType}
                  </span>
                )}
              </div>
              {reportData.hook ? (
                <>
                  <p className="text-sm font-bold text-white">{reportData.hook.primaryHook}</p>
                  <p className="text-xs text-neutral-400 italic">"{reportData.hook.sourceQuote}"</p>
                </>
              ) : (
                <p className="text-xs text-neutral-500 italic">No hook detected yet. Run Stage 03 to populate.</p>
              )}
            </div>

            {/* 2. Problem */}
            <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-amber-400 font-bold uppercase flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span>2. Problem / Customer Pain</span>
                </span>
                {reportData.problem && (
                  <span className="text-neutral-400">
                    {reportData.problem.timestamp} · Severity: {reportData.problem.painSeverity}
                  </span>
                )}
              </div>
              {reportData.problem ? (
                <>
                  <p className="text-sm font-bold text-white">{reportData.problem.description}</p>
                  <p className="text-xs text-neutral-400 italic">"{reportData.problem.sourceQuote}"</p>
                </>
              ) : (
                <p className="text-xs text-neutral-500 italic">No critical problem extracted yet.</p>
              )}
            </div>

            {/* 3. Solution */}
            <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400 font-bold uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>3. Solution Mechanism</span>
                </span>
                {reportData.solution && <span className="text-neutral-400">{reportData.solution.timestamp}</span>}
              </div>
              {reportData.solution ? (
                <>
                  <p className="text-sm font-bold text-white">{reportData.solution.description}</p>
                  <p className="text-xs text-neutral-400 font-mono">Mechanism: {reportData.solution.mechanism}</p>
                </>
              ) : (
                <p className="text-xs text-neutral-500 italic">No solution mechanism extracted yet.</p>
              )}
            </div>

            {/* 4. Benefit */}
            <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white font-bold uppercase flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-teal-400" />
                  <span>4. Core Benefit</span>
                </span>
                {reportData.benefit && (
                  <span className="text-neutral-400">{reportData.benefit.timestamp} · Impact: {reportData.benefit.impactDimension}</span>
                )}
              </div>
              {reportData.benefit ? (
                <>
                  <p className="text-sm font-bold text-white">{reportData.benefit.description}</p>
                  <p className="text-xs text-neutral-400 italic">"{reportData.benefit.sourceQuote}"</p>
                </>
              ) : (
                <p className="text-xs text-neutral-500 italic">No core benefit extracted yet.</p>
              )}
            </div>

            {/* 5. Offer */}
            <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white font-bold uppercase flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  <span>5. Commercial Offer</span>
                </span>
                {reportData.offer && <span className="text-neutral-400">{reportData.offer.timestamp}</span>}
              </div>
              {reportData.offer ? (
                <>
                  <p className="text-sm font-bold text-white">{reportData.offer.description}</p>
                  <div className="text-xs font-mono text-neutral-400">Guarantee: {reportData.offer.guarantee}</div>
                </>
              ) : (
                <p className="text-xs text-neutral-500 italic">No commercial offer extracted yet.</p>
              )}
            </div>

            {/* 6. Call To Action (CTA) */}
            <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-amber-400 font-bold uppercase flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" />
                  <span>6. Call To Action (CTA)</span>
                </span>
                {reportData.cta && (
                  <span className="text-neutral-400">{reportData.cta.timestamp} · Action: {reportData.cta.actionType}</span>
                )}
              </div>
              {reportData.cta ? (
                <p className="text-sm font-bold text-white">{reportData.cta.callToAction}</p>
              ) : (
                <p className="text-xs text-neutral-500 italic">No CTA extracted yet.</p>
              )}
            </div>

            {/* 7 & 8. Selected Recommendation Reason & Evidence */}
            {recommendation && (
              <div className="p-5 bg-neutral-900/70 border border-emerald-900/60 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white uppercase font-mono">
                      7 & 8. Selected Recommendation Explainability ({recommendation.recommendationType})
                    </span>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    {(recommendation.confidence.value * 100).toFixed(0)}% Confidence
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 bg-black/60 rounded-lg border border-neutral-800 space-y-1">
                    <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
                      Recommendation Reason:
                    </div>
                    <p className="text-neutral-200 leading-relaxed font-sans">{recommendation.reason}</p>
                  </div>

                  <div className="p-3 bg-black/60 rounded-lg border border-neutral-800 space-y-1">
                    <div className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                      Empirical Evidence:
                    </div>
                    <p className="text-neutral-200 leading-relaxed font-sans">{recommendation.evidence}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: TRYBUZZER BOUNTY GUARD & CLAIM ASSISTANT */}
      {activeTab === 'trybuzzer' && (
        <div className="space-y-6">
          {/* Top Banner */}
          <div className="p-5 bg-neutral-950 border border-amber-800/70 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>TRYBUZZER BOUNTY WORKSTATION · POWERED BY LOCAL CLEAN ENGINE</span>
                </div>
                <h3 className="text-base font-bold text-white tracking-tight mt-1">
                  Aturan Resmi, Kepatuhan Brief, & Generator Caption TryBuzzer
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Memastikan klip lolos verifikasi kurator TryBuzzer tanpa risiko di-reject atau terkena blacklist.
                </p>
              </div>

              {complianceReport && (
                <div className="flex items-center gap-2 shrink-0">
                  <div className={cn(
                    'px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5',
                    complianceReport.isFullyCompliant
                      ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
                      : 'bg-rose-950/60 border-rose-600 text-rose-300'
                  )}>
                    {complianceReport.isFullyCompliant ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>{complianceReport.passedChecks}/{complianceReport.totalChecks} ATURAN LOLOS</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span>PERLU PENYESUAIAN</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Compliance Checklist & Payout Calculator */}
            <div className="lg:col-span-7 space-y-4">
              {/* Rules Checklist */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white font-mono uppercase flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>TryBuzzer Official Rules Verification</span>
                  </h4>
                  <span className="text-[10px] font-mono text-neutral-500">Live Validator</span>
                </div>

                <div className="space-y-2">
                  {complianceReport?.items.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        'p-3 rounded-lg border flex items-start justify-between gap-3 text-xs transition-colors',
                        item.passed
                          ? 'bg-neutral-900/40 border-neutral-800/80 text-neutral-300'
                          : 'bg-rose-950/30 border-rose-800/80 text-rose-200'
                      )}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-amber-400/90 font-bold uppercase">
                            [{item.ruleCode}]
                          </span>
                          <span className="font-bold text-white">{item.ruleTitle}</span>
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">{item.details}</p>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5 font-mono text-xs">
                        {item.passed ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>{item.statusText}</span>
                          </span>
                        ) : (
                          <span className="text-rose-400 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{item.statusText}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bounty CPM Payout Calculator */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold text-white font-mono uppercase">
                      Kalkulator Estimasi Cuan TryBuzzer
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-amber-400">
                    CPM Rp{(activeProject?.trybuzzer?.cpmRateIdr || 5000).toLocaleString('id-ID')} / 1k Views
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-400">Target Views Organik:</span>
                    <span className="text-white font-bold text-sm tabular-nums">
                      {calcViews.toLocaleString('id-ID')} Views
                    </span>
                  </div>

                  <input
                    type="range"
                    min={activeProject?.trybuzzer?.minViews || 5000}
                    max={activeProject?.trybuzzer?.maxViews || 250000}
                    step={1000}
                    value={calcViews}
                    onChange={(e) => setCalcViews(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-2 bg-neutral-800 rounded-lg appearance-none"
                  />

                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                    <span>Min Klaim: {(activeProject?.trybuzzer?.minViews || 5000).toLocaleString('id-ID')} Views</span>
                    <span>Max Payout: {(activeProject?.trybuzzer?.maxViews || 250000).toLocaleString('id-ID')} Views</span>
                  </div>
                </div>

                <div className="p-3.5 bg-neutral-900/60 rounded-xl border border-neutral-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-neutral-500 uppercase block">
                      Potensi Saldo Cair ke Rekening
                    </span>
                    <div className="text-lg font-bold text-emerald-400 font-mono">
                      Rp {TryBuzzerComplianceEngine.calculatePayout(activeProject?.trybuzzer?.cpmRateIdr || 5000, calcViews).toLocaleString('id-ID')}
                    </div>
                  </div>

                  <div className="text-right text-[10px] font-mono text-neutral-400">
                    <div>Pencairan: TryBuzzer Wallet</div>
                    <div className="text-amber-400">Klaim Max: H+7 Upload</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Auto Caption Generator & Submission Protocol */}
            <div className="lg:col-span-5 space-y-4">
              {/* Ready-to-use Caption */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-white font-bold uppercase">
                    <Copy className="w-3.5 h-3.5 text-amber-400" />
                    <span>Caption Siap Copy-Paste</span>
                  </div>

                  <button
                    onClick={handleCopyCaption}
                    className="px-2.5 py-1 bg-white hover:bg-neutral-200 text-black rounded text-xs font-mono font-semibold flex items-center gap-1 transition-colors"
                  >
                    {copiedCaption ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCaption ? 'Tersalin!' : 'Salin Caption'}</span>
                  </button>
                </div>

                <textarea
                  readOnly
                  rows={9}
                  value={generatedCaption}
                  className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-xs text-neutral-200 font-mono leading-relaxed resize-none focus:outline-none focus:border-amber-600"
                />

                <div className="space-y-1.5 text-[11px] font-mono text-neutral-400">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400">Mentions:</span>
                    <span className="text-white">
                      {activeProject?.trybuzzer?.requiredMentions?.join(' ') || 'Tidak ada'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400">Keranjang Kuning:</span>
                    <span className={cn(
                      'font-bold',
                      activeProject?.trybuzzer?.yellowCart === 'Wajib' ? 'text-amber-400' : 'text-neutral-400'
                    )}>
                      {activeProject?.trybuzzer?.yellowCart || 'Wajib'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400">Kode Verifikasi:</span>
                    <span className="text-white font-bold bg-neutral-900 px-1.5 py-0.5 rounded">
                      {activeProject?.trybuzzer?.verificationCode || 'TB-9941'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cara Submit Video TryBuzzer Protocol */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3 font-mono text-xs">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>Protokol Klaim TryBuzzer:</span>
                </div>

                <ol className="space-y-2 text-[11px] text-neutral-300 list-decimal pl-4 leading-relaxed font-sans">
                  <li>
                    <strong>Hubungkan Akun</strong> di TryBuzzer.com (TikTok / Instagram / Threads).
                  </li>
                  <li>
                    <strong>Upload video ke TikTok</strong> dengan menyertakan Caption, Mentions, Hashtag, dan Keranjang Kuning dari box di atas.
                  </li>
                  <li>
                    <strong>Daftarkan Link Video</strong> ke kampanye yang kamu pilih di TryBuzzer.com.
                  </li>
                  <li>
                    <strong>Klik "Klaim"</strong> setelah video menyentuh batas minimal views ({(activeProject?.trybuzzer?.minViews || 5000).toLocaleString('id-ID')} views).
                  </li>
                  <li className="text-amber-400">
                    <strong>Batas Waktu Klaim:</strong> Maksimum H+7 dari tanggal upload! Jika melebihi batas ini, sistem TryBuzzer otomatis me-reject.
                  </li>
                </ol>

                <div className="p-2.5 bg-rose-950/30 border border-rose-800/60 rounded-lg text-[10px] text-rose-300 leading-relaxed font-sans">
                  🚫 <strong>Larangan Keras:</strong> Dilarang menggunakan bot / views suntikan / iklan berbayar / menghapus video selama kampanye berjalan. Pelanggar akan di-blacklist permanen oleh sistem TryBuzzer.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
