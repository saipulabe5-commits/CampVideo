import React, { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '../../../../application/stores/useProjectStore';
import { PipelineStage } from '../../../../domain/enums/PipelineStage';
import { formatTimestamp } from '../../../../domain/value-objects/TimestampRange';
import { TRYBUZZER_CAMPAIGN_PRESETS } from '../../../../domain/constants/TryBuzzerBounties';
import { 
  Scissors, 
  Type, 
  Sparkles, 
  Image as ImageIcon, 
  Play, 
  Pause, 
  ArrowRight, 
  Download, 
  Plus, 
  Check, 
  RefreshCw, 
  Layers, 
  Split, 
  Film, 
  Sliders, 
  Palette,
  X,
  MapPin,
  Languages,
  Globe,
  Flame,
  Trash2,
  FileText,
  Loader2
} from 'lucide-react';
import { cn } from '../../../primitives/classNames';
import { SubtitleTranslationService } from '../../../../domain/services/SubtitleTranslationService';
import { TitleGenerationService } from '../../../../domain/services/TitleGenerationService';
import { ViralThumbnailService } from '../../../../domain/services/ViralThumbnailService';

export const EditStageView: React.FC = () => {
  const { 
    activeProject, 
    activeVideoMedia,
    activeKnowledge,
    activeRecommendations, 
    selectedRecommendationId, 
    selectRecommendation,
    activeCompositions, 
    updateClipRange,
    toggleMergeSegment,
    updateSubtitleCueText,
    addSubtitleCue,
    deleteSubtitleCue,
    clearAllSubtitles,
    resetSubtitlesFromTranscripts,
    applySpecificVideoDialogue,
    transcribeCurrentVideoAudio,
    isTranscribingAudio,
    transcriptionProgressMessage,
    importCustomSubtitleScript,
    updateSubtitleStyle,
    updateSubtitleCueTiming,
    generateMoreTitles,
    selectTitleOverlay,
    updateTitleOverlay,
    updateThumbnailTimestamp,
    generateViralThumbnails,
    updateAspectRatio,
    selectStage 
  } = useProjectStore();

  const composition = activeCompositions[0];
  const activeRec = activeRecommendations.find((r) => r.id === (composition?.recommendationId || selectedRecommendationId)) || activeRecommendations[0];
  const detectedVoiceLang = TitleGenerationService.detectVoiceLanguage(activeRec, activeKnowledge || undefined);
  const [titleLanguage, setTitleLanguage] = useState<'id' | 'en'>(detectedVoiceLang);

  const [showPasteScriptModal, setShowPasteScriptModal] = useState(false);
  const [customScriptInput, setCustomScriptInput] = useState('');

  useEffect(() => {
    setTitleLanguage(detectedVoiceLang);
  }, [detectedVoiceLang, activeRec?.id]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const thumbnailVideoRef = useRef<HTMLVideoElement | null>(null);

  const tbPreset = activeProject?.trybuzzer?.campaignKey
    ? TRYBUZZER_CAMPAIGN_PRESETS.find((p) => p.key === activeProject.trybuzzer?.campaignKey)
    : null;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(composition?.clipRange.startSeconds || 0);
  const [activeTab, setActiveTab] = useState<'trim' | 'subtitles' | 'title' | 'thumbnail'>('trim');
  const [thumbnailExported, setThumbnailExported] = useState(false);
  const [mergeEnabled, setMergeEnabled] = useState(Boolean(composition?.mergedRange));
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const handleResetFromTranscripts = () => {
    resetSubtitlesFromTranscripts();
    setActionFeedback('✓ Subtitle berhasil disinkronkan dari data audio');
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleClearAllSubtitles = () => {
    if (window.confirm('Hapus semua baris subtitle?')) {
      clearAllSubtitles();
      setActionFeedback('✓ Semua baris subtitle telah dihapus');
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  const handleTranscribeAudio = async () => {
    setActionFeedback(null);
    const res = await transcribeCurrentVideoAudio();
    if (res.success) {
      setActionFeedback(res.message);
    } else {
      setActionFeedback(`⚠️ ${res.message}`);
    }
    setTimeout(() => setActionFeedback(null), 6000);
  };

  const handleApplyPastedScript = () => {
    if (!customScriptInput.trim()) return;
    importCustomSubtitleScript(customScriptInput);
    setShowPasteScriptModal(false);
    setCustomScriptInput('');
    setActionFeedback('✓ Naskah dialog berhasil diterapkan dan diselaraskan ke durasi klip video!');
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const clipStart = composition?.clipRange.startSeconds ?? 0;
  const clipEnd = composition?.clipRange.endSeconds ?? 38.5;
  const clipDuration = Math.max(0, clipEnd - clipStart);

  // String states to allow deleting all characters without resetting/locking
  const [startInput, setStartInput] = useState<string>(String(clipStart));
  const [endInput, setEndInput] = useState<string>(String(clipEnd));
  const [thumbnailInput, setThumbnailInput] = useState<string>(String(composition?.thumbnailTimestampSec ?? 0));

  useEffect(() => {
    if (composition) {
      setCurrentTime(composition.clipRange.startSeconds);
      setStartInput(String(composition.clipRange.startSeconds));
      setEndInput(String(composition.clipRange.endSeconds));
      setThumbnailInput(String(composition.thumbnailTimestampSec));
      if (videoRef.current) {
        videoRef.current.currentTime = composition.clipRange.startSeconds;
      }
      if (thumbnailVideoRef.current) {
        thumbnailVideoRef.current.currentTime = composition.thumbnailTimestampSec;
      }
    }
  }, [composition?.id, composition?.clipRange.startSeconds, composition?.clipRange.endSeconds, composition?.thumbnailTimestampSec]);

  useEffect(() => {
    if (thumbnailVideoRef.current && composition?.thumbnailTimestampSec !== undefined) {
      thumbnailVideoRef.current.currentTime = composition.thumbnailTimestampSec;
    }
  }, [composition?.thumbnailTimestampSec, activeVideoMedia?.previewUrl]);

  // Handlers for freeform text input with instant delete & parse
  const handleStartInputChange = (val: string) => {
    setStartInput(val);
    if (val.trim() !== '') {
      const parsed = parseFloat(val);
      if (!isNaN(parsed) && parsed >= 0 && parsed < clipEnd) {
        updateClipRange(parsed, clipEnd);
      }
    }
  };

  const handleStartInputBlur = () => {
    if (startInput.trim() === '') {
      setStartInput(String(clipStart));
      return;
    }
    const parsed = parseFloat(startInput);
    if (isNaN(parsed) || parsed < 0) {
      setStartInput(String(clipStart));
    } else if (parsed >= clipEnd) {
      const safe = Math.max(0, clipEnd - 1);
      setStartInput(String(safe));
      updateClipRange(safe, clipEnd);
    } else {
      setStartInput(String(parsed));
      updateClipRange(parsed, clipEnd);
    }
  };

  const handleEndInputChange = (val: string) => {
    setEndInput(val);
    if (val.trim() !== '') {
      const parsed = parseFloat(val);
      const maxLimit = activeVideoMedia?.durationSeconds || 300;
      if (!isNaN(parsed) && parsed > clipStart && parsed <= maxLimit) {
        updateClipRange(clipStart, parsed);
      }
    }
  };

  const handleEndInputBlur = () => {
    if (endInput.trim() === '') {
      setEndInput(String(clipEnd));
      return;
    }
    const parsed = parseFloat(endInput);
    const maxLimit = activeVideoMedia?.durationSeconds || 300;
    if (isNaN(parsed) || parsed <= clipStart) {
      const safe = Math.min(maxLimit, clipStart + 15);
      setEndInput(String(safe));
      updateClipRange(clipStart, safe);
    } else if (parsed > maxLimit) {
      setEndInput(String(maxLimit));
      updateClipRange(clipStart, maxLimit);
    } else {
      setEndInput(String(parsed));
      updateClipRange(clipStart, parsed);
    }
  };

  const adjustStart = (delta: number) => {
    const newStart = Math.max(0, Math.min(clipEnd - 1, Number((clipStart + delta).toFixed(1))));
    setStartInput(String(newStart));
    updateClipRange(newStart, clipEnd);
  };

  const adjustEnd = (delta: number) => {
    const maxLimit = activeVideoMedia?.durationSeconds || 300;
    const newEnd = Math.max(clipStart + 1, Math.min(maxLimit, Number((clipEnd + delta).toFixed(1))));
    setEndInput(String(newEnd));
    updateClipRange(clipStart, newEnd);
  };

  const setStartToPlayhead = () => {
    const cur = Number(currentTime.toFixed(1));
    if (cur < clipEnd) {
      setStartInput(String(cur));
      updateClipRange(cur, clipEnd);
    }
  };

  const setEndToPlayhead = () => {
    const cur = Number(currentTime.toFixed(1));
    if (cur > clipStart) {
      setEndInput(String(cur));
      updateClipRange(clipStart, cur);
    }
  };

  if (!composition) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-neutral-950 border border-neutral-800 rounded-2xl text-center space-y-3 font-mono">
        <Layers className="w-12 h-12 stroke-1 text-neutral-600" />
        <h2 className="text-sm font-bold text-white font-sans">No Composition Created Yet</h2>
        <p className="text-xs text-neutral-400 font-sans">
          Select one of the 3 AI campaign recommendations to start editing your clip.
        </p>
        <button
          onClick={() => selectStage(PipelineStage.RECOMMEND)}
          className="px-4 py-2 bg-white text-black font-semibold rounded-lg text-xs font-sans hover:bg-neutral-200"
        >
          View Recommendations
        </button>
      </div>
    );
  }

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (currentTime >= clipEnd) {
        videoRef.current.currentTime = clipStart;
      }
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      setCurrentTime(cur);
      // Auto-loop or pause when passing clipEnd
      if (cur >= clipEnd) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleSeek = (timeSec: number) => {
    setCurrentTime(timeSec);
    if (videoRef.current) {
      videoRef.current.currentTime = timeSec;
    }
  };

  const handleExportThumbnail = () => {
    setThumbnailExported(true);
    // Create a temporary canvas to capture snapshot or trigger image download
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw video frame if ready, otherwise solid background
      if (videoRef.current && videoRef.current.readyState >= 2) {
        try {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
          gradient.addColorStop(0, 'rgba(0,0,0,0.65)');
          gradient.addColorStop(0.3, 'rgba(0,0,0,0.1)');
          gradient.addColorStop(0.7, 'rgba(0,0,0,0.1)');
          gradient.addColorStop(1, 'rgba(0,0,0,0.85)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } catch {
          ctx.fillStyle = '#0a0a0a';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      } else {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(composition.titleOverlay?.text || 'CAMPAIGN HOOK', canvas.width / 2, 380);
      ctx.fillStyle = '#eab308';
      ctx.font = 'bold 36px Plus Jakarta Sans, sans-serif';
      ctx.fillText(`Frame @ ${formatTimestamp(composition.thumbnailTimestampSec)}`, canvas.width / 2, canvas.height - 240);

      try {
        const link = document.createElement('a');
        link.download = `thumbnail_${composition.name.replace(/\s+/g, '_')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch {
        // Safe fallback if toDataURL is tainted by cross-origin
      }
    }
    setTimeout(() => setThumbnailExported(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Stage Header */}
      <div className="p-5 bg-neutral-950 border border-neutral-800/90 rounded-xl space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
          <Scissors className="w-3.5 h-3.5" />
          <span>STAGE 05_EDT // CLIP EDITOR, SUBTITLES, TITLES, & THUMBNAIL</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Review & Customize Clip ({composition.aspectRatio})
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Simple high-speed refinement: trim boundaries, edit subtitle typography, pick AI-generated hooks, and export thumbnails.
            </p>
          </div>

          <button
            onClick={() => selectStage(PipelineStage.RENDER)}
            className="px-4 py-2 bg-white hover:bg-neutral-200 text-black font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <span>Proceed to Local Render</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Recommendation Switcher Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider shrink-0">
          Angle:
        </span>
        {activeRecommendations.map((rec) => {
          const isSelected = selectedRecommendationId === rec.id;
          const shortHookIndex = activeRecommendations
            .filter((r) => r.recommendationType === 'Short Hook')
            .findIndex((r) => r.id === rec.id);

          let displayLabel: string = rec.recommendationType;
          if (rec.recommendationType === 'Short Hook' && shortHookIndex >= 0) {
            const shortTag = rec.title.toLowerCase().includes('shock') || rec.title.toLowerCase().includes('curiosity') || rec.title.toLowerCase().includes('teaser')
              ? 'Shock'
              : rec.title.toLowerCase().includes('proof') || rec.title.toLowerCase().includes('texture') || rec.title.toLowerCase().includes('feature')
              ? 'Proof'
              : rec.title.toLowerCase().includes('cta') || rec.title.toLowerCase().includes('promo') || rec.title.toLowerCase().includes('invitation')
              ? 'CTA'
              : `Opsi ${shortHookIndex + 1}`;
            displayLabel = `Short Hook #${shortHookIndex + 1} (${shortTag})`;
          }

          return (
            <button
              key={rec.id}
              onClick={() => selectRecommendation(rec.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg border text-xs font-mono transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer',
                isSelected
                  ? 'bg-neutral-800 border-neutral-600 text-white font-bold shadow-sm ring-1 ring-neutral-500'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
              )}
            >
              <span className={cn(
                'w-2 h-2 rounded-full shrink-0',
                rec.recommendationType === 'Performance' ? 'bg-emerald-400' :
                rec.recommendationType === 'Storytelling' ? 'bg-amber-400' : 'bg-rose-400'
              )} />
              <span className="font-semibold">{displayLabel}</span>
              <span className="text-[10px] text-neutral-400 font-normal">
                (Klip {rec.duration.toFixed(0)}s · Hook ≤7s)
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Workspace Split: Preview Video Canvas (Left) + Editor Tabs (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Frame Preview with Subtitle Overlay */}
        <div className="lg:col-span-6 bg-neutral-950 border border-neutral-800/90 rounded-xl p-5 flex flex-col items-center justify-between space-y-4">
          <div className="w-full flex items-center justify-between text-xs font-mono">
            <span className="text-neutral-400">Frame Preview</span>
            <div className="flex items-center gap-1 bg-black p-1 rounded border border-neutral-800">
              {(['9:16', '1:1', '16:9'] as const).map((aspect) => (
                <button
                  key={aspect}
                  onClick={() => updateAspectRatio(aspect)}
                  className={cn(
                    'px-2 py-0.5 rounded text-[11px] font-mono transition-colors',
                    composition.aspectRatio === aspect ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-500 hover:text-white'
                  )}
                >
                  {aspect}
                </button>
              ))}
            </div>
          </div>

          {/* Canvas Aspect Box */}
          <div
            className={cn(
              'bg-black border-2 border-neutral-800 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-2xl transition-all',
              composition.aspectRatio === '9:16'
                ? 'w-64 h-[440px]'
                : composition.aspectRatio === '1:1'
                ? 'w-72 h-72'
                : 'w-80 h-48'
            )}
          >
            {/* HTML5 Video Behind */}
            <video
              ref={videoRef}
              src={activeVideoMedia?.previewUrl}
              onTimeUpdate={handleTimeUpdate}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
            />

            {/* Title Overlay Banner (0s - 3.5s or duration) */}
            {composition.titleOverlay.enabled !== false && composition.titleOverlay.text.trim() !== '' && (
              <div className="pt-4 px-3 text-center z-10">
                <span className="inline-block px-3 py-1 bg-black/85 backdrop-blur border border-neutral-700 text-white font-black text-[11px] tracking-tight rounded uppercase shadow-lg">
                  {composition.titleOverlay.text}
                </span>
              </div>
            )}

            {/* Center Play Button Overlay */}
            <button
              onClick={togglePlay}
              className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-black/90 transition-all z-20"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5 fill-white" />}
            </button>

            {/* Subtitle Words Box (Dynamically Styled with Spoken Word Karaoke Color Highlighting) */}
            {composition.subtitleStyle.enabled !== false && (() => {
              const activeCue = composition.subtitles.find(
                (s) => currentTime >= s.startSeconds && currentTime <= s.endSeconds
              );

              // Use active cue or first cue when paused near beginning
              const targetCue = activeCue || (composition.subtitles.length > 0 && Math.abs(currentTime - clipStart) <= 3.0 ? composition.subtitles[0] : null);
              if (!targetCue) return null;

              const displayText = (targetCue.text || targetCue.textId || targetCue.textEn || '').trim();
              if (!displayText) return null;

              const words = displayText.trim().split(/\s+/);
              if (words.length === 0) return null;

              // Calculate dynamic active word index based on playback time within this cue
              const cueDuration = Math.max(0.08, targetCue.endSeconds - targetCue.startSeconds);
              const elapsedInCue = Math.max(0, currentTime - targetCue.startSeconds);
              const cueProgress = Math.min(1, Math.max(0, elapsedInCue / cueDuration));
              
              const activeWordIndex = activeCue
                ? Math.min(words.length - 1, Math.floor(cueProgress * words.length))
                : 0;

              const highlightMode = composition.subtitleStyle.highlightStyle || 'KARAOKE_WORD';
              const highlightColor = composition.subtitleStyle.highlightColorHex || '#FACC15';
              const baseTextColor = composition.subtitleStyle.textColorHex || '#FFFFFF';

              return (
                <div
                  className={cn(
                    'absolute left-0 right-0 px-4 z-20 text-center drop-shadow-2xl pointer-events-none transition-all duration-100',
                    composition.subtitleStyle.position === 'TOP'
                      ? 'top-14'
                      : composition.subtitleStyle.position === 'CENTER'
                      ? 'top-1/2 -translate-y-1/2'
                      : 'bottom-6'
                  )}
                >
                  <p
                    className={cn(
                      'font-black leading-snug select-none text-center inline-block px-3.5 py-2 rounded-xl bg-black/60 backdrop-blur-[3px] shadow-2xl border border-white/10 transition-all',
                      composition.subtitleStyle.allCaps && 'uppercase'
                    )}
                    style={{
                      fontFamily: composition.subtitleStyle.fontFamily,
                      fontSize: `${composition.subtitleStyle.fontSizePt}px`,
                      color: baseTextColor,
                    }}
                  >
                    {words.map((word, wIdx) => {
                      const isCurrent = wIdx === activeWordIndex;
                      const isPast = wIdx < activeWordIndex;

                      if (highlightMode === 'NONE') {
                        return (
                          <span key={wIdx}>
                            <span>{word}</span>{' '}
                          </span>
                        );
                      }

                      if (highlightMode === 'BOX_POP') {
                        return (
                          <span key={wIdx} className="inline-block mx-0.5 my-0.5">
                            {isCurrent ? (
                              <span
                                className="inline-block px-2 py-0.5 rounded-md font-black text-black transform scale-110 transition-all duration-100 shadow-md"
                                style={{
                                  backgroundColor: highlightColor,
                                  textShadow: 'none',
                                }}
                              >
                                {word}
                              </span>
                            ) : (
                              <span style={{ color: baseTextColor }}>{word}</span>
                            )}{' '}
                          </span>
                        );
                      }

                      if (highlightMode === 'KARAOKE_FILL') {
                        const isLit = isPast || isCurrent;
                        return (
                          <span key={wIdx} className="inline-block mx-0.5">
                            <span
                              className={cn(
                                "transition-all duration-100",
                                isCurrent && "scale-105 inline-block font-black"
                              )}
                              style={{
                                color: isLit ? highlightColor : baseTextColor,
                                opacity: isLit ? 1 : 0.65,
                                textShadow: isLit ? `0 0 10px ${highlightColor}80, 0 2px 4px rgba(0,0,0,0.9)` : undefined,
                              }}
                            >
                              {word}
                            </span>{' '}
                          </span>
                        );
                      }

                      if (highlightMode === 'COLOR_ONLY') {
                        return (
                          <span key={wIdx} className="inline-block mx-0.5">
                            <span
                              style={{
                                color: isCurrent ? highlightColor : baseTextColor,
                                textShadow: isCurrent ? `0 0 8px ${highlightColor}70` : undefined,
                              }}
                            >
                              {word}
                            </span>{' '}
                          </span>
                        );
                      }

                      // Default: KARAOKE_WORD (Word-by-word active pop with vibrant spoken color glow)
                      return (
                        <span key={wIdx} className="inline-block mx-0.5">
                          <span
                            className={cn(
                              "transition-all duration-100",
                              isCurrent ? "scale-110 font-black inline-block z-10" : "opacity-90"
                            )}
                            style={{
                              color: isCurrent ? highlightColor : baseTextColor,
                              textShadow: isCurrent 
                                ? `0 0 14px ${highlightColor}90, 0 2px 6px rgba(0,0,0,0.95)` 
                                : `0 2px 4px rgba(0,0,0,0.8)`,
                            }}
                          >
                            {word}
                          </span>{' '}
                        </span>
                      );
                    })}
                  </p>
                </div>
              );
            })()}
          </div>

          {/* Timeline Timecode & Play Controls */}
          <div className="w-full space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">
                  {formatTimestamp(currentTime)}
                </span>
                {currentTime - clipStart <= (activeProject?.trybuzzer?.hookMaxSeconds || 7.0) ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-300 font-mono">
                    HOOK ZONE (0 - {(activeProject?.trybuzzer?.hookMaxSeconds || 7)}s)
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono">
                    BODY SEGMENT
                  </span>
                )}
              </div>
              <span className="text-neutral-500">
                Range: {formatTimestamp(clipStart)} → {formatTimestamp(clipEnd)} ({clipDuration.toFixed(1)}s)
              </span>
            </div>

            {/* Scrub Slider */}
            <input
              type="range"
              min={clipStart}
              max={clipEnd}
              step="0.05"
              value={Math.max(clipStart, Math.min(clipEnd, currentTime))}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
            />
          </div>
        </div>

        {/* Right Column: 4 Review & Edit Modules (Trim, Subtitles, Title, Thumbnail) */}
        <div className="lg:col-span-6 bg-neutral-950 border border-neutral-800/90 rounded-xl p-5 space-y-4">
          {/* Sub-Navigation Tabs */}
          <div className="flex items-center gap-1 bg-black p-1 rounded-lg border border-neutral-800">
            <button
              onClick={() => setActiveTab('trim')}
              className={cn(
                'flex-1 py-1.5 rounded text-xs font-mono flex items-center justify-center gap-1.5 transition-colors',
                activeTab === 'trim' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400 hover:text-white'
              )}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Trim Clip</span>
            </button>

            <button
              onClick={() => setActiveTab('subtitles')}
              className={cn(
                'flex-1 py-1.5 rounded text-xs font-mono flex items-center justify-center gap-1.5 transition-colors',
                activeTab === 'subtitles' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400 hover:text-white'
              )}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Subtitles</span>
            </button>

            <button
              onClick={() => setActiveTab('title')}
              className={cn(
                'flex-1 py-1.5 rounded text-xs font-mono flex items-center justify-center gap-1.5 transition-colors',
                activeTab === 'title' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400 hover:text-white'
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Titles</span>
            </button>

            <button
              onClick={() => setActiveTab('thumbnail')}
              className={cn(
                'flex-1 py-1.5 rounded text-xs font-mono flex items-center justify-center gap-1.5 transition-colors',
                activeTab === 'thumbnail' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400 hover:text-white'
              )}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Thumbnail</span>
            </button>
          </div>

          {/* TAB 1: TRIM CLIP */}
          {activeTab === 'trim' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-white uppercase font-mono">
                  Clip Boundary Trimmer
                </h3>
                <p className="text-[11px] text-neutral-400">
                  Adjust in/out cut points directly. Avoid multi-track clutter.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                {/* START TIME INPUT BOX */}
                <div className="p-3 bg-neutral-900/70 border border-neutral-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-neutral-400 font-bold uppercase block">Start Time (sec)</label>
                    <button
                      type="button"
                      onClick={setStartToPlayhead}
                      title="Set to Current Playhead"
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-950/40 border border-emerald-800/60 px-1.5 py-0.5 rounded transition-colors"
                    >
                      <MapPin className="w-2.5 h-2.5" />
                      <span>Set Playhead ({formatTimestamp(currentTime)})</span>
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.0"
                      value={startInput}
                      onChange={(e) => handleStartInputChange(e.target.value)}
                      onBlur={handleStartInputBlur}
                      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                      className="w-full bg-black border border-neutral-700 focus:border-emerald-500 rounded px-2.5 py-2 text-white font-bold text-sm focus:outline-none pr-8 transition-colors"
                    />
                    {startInput.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setStartInput('');
                        }}
                        title="Delete / Kosongkan Angka"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[11px] text-emerald-400 font-bold">{formatTimestamp(clipStart)}</div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => adjustStart(-1)}
                        className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px]"
                      >
                        -1s
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustStart(1)}
                        className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px]"
                      >
                        +1s
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustStart(5)}
                        className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px]"
                      >
                        +5s
                      </button>
                    </div>
                  </div>
                </div>

                {/* END TIME INPUT BOX */}
                <div className="p-3 bg-neutral-900/70 border border-neutral-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-neutral-400 font-bold uppercase block">End Time (sec)</label>
                    <button
                      type="button"
                      onClick={setEndToPlayhead}
                      title="Set to Current Playhead"
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-950/40 border border-emerald-800/60 px-1.5 py-0.5 rounded transition-colors"
                    >
                      <MapPin className="w-2.5 h-2.5" />
                      <span>Set Playhead ({formatTimestamp(currentTime)})</span>
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.0"
                      value={endInput}
                      onChange={(e) => handleEndInputChange(e.target.value)}
                      onBlur={handleEndInputBlur}
                      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                      className="w-full bg-black border border-neutral-700 focus:border-emerald-500 rounded px-2.5 py-2 text-white font-bold text-sm focus:outline-none pr-8 transition-colors"
                    />
                    {endInput.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setEndInput('');
                        }}
                        title="Delete / Kosongkan Angka"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[11px] text-emerald-400 font-bold">{formatTimestamp(clipEnd)}</div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => adjustEnd(-5)}
                        className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px]"
                      >
                        -5s
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustEnd(-1)}
                        className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px]"
                      >
                        -1s
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustEnd(1)}
                        className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px]"
                      >
                        +1s
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Optional: Merge Segments */}
              <div className="p-3.5 bg-neutral-900/40 border border-neutral-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Split className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Merge End CTA Segment</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={mergeEnabled}
                    onChange={(e) => {
                      setMergeEnabled(e.target.checked);
                      toggleMergeSegment(e.target.checked);
                    }}
                    className="accent-emerald-500 w-4 h-4 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-neutral-400">
                  Automatically appends the high-converting outro/CTA (105.0s → 110.0s) to the rendered short clip.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: SUBTITLES */}
          {activeTab === 'subtitles' && (
            <div className="space-y-4">
              {/* Feedback toast */}
              {actionFeedback && (
                <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/80 rounded-lg text-xs font-mono text-emerald-300 flex items-center gap-2 animate-fade-in shadow-lg">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{actionFeedback}</span>
                </div>
              )}

              {/* MASTER SUBTITLE ON/OFF TOGGLE */}
              <div className={cn(
                "p-3.5 rounded-xl border transition-all flex items-center justify-between gap-4",
                composition.subtitleStyle.enabled !== false
                  ? "bg-neutral-900/80 border-emerald-500/40"
                  : "bg-neutral-950 border-neutral-800"
              )}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Status Subtitle Video</span>
                    <span className={cn(
                      "text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase",
                      composition.subtitleStyle.enabled !== false
                        ? "bg-emerald-950/80 border border-emerald-700 text-emerald-300"
                        : "bg-neutral-800 border border-neutral-700 text-neutral-400"
                    )}>
                      {composition.subtitleStyle.enabled !== false ? "SUBTITLE AKTIF (ON)" : "SUBTITLE NONAKTIF (OFF)"}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    {composition.subtitleStyle.enabled !== false
                      ? "Subtitle akan di-burn ke dalam frame video sesuai style & waktu yang diatur."
                      : "Video klip akan dirender bersih tanpa subtitle (clean video)."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => updateSubtitleStyle({ enabled: composition.subtitleStyle.enabled === false ? true : false })}
                  className={cn(
                    "relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    composition.subtitleStyle.enabled !== false ? "bg-emerald-500" : "bg-neutral-700"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      composition.subtitleStyle.enabled !== false ? "translate-x-6" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {/* QUICK STYLE CONTROLS */}
              <div className={cn(
                "p-3.5 bg-neutral-900/50 border border-neutral-800 rounded-xl space-y-3 transition-opacity",
                composition.subtitleStyle.enabled === false && "opacity-50"
              )}>
                <div className="text-[11px] font-mono font-bold text-neutral-300 uppercase flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Pengaturan Tampilan Subtitle</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div>
                    <label className="text-[10px] text-neutral-500 block mb-1">Posisi Subtitle</label>
                    <select
                      value={composition.subtitleStyle.position}
                      onChange={(e) => updateSubtitleStyle({ position: e.target.value as any })}
                      className="w-full bg-black border border-neutral-800 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="BOTTOM">Bawah (Default)</option>
                      <option value="CENTER">Tengah Layar</option>
                      <option value="TOP">Atas</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-500 block mb-1">Ukuran Font ({composition.subtitleStyle.fontSizePt}pt)</label>
                    <input
                      type="range"
                      min="16"
                      max="36"
                      value={composition.subtitleStyle.fontSizePt}
                      onChange={(e) => updateSubtitleStyle({ fontSizePt: Number(e.target.value) })}
                      className="w-full accent-emerald-500 cursor-pointer mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-500 block mb-1">Warna Teks Biasa</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={composition.subtitleStyle.textColorHex.startsWith('#') ? composition.subtitleStyle.textColorHex : '#ffffff'}
                        onChange={(e) => updateSubtitleStyle({ textColorHex: e.target.value })}
                        className="w-7 h-7 rounded border border-neutral-700 bg-black cursor-pointer p-0.5"
                      />
                      <span className="text-[11px] text-neutral-300 font-mono">{composition.subtitleStyle.textColorHex}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-500 block mb-1">Huruf Kapital</label>
                    <button
                      type="button"
                      onClick={() => updateSubtitleStyle({ allCaps: !composition.subtitleStyle.allCaps })}
                      className={cn(
                        "w-full py-1.5 px-2 rounded-lg border text-xs font-bold transition-all text-center",
                        composition.subtitleStyle.allCaps
                          ? "bg-emerald-950/60 border-emerald-600 text-emerald-300"
                          : "bg-black border-neutral-800 text-neutral-400 hover:text-white"
                      )}
                    >
                      {composition.subtitleStyle.allCaps ? 'CAPITAL (ABC)' : 'Normal (Abc)'}
                    </button>
                  </div>
                </div>

                {/* SPOKEN WORD COLOR & KARAOKE HIGHLIGHT SETTINGS */}
                <div className="pt-2 border-t border-neutral-800/80 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-amber-400">⚡ Warna Kata Yang Diucapkan (Karaoke Sync)</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-amber-950/90 border border-amber-600 text-amber-300 rounded font-mono">
                        Real-time
                      </span>
                    </div>
                    <span className="text-[11px] text-neutral-400">
                      Warna berubah otomatis sesuai kata yang sedang terucap
                    </span>
                  </div>

                  {/* Highlight Color Palette & Custom Picker */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 font-mono block">Pilih Warna Kata Aktif:</label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {[
                          { name: 'Kuning Viral', hex: '#FACC15', bg: 'bg-yellow-400' },
                          { name: 'Hijau Neon', hex: '#22C55E', bg: 'bg-green-500' },
                          { name: 'Cyan Elektrik', hex: '#06B6D4', bg: 'bg-cyan-500' },
                          { name: 'Oranye TikTok', hex: '#F97316', bg: 'bg-orange-500' },
                          { name: 'Pink Fuchsia', hex: '#EC4899', bg: 'bg-pink-500' },
                          { name: 'Putih Terang', hex: '#FFFFFF', bg: 'bg-white' },
                        ].map((c) => {
                          const isSelected = (composition.subtitleStyle.highlightColorHex || '#FACC15').toUpperCase() === c.hex.toUpperCase();
                          return (
                            <button
                              key={c.hex}
                              type="button"
                              title={c.name}
                              onClick={() => updateSubtitleStyle({ highlightColorHex: c.hex })}
                              className={cn(
                                "w-6 h-6 rounded-full border-2 transition-transform",
                                c.bg,
                                isSelected ? "border-white scale-125 shadow-lg shadow-amber-500/30" : "border-neutral-700 hover:scale-110 opacity-70 hover:opacity-100"
                              )}
                            />
                          );
                        })}

                        <div className="flex items-center gap-1.5 pl-1">
                          <input
                            type="color"
                            value={composition.subtitleStyle.highlightColorHex || '#FACC15'}
                            onChange={(e) => updateSubtitleStyle({ highlightColorHex: e.target.value })}
                            className="w-6 h-6 rounded border border-neutral-700 bg-black cursor-pointer p-0.5"
                          />
                          <span className="text-[10px] text-neutral-300 font-mono">{composition.subtitleStyle.highlightColorHex || '#FACC15'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 font-mono block">Gaya Animasi Teks Berjalan:</label>
                      <select
                        value={composition.subtitleStyle.highlightStyle || 'KARAOKE_WORD'}
                        onChange={(e) => updateSubtitleStyle({ highlightStyle: e.target.value as any })}
                        className="w-full bg-black border border-neutral-800 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="KARAOKE_WORD">🎤 Kata per Kata (Pop Glow - Default TikTok)</option>
                        <option value="KARAOKE_FILL">🌊 Karaoke Progresif (Kata Menyala Bertahap)</option>
                        <option value="BOX_POP">🏷️ Kotak Badge Sorot (Highlight Box Pill)</option>
                        <option value="COLOR_ONLY">🎨 Ganti Warna Saja (Clean Color)</option>
                        <option value="NONE">⏸️ Tanpa Highlight (Satu Warna Polos)</option>
                      </select>
                    </div>
                  </div>

                  {/* Live Preview Demo Chip */}
                  <div className="p-2 bg-black/60 border border-neutral-800 rounded-lg flex items-center justify-between text-xs">
                    <span className="text-[10px] text-neutral-400 font-mono">Contoh Tampilan:</span>
                    <div className="flex items-center gap-1.5 font-bold tracking-wide">
                      <span style={{ color: composition.subtitleStyle.textColorHex }}>Parfum</span>
                      {composition.subtitleStyle.highlightStyle === 'BOX_POP' ? (
                        <span
                          className="px-1.5 py-0.5 rounded text-black font-black text-[11px] scale-105 inline-block"
                          style={{ backgroundColor: composition.subtitleStyle.highlightColorHex || '#FACC15' }}
                        >
                          INI
                        </span>
                      ) : (
                        <span
                          className="scale-110 inline-block font-black"
                          style={{
                            color: composition.subtitleStyle.highlightColorHex || '#FACC15',
                            textShadow: `0 0 10px ${(composition.subtitleStyle.highlightColorHex || '#FACC15')}99`,
                          }}
                        >
                          INI
                        </span>
                      )}
                      <span style={{ color: composition.subtitleStyle.textColorHex }}>wanginya</span>
                      <span style={{ color: composition.subtitleStyle.textColorHex }}>segar!</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AUDIO TRANSCRIBING PROGRESS LOADER */}
              {isTranscribingAudio && (
                <div className="p-3.5 bg-emerald-950/90 border border-emerald-500 rounded-xl text-xs font-mono text-emerald-300 flex items-center gap-3 animate-pulse shadow-lg">
                  <Loader2 className="w-5 h-5 text-emerald-400 animate-spin shrink-0" />
                  <div className="space-y-0.5">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span>Memproses Transkripsi Audio...</span>
                    </div>
                    <div className="text-[11px] text-emerald-300">
                      {transcriptionProgressMessage || 'Mendengarkan dan mentranskrip dialog langsung dari audio video...'}
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTITLE TOOLBAR */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="text-xs font-mono text-white font-bold flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Daftar Subtitle ({composition.subtitles.length} Baris)</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <button
                    type="button"
                    onClick={handleTranscribeAudio}
                    disabled={isTranscribingAudio}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg flex items-center gap-1.5 transition-all shadow cursor-pointer disabled:opacity-50"
                    title="Transkrip dialog langsung dari file audio video ini menggunakan AI"
                  >
                    {isTranscribingAudio ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>{isTranscribingAudio ? 'Mentranskrip...' : 'Transkrip Audio (AI)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPasteScriptModal(true)}
                    className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Tempel naskah atau dialog yang sudah ada"
                  >
                    <FileText className="w-3 h-3 text-amber-400" />
                    <span>Tempel Naskah</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addSubtitleCue(currentTime)}
                    className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Tambah baris subtitle baru pada playhead saat ini"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tambah Baris</span>
                  </button>

                  {composition.subtitles.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllSubtitles}
                      className="px-2.5 py-1.5 bg-rose-950/50 hover:bg-rose-900/80 border border-rose-800/80 text-rose-300 hover:text-white rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Hapus semua baris subtitle"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Hapus Semua</span>
                    </button>
                  )}
                </div>
              </div>

              {/* PASTE SCRIPT MODAL */}
              {showPasteScriptModal && (
                <div className="p-4 bg-neutral-900 border border-amber-500/50 rounded-xl space-y-3 animate-fade-in shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-amber-300 flex items-center gap-2 font-mono">
                      <FileText className="w-4 h-4 text-amber-400" />
                      <span>Tempel / Masukkan Naskah Dialog Asli</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPasteScriptModal(false)}
                      className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[11px] text-neutral-400 font-sans">
                    Ketik atau tempel dialog/kalimat yang diucapkan dalam video. Teks akan otomatis dipotong menjadi baris subtitle dan disinkronkan ke linimasa klip video ({clipDuration.toFixed(1)}s).
                  </p>
                  <textarea
                    rows={4}
                    value={customScriptInput}
                    onChange={(e) => setCustomScriptInput(e.target.value)}
                    placeholder="Contoh: Halo semuanya, selamat datang di video ini. Hari ini kita akan membahas tips paling penting yang harus kamu tahu..."
                    className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 font-sans leading-relaxed"
                  />
                  <div className="flex items-center justify-end gap-2 font-mono text-xs">
                    <button
                      type="button"
                      onClick={() => setShowPasteScriptModal(false)}
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyPastedScript}
                      disabled={!customScriptInput.trim()}
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-all disabled:opacity-40 cursor-pointer"
                    >
                      ✓ Terapkan ke Subtitle
                    </button>
                  </div>
                </div>
              )}

              {/* SUBTITLE CUE CARDS */}
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {composition.subtitles.length === 0 ? (
                  <div className="p-6 bg-neutral-950 border border-dashed border-neutral-800 rounded-xl text-center space-y-3">
                    <p className="text-xs text-neutral-400 font-sans">
                      Belum ada baris subtitle untuk klip video ini.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 font-mono">
                      <button
                        type="button"
                        onClick={handleTranscribeAudio}
                        disabled={isTranscribingAudio}
                        className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg text-xs inline-flex items-center gap-1.5 cursor-pointer shadow disabled:opacity-50"
                      >
                        {isTranscribingAudio ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        <span>🎙️ Transkrip Otomatis dari Audio (AI)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowPasteScriptModal(true)}
                        className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-lg text-xs inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        <span>📝 Tempel Naskah Manual</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => addSubtitleCue(currentTime)}
                        className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 rounded-lg text-xs inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-400" />
                        <span>➕ Tambah Baris Manual</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  composition.subtitles.map((cue, cIdx) => (
                    <div
                      key={cue.id || cIdx}
                      className="p-3 bg-neutral-900/80 border border-neutral-800 rounded-xl space-y-2 hover:border-neutral-700 transition-all"
                    >
                      {/* Top Bar: Number, Timestamps, Seek, Delete */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-white px-2 py-0.5 bg-black/60 rounded border border-neutral-800 text-[11px]">
                            #{cIdx + 1}
                          </span>

                          <div className="flex flex-wrap items-center gap-1 text-[11px] text-neutral-400">
                            <span>Mulai:</span>
                            <input
                              type="number"
                              step="0.1"
                              value={cue.startSeconds}
                              onChange={(e) => updateSubtitleCueTiming(cue.id, Number(e.target.value), cue.endSeconds)}
                              className="w-16 bg-black border border-neutral-800 focus:border-emerald-500 rounded px-1.5 py-0.5 text-emerald-400 font-mono text-center text-xs focus:outline-none"
                            />
                            <span>s</span>
                            <button
                              type="button"
                              onClick={() => {
                                const cur = Number(currentTime.toFixed(1));
                                updateSubtitleCueTiming(cue.id, cur, Math.max(cur + 0.5, cue.endSeconds));
                              }}
                              title="Set detik mulai ke posisi playhead video saat ini"
                              className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-cyan-300 text-[10px] cursor-pointer"
                            >
                              ⏱️ Mulai
                            </button>

                            <span className="mx-0.5 text-neutral-600">→</span>

                            <span>Selesai:</span>
                            <input
                              type="number"
                              step="0.1"
                              value={cue.endSeconds}
                              onChange={(e) => updateSubtitleCueTiming(cue.id, cue.startSeconds, Number(e.target.value))}
                              className="w-16 bg-black border border-neutral-800 focus:border-emerald-500 rounded px-1.5 py-0.5 text-emerald-400 font-mono text-center text-xs focus:outline-none"
                            />
                            <span>s</span>
                            <button
                              type="button"
                              onClick={() => {
                                const cur = Number(currentTime.toFixed(1));
                                updateSubtitleCueTiming(cue.id, Math.min(cue.startSeconds, Math.max(0, cur - 0.5)), cur);
                              }}
                              title="Set detik selesai ke posisi playhead video saat ini"
                              className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-cyan-300 text-[10px] cursor-pointer"
                            >
                              ⏱️ Selesai
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Fine-tuning buttons */}
                          <button
                            type="button"
                            onClick={() => {
                              const newStart = Math.max(clipStart, Number((cue.startSeconds - 0.2).toFixed(1)));
                              const newEnd = Math.max(newStart + 0.3, Number((cue.endSeconds - 0.2).toFixed(1)));
                              updateSubtitleCueTiming(cue.id, newStart, newEnd);
                            }}
                            title="Mundurkan timing -0.2s"
                            className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px] cursor-pointer"
                          >
                            -0.2s
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const newStart = Number((cue.startSeconds + 0.2).toFixed(1));
                              const newEnd = Math.min(clipEnd, Number((cue.endSeconds + 0.2).toFixed(1)));
                              updateSubtitleCueTiming(cue.id, newStart, newEnd);
                            }}
                            title="Majukan timing +0.2s"
                            className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px] cursor-pointer"
                          >
                            +0.2s
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSeek(cue.startSeconds)}
                            title="Putar video dari detik baris ini untuk cek kesesuaian ucapan"
                            className="px-2 py-1 rounded bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 hover:text-white flex items-center gap-1 text-[10px] cursor-pointer transition-colors"
                          >
                            <Play className="w-2.5 h-2.5 fill-current" />
                            <span>Play</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteSubtitleCue(cue.id)}
                            title="Hapus baris subtitle ini"
                            className="p-1.5 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 hover:text-white transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Text Input */}
                      <div>
                        <input
                          type="text"
                          value={cue.text || ''}
                          onChange={(e) => updateSubtitleCueText(cue.id, e.target.value)}
                          placeholder="Tulis teks subtitle di sini..."
                          className="w-full bg-black border border-neutral-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-sans transition-colors placeholder:text-neutral-600"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: AI TITLE GENERATOR */}
          {activeTab === 'title' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase font-mono flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>AI Title &amp; Hook Suggestions</span>
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Judul hook video otomatis menyesuaikan bahasa voice/audio ({detectedVoiceLang === 'id' ? 'Bahasa Indonesia' : 'English'}).
                  </p>
                </div>
                <button
                  onClick={() => generateMoreTitles(titleLanguage)}
                  className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-emerald-500 rounded-lg text-xs font-mono text-emerald-400 flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Regenerate ({titleLanguage === 'id' ? '🇮🇩 ID' : '🇬🇧 EN'})</span>
                </button>
              </div>

              {/* VOICE LANGUAGE ADAPTER & SWITCHER */}
              <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2 text-xs font-mono text-neutral-300">
                    <Languages className="w-4 h-4 text-emerald-400" />
                    <span>Bahasa Voice Audio Terdeteksi:</span>
                    <span className="text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded">
                      {detectedVoiceLang === 'id' ? '🇮🇩 Bahasa Indonesia' : '🇬🇧 English Voice'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500">
                    Pilihan Bahasa Hook Title:
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => {
                      setTitleLanguage('id');
                      generateMoreTitles('id');
                    }}
                    className={cn(
                      'py-2 px-3 rounded-lg border flex items-center justify-center gap-1.5 transition-all font-bold',
                      titleLanguage === 'id'
                        ? 'bg-emerald-950/50 border-emerald-600 text-emerald-300 ring-1 ring-emerald-500'
                        : 'bg-black/60 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                    )}
                  >
                    <span className="text-sm">🇮🇩</span>
                    <span>Judul Bahasa Indonesia</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTitleLanguage('en');
                      generateMoreTitles('en');
                    }}
                    className={cn(
                      'py-2 px-3 rounded-lg border flex items-center justify-center gap-1.5 transition-all font-bold',
                      titleLanguage === 'en'
                        ? 'bg-emerald-950/50 border-emerald-600 text-emerald-300 ring-1 ring-emerald-500'
                        : 'bg-black/60 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                    )}
                  >
                    <span className="text-sm">🇬🇧</span>
                    <span>Titles in English</span>
                  </button>
                </div>
              </div>

              {/* TryBuzzer Brief Reference Hooks */}
              {tbPreset && tbPreset.referenceHooks.length > 0 && (
                <div className="p-3 bg-amber-950/20 border border-amber-800/60 rounded-lg space-y-2">
                  <div className="text-[10px] font-mono text-amber-400 font-bold uppercase flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>TryBuzzer Official Brief Hooks (1-Click Apply)</span>
                  </div>
                  <div className="space-y-1">
                    {tbPreset.referenceHooks.map((rh, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectTitleOverlay(rh.toUpperCase())}
                        className="w-full text-left p-2 rounded bg-black/60 border border-neutral-800 hover:border-amber-500 text-neutral-300 hover:text-white text-xs transition-colors block"
                      >
                        "{rh}"
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Title Banner Status Switch */}
              <div className="p-3 bg-neutral-900/80 border border-neutral-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-mono">Status Title Banner Video</span>
                    <span
                      className={cn(
                        'text-[10px] font-mono px-2 py-0.5 rounded font-bold',
                        composition.titleOverlay.enabled !== false && composition.titleOverlay.text.trim() !== ''
                          ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-300'
                          : 'bg-neutral-800 border border-neutral-700 text-neutral-400'
                      )}
                    >
                      {composition.titleOverlay.enabled !== false && composition.titleOverlay.text.trim() !== ''
                        ? 'BANNER AKTIF (ON)'
                        : 'BANNER NONAKTIF (OFF)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {composition.titleOverlay.enabled !== false && composition.titleOverlay.text.trim() !== ''
                      ? 'Title hook banner akan di-burn di bagian atas video.'
                      : 'Video klip akan di-export bersih tanpa teks banner di atas.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const isCurrentlyActive = composition.titleOverlay.enabled !== false;
                    updateTitleOverlay({ enabled: !isCurrentlyActive });
                  }}
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                    composition.titleOverlay.enabled !== false ? 'bg-emerald-500' : 'bg-neutral-700'
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                      composition.titleOverlay.enabled !== false ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>

              {/* Active Title Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-neutral-500 uppercase flex items-center justify-between">
                  <span>Active Hook Title Banner</span>
                  <span className="text-neutral-400">{composition.titleOverlay.text.length} chars</span>
                </label>
                <input
                  type="text"
                  value={composition.titleOverlay.text}
                  onChange={(e) => selectTitleOverlay(e.target.value)}
                  placeholder="Ketik judul banner atau biarkan kosong jika tanpa banner..."
                  className="w-full bg-black border border-neutral-700 focus:border-emerald-500 rounded-lg p-2.5 text-xs font-bold text-white focus:outline-none uppercase font-sans tracking-wide transition-colors"
                />
              </div>

              {/* Suggestions List */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] font-mono text-neutral-500 uppercase flex items-center justify-between">
                  <span>Pilihan Formula Judul AI ({titleLanguage === 'id' ? 'Bahasa Indonesia' : 'English'}) · Klik untuk Pakai</span>
                  <span className="text-emerald-400">High CTR &amp; Retention</span>
                </div>
                {composition.generatedTitles.map((t, idx) => {
                  const isCurrent = composition.titleOverlay.text === t;
                  const hookLabels = [
                    '⚡ HOOK UTAMA',
                    '❓ PENASARAN',
                    '🚨 PERINGATAN',
                    '💡 TRIK & SOLUSI',
                    '🏆 BUKTI NYATA',
                    '📌 CALL TO ACTION'
                  ];
                  const label = hookLabels[idx] || `Opsi ${idx + 1}`;

                  return (
                    <button
                      key={idx}
                      onClick={() => selectTitleOverlay(t)}
                      className={cn(
                        'w-full p-2.5 rounded-lg border text-left text-xs font-semibold transition-all flex items-center justify-between gap-2 cursor-pointer',
                        isCurrent
                          ? 'bg-neutral-900 border-emerald-500 text-emerald-400 shadow-sm'
                          : 'bg-neutral-900/40 border-neutral-800 text-neutral-300 hover:bg-neutral-900 hover:text-white'
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn(
                          'text-[9px] font-mono px-1.5 py-0.5 rounded font-bold shrink-0',
                          isCurrent ? 'bg-emerald-950 border border-emerald-700 text-emerald-300' : 'bg-black border border-neutral-800 text-neutral-400'
                        )}>
                          {label}
                        </span>
                        <span className="truncate">{t}</span>
                      </div>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: THUMBNAIL */}
          {activeTab === 'thumbnail' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-white uppercase font-mono flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                  <span>Thumbnail Selector &amp; Live Visual Preview</span>
                </h3>
                <p className="text-[11px] text-neutral-400">
                  Lihat preview gambar thumbnail secara visual sebelum di-export ke format PNG resolusi tinggi (1080×1920).
                </p>
              </div>

              {/* LIVE THUMBNAIL VISUAL PREVIEW BOX */}
              <div className="p-4 bg-black border border-neutral-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Live Frame Preview ({composition.aspectRatio})</span>
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700 text-emerald-300 font-bold">
                    PREVIEW READY
                  </span>
                </div>

                {/* Thumbnail Display Screen */}
                <div className="flex justify-center py-2 bg-neutral-950/80 border border-neutral-850 rounded-lg overflow-hidden">
                  <div
                    className={cn(
                      'bg-black border-2 border-neutral-700 rounded-xl relative overflow-hidden flex flex-col justify-between shadow-2xl transition-all',
                      composition.aspectRatio === '9:16'
                        ? 'w-48 h-[300px]'
                        : composition.aspectRatio === '1:1'
                        ? 'w-56 h-56'
                        : 'w-64 h-36'
                    )}
                  >
                    {/* Synchronized Video Frame for Thumbnail */}
                    <video
                      ref={thumbnailVideoRef}
                      src={activeVideoMedia?.previewUrl}
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                      muted
                      playsInline
                    />

                    {/* Top Overlay Banner (Simulating final thumbnail branding) */}
                    <div className="pt-3 px-2 text-center z-10">
                      <span className="inline-block px-2 py-1 bg-black/85 backdrop-blur border border-neutral-700 text-white font-black text-[9px] tracking-tight rounded uppercase shadow-lg max-w-[90%] truncate">
                        {composition.titleOverlay.text || 'CAMPAIGN MASTER'}
                      </span>
                    </div>

                    {/* Center Accent Focus */}
                    <div className="z-10 text-center my-auto pointer-events-none">
                      <span className="text-[8px] font-mono text-white/40 tracking-widest uppercase bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">
                        {composition.aspectRatio === '9:16' ? '1080 × 1920 HD' : '1080 × 1080 HD'}
                      </span>
                    </div>

                    {/* Bottom Gradient with Keyframe Info */}
                    <div className="z-10 bg-gradient-to-t from-black/95 via-black/50 to-transparent pt-6 pb-2 px-2 text-center space-y-0.5">
                      <div className="text-[10px] font-mono text-emerald-400 font-bold drop-shadow">
                        Keyframe @ {formatTimestamp(composition.thumbnailTimestampSec)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 pt-1">
                  <span>Frame: <strong className="text-white">{formatTimestamp(composition.thumbnailTimestampSec)}</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      handleSeek(composition.thumbnailTimestampSec);
                    }}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 underline font-mono cursor-pointer"
                  >
                    Putar Video di Titik Ini
                  </button>
                </div>
              </div>

              {/* AI VIRAL THUMBNAIL RECOMMENDATIONS (POTENSI VIRAL) */}
              <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white font-mono uppercase">
                      Rekomendasi Frame Potensi Viral (AI)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => generateViralThumbnails()}
                    className="text-[10px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-950/40 border border-amber-800/60 px-2 py-1 rounded transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Recalculate</span>
                  </button>
                </div>
                <p className="text-[11px] text-neutral-400 leading-snug">
                  Pilih salah satu kandidat frame di bawah untuk langsung mengganti thumbnail dengan titik potensi viral &amp; CTR tertinggi:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {(composition.viralCandidates && composition.viralCandidates.length > 0
                    ? composition.viralCandidates
                    : ViralThumbnailService.generateCandidates(clipStart, clipEnd, activeRec)
                  ).map((candidate) => {
                    const isSelected = Math.abs(composition.thumbnailTimestampSec - candidate.timestampSec) < 0.15;
                    return (
                      <button
                        key={candidate.id}
                        type="button"
                        onClick={() => {
                          setThumbnailInput(String(candidate.timestampSec));
                          updateThumbnailTimestamp(candidate.timestampSec);
                        }}
                        className={cn(
                          'p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer',
                          isSelected
                            ? 'bg-emerald-950/50 border-emerald-500 ring-1 ring-emerald-500 text-white shadow-lg'
                            : 'bg-black/60 border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:bg-neutral-900/80'
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={cn(
                              'text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border',
                              isSelected
                                ? 'bg-emerald-900/80 border-emerald-400 text-emerald-200'
                                : 'bg-neutral-900 border-neutral-700 text-amber-400'
                            )}
                          >
                            {candidate.badge}
                          </span>
                          <span className="text-[10.5px] font-mono text-emerald-400 font-bold">
                            {formatTimestamp(candidate.timestampSec)}
                          </span>
                        </div>

                        <div>
                          <div className="text-xs font-bold text-white flex items-center justify-between gap-1">
                            <span className="truncate">{candidate.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                          </div>
                          <div className="text-[10px] text-neutral-400 line-clamp-2 mt-0.5 leading-tight">
                            {candidate.reason}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Timestamp Comparison */}
              <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-400">AI Suggested Peak Timestamp:</span>
                  <span className="text-emerald-400 font-bold">
                    {formatTimestamp(composition.suggestedThumbnailTimestampSec)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-400">Selected Frame Timestamp:</span>
                  <span className="text-white font-bold">
                    {formatTimestamp(composition.thumbnailTimestampSec)}
                  </span>
                </div>
              </div>

              {/* Scrubber and manual input for thumbnail */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono text-neutral-400 font-bold uppercase">Frame Timestamp (sec)</label>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = Number(currentTime.toFixed(1));
                      setThumbnailInput(String(cur));
                      updateThumbnailTimestamp(cur);
                    }}
                    className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-950/40 border border-emerald-800/60 px-1.5 py-0.5 rounded transition-colors"
                  >
                    <MapPin className="w-2.5 h-2.5" />
                    <span>Set to Current Playhead ({formatTimestamp(currentTime)})</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.0"
                    value={thumbnailInput}
                    onChange={(e) => {
                      setThumbnailInput(e.target.value);
                      if (e.target.value.trim() !== '') {
                        const parsed = parseFloat(e.target.value);
                        if (!isNaN(parsed) && parsed >= 0) {
                          updateThumbnailTimestamp(parsed);
                        }
                      }
                    }}
                    onBlur={() => {
                      if (thumbnailInput.trim() === '') {
                        setThumbnailInput(String(composition.thumbnailTimestampSec));
                        return;
                      }
                      const parsed = parseFloat(thumbnailInput);
                      if (isNaN(parsed) || parsed < 0) {
                        setThumbnailInput(String(composition.thumbnailTimestampSec));
                      } else {
                        setThumbnailInput(String(parsed));
                        updateThumbnailTimestamp(parsed);
                      }
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    className="w-full bg-black border border-neutral-700 focus:border-emerald-500 rounded px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none pr-8 transition-colors"
                  />
                  {thumbnailInput.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setThumbnailInput('')}
                      title="Delete / Kosongkan Angka"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <input
                  type="range"
                  min={clipStart}
                  max={clipEnd}
                  step="0.1"
                  value={Math.max(clipStart, Math.min(clipEnd, composition.thumbnailTimestampSec))}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setThumbnailInput(String(val));
                    updateThumbnailTimestamp(val);
                  }}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={handleExportThumbnail}
                  className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>{thumbnailExported ? 'Thumbnail Exported (PNG)!' : 'Export Thumbnail Image (.png)'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
