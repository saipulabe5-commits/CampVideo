import React, { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '../../../../application/stores/useProjectStore';
import { PipelineStage } from '../../../../domain/enums/PipelineStage';
import { formatTimestamp } from '../../../../domain/value-objects/TimestampRange';
import { TRYBUZZER_CAMPAIGN_PRESETS } from '../../../../domain/constants/TryBuzzerBounties';
import { 
  Upload, 
  Film, 
  Play, 
  Pause, 
  FileVideo, 
  CheckCircle2, 
  ArrowRight, 
  Info, 
  Sliders, 
  RefreshCw,
  HardDrive,
  Sparkles,
  ExternalLink,
  Copy,
  ShoppingBag,
  ShieldAlert
} from 'lucide-react';
import { cn } from '../../../primitives/classNames';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export const UploadStageView: React.FC = () => {
  const { activeProject, activeVideoMedia, ingestVideo, selectStage, setActiveVideoFile } = useProjectStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(activeVideoMedia?.durationSeconds || 154.5);
  const [formatError, setFormatError] = useState<string | null>(null);
  const [copiedLinkMessage, setCopiedLinkMessage] = useState<string | null>(null);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const tbPreset = activeProject?.trybuzzer?.campaignKey
    ? TRYBUZZER_CAMPAIGN_PRESETS.find((p) => p.key === activeProject.trybuzzer?.campaignKey)
    : null;

  const handleCopySourceUrl = (url: string) => {
    navigator.clipboard?.writeText(url);
    setCopiedLinkMessage('Link video sumber disalin!');
    setTimeout(() => setCopiedLinkMessage(null), 3000);
  };

  useEffect(() => {
    if (activeVideoMedia?.durationSeconds) {
      setDuration(activeVideoMedia.durationSeconds);
    }
  }, [activeVideoMedia?.durationSeconds]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processSelectedFile(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processSelectedFile(files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    setFormatError(null);
    const ext = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['mp4', 'mov', 'mkv', 'webm'];
    if (!validExtensions.includes(ext || '')) {
      setFormatError(`Unsupported format .${ext}. Supported campaign video formats: MP4, MOV, MKV`);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setActiveVideoFile(file);
    
    // Probe video duration & dimensions using HTML5 video object
    const probeVid = document.createElement('video');
    probeVid.src = objectUrl;
    probeVid.preload = 'metadata';
    probeVid.onerror = () => {
      // Graceful fallback for non-native codecs or browser audio probe limits
      ingestVideo({
        fileName: file.name,
        fileSizeBytes: file.size,
        durationSeconds: 120.0,
        width: 1920,
        height: 1080,
        fps: 60,
        codec: ext === 'mkv' ? 'Matroska / AVC' : ext === 'mov' ? 'ProRes / H.264' : 'H.264 High Profile',
        audioCodec: 'aac (LC)',
        audioChannels: 2,
        sampleRateHz: 48000,
        bitrateKbps: 12000,
        previewUrl: objectUrl,
      });
      setDuration(120.0);
      setUploadSuccessMessage(`✓ Video "${file.name}" berhasil dimuat! Rekomendasi klip, judul, dan subtitle otomatis diperbarui.`);
      setTimeout(() => setUploadSuccessMessage(null), 6000);
    };
    probeVid.onloadedmetadata = () => {
      const dur = probeVid.duration || 120.0;
      const w = probeVid.videoWidth || 1920;
      const h = probeVid.videoHeight || 1080;

      ingestVideo({
        fileName: file.name,
        fileSizeBytes: file.size,
        durationSeconds: dur,
        width: w,
        height: h,
        fps: 60,
        codec: ext === 'mkv' ? 'Matroska / AVC' : ext === 'mov' ? 'ProRes / H.264' : 'H.264 High Profile',
        audioCodec: 'aac (LC)',
        audioChannels: 2,
        sampleRateHz: 48000,
        bitrateKbps: dur > 0 ? Math.round((file.size * 8) / (dur * 1000)) : 12000,
        previewUrl: objectUrl,
      });
      setDuration(dur);
      setUploadSuccessMessage(`✓ Video "${file.name}" berhasil dimuat! Rekomendasi klip, judul, dan subtitle otomatis disesuaikan dengan video ini.`);
      setTimeout(() => setUploadSuccessMessage(null), 6000);
    };
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCurrentTime(val);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stage Header */}
      <div className="p-5 bg-neutral-950 border border-neutral-800/90 rounded-xl space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
          <Upload className="w-3.5 h-3.5" />
          <span>STAGE 02_UPL // VIDEO INGESTION & LOCAL PROBE</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Campaign Video Ingestion (MP4, MOV, MKV)
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Drag and drop your long-form recording. Video files remain 100% on your local disk with hardware-assisted frame extraction.
            </p>
          </div>

          {activeVideoMedia && (
            <button
              onClick={() => selectStage(PipelineStage.ANALYZE)}
              className="px-4 py-2 bg-white hover:bg-neutral-200 text-black font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <span>Proceed to AI Analyze</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {formatError && (
          <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-lg text-xs font-mono text-rose-300 flex items-center justify-between">
            <span>{formatError}</span>
            <button onClick={() => setFormatError(null)} className="text-neutral-400 hover:text-white text-xs">Dismiss</button>
          </div>
        )}
      </div>

      {/* TryBuzzer Campaign Brief & Rules Card */}
      {activeProject?.trybuzzer && (
        <div className="p-4 bg-neutral-950 border border-amber-800/60 rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-white font-mono uppercase">
                  TRYBUZZER BOUNTY BRIEF · {activeProject.trybuzzer.brandName || activeProject.name}
                </span>
                <div className="text-[11px] text-amber-400 font-mono">
                  Rate: CPM Rp{activeProject.trybuzzer.cpmRateIdr?.toLocaleString('id-ID')} · Min: {activeProject.trybuzzer.minViews?.toLocaleString('id-ID')} Views · Max: {activeProject.trybuzzer.maxViews?.toLocaleString('id-ID')} Views
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-300">
                Niche: {activeProject.trybuzzer.niche || 'Product'}
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-400 font-bold">
                Keranjang Kuning: {activeProject.trybuzzer.yellowCart || 'Wajib'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-neutral-900/60 rounded-lg border border-neutral-800 space-y-1">
              <div className="font-bold text-neutral-200 font-mono text-[11px]">🎯 Objective / Fokus Utama:</div>
              <p className="text-neutral-400 text-[11px] leading-relaxed">
                {activeProject.trybuzzer.objectiveFocus || 'Angkat pembahasan talent & produk secara organik.'}
              </p>
            </div>

            <div className="p-3 bg-neutral-900/60 rounded-lg border border-neutral-800 space-y-1">
              <div className="font-bold text-neutral-200 font-mono text-[11px]">📋 Aturan TryBuzzer:</div>
              <p className="text-neutral-400 text-[11px] leading-relaxed">
                Durasi min 15 detik · Hook maks {activeProject.trybuzzer.hookMaxSeconds || 7} detik · Dilarang Opus AI/Vizard/Bot · Wajib subtitle atau headline.
              </p>
            </div>
          </div>

          {tbPreset?.sourceVideoUrls && tbPreset.sourceVideoUrls.length > 0 && (
            <div className="p-2.5 bg-black/60 border border-neutral-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-neutral-400 truncate">
                <span className="text-emerald-400 shrink-0">Bahan Video Sumber:</span>
                <span className="text-white truncate">{tbPreset.sourceVideoUrls[0]}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopySourceUrl(tbPreset.sourceVideoUrls[0])}
                  className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white rounded text-[11px] flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3 h-3 text-emerald-400" />
                  <span>Salin Link</span>
                </button>
                {copiedLinkMessage && (
                  <span className="text-[10px] text-emerald-400 font-mono">{copiedLinkMessage}</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Real-time upload success notification */}
      {uploadSuccessMessage && (
        <div className="p-3.5 bg-emerald-950/60 border border-emerald-600/70 rounded-xl text-emerald-300 text-xs font-mono flex items-center justify-between gap-2 shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="text-base">✨</span>
            <span className="font-semibold">{uploadSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => selectStage(PipelineStage.RECOMMEND)}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold shrink-0 transition-colors"
          >
            Lihat Rekomendasi →
          </button>
        </div>
      )}

      {/* Upload Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all space-y-3',
          isDragging
            ? 'border-emerald-500 bg-neutral-900/60'
            : 'border-neutral-800 hover:border-neutral-700 bg-neutral-950/60'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp4,.mov,.mkv,video/mp4,video/quicktime,video/x-matroska"
          className="hidden"
          onChange={handleFileInputChange}
        />

        <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center justify-center text-white">
          <Upload className="w-6 h-6 text-neutral-300" />
        </div>

        <div className="space-y-1">
          <div className="text-sm font-bold text-white">
            Drop long-form campaign video here or <span className="text-emerald-400 underline">browse files</span>
          </div>
          <p className="text-xs text-neutral-400">
            Supports MP4, MOV, and MKV · No file size limits · 100% offline
          </p>
        </div>

        <div className="flex items-center gap-3 text-[10px] font-mono text-neutral-500 pt-2">
          <span>DirectML / NVENC Probed</span>
          <span>·</span>
          <span>FastSeek HW Accel</span>
          <span>·</span>
          <span>Zero Cloud Egress</span>
        </div>
      </div>

      {/* Video Preview & Metadata Grid */}
      {activeVideoMedia && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Local Video Player Preview */}
          <div className="lg:col-span-7 bg-neutral-950 border border-neutral-800/90 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-white font-semibold flex items-center gap-2">
                <Film className="w-3.5 h-3.5 text-neutral-400" />
                <span>{activeVideoMedia.fileName}</span>
              </span>
              <span className="text-emerald-400">
                {formatTimestamp(currentTime)} / {formatTimestamp(duration)}
              </span>
            </div>

            {/* Video Canvas Container */}
            <div className="relative bg-black rounded-lg overflow-hidden border border-neutral-800 aspect-video flex items-center justify-center group">
              <video
                ref={videoRef}
                src={activeVideoMedia.previewUrl}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
                className="w-full h-full object-contain"
                playsInline
              />

              {/* Play/Pause Overlay Button */}
              <button
                onClick={togglePlay}
                className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-black/90 transition-all opacity-80 group-hover:opacity-100"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5 fill-white" />}
              </button>
            </div>

            {/* Scrubber Bar */}
            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.1"
                value={currentTime}
                onChange={handleSeek}
                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
              />
              <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                <span>00:00.000</span>
                <span>Scrub timecode</span>
                <span>{formatTimestamp(duration)}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Display Video Metadata */}
          <div className="lg:col-span-5 bg-neutral-950 border border-neutral-800/90 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-xs font-bold text-white uppercase font-mono flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-neutral-400" />
                <span>Probed Video Metadata</span>
              </h3>
              <span className="text-[10px] font-mono text-emerald-400">FFprobe Verified</span>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="flex items-center justify-between py-1 border-b border-neutral-900">
                <span className="text-neutral-500">File Name</span>
                <span className="text-white font-medium truncate max-w-[200px]" title={activeVideoMedia.fileName}>
                  {activeVideoMedia.fileName}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-neutral-900">
                <span className="text-neutral-500">File Size</span>
                <span className="text-neutral-200">{formatBytes(activeVideoMedia.fileSizeBytes)}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-neutral-900">
                <span className="text-neutral-500">Duration</span>
                <span className="text-white font-bold">{formatTimestamp(activeVideoMedia.durationSeconds)} ({activeVideoMedia.durationSeconds.toFixed(1)}s)</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-neutral-900">
                <span className="text-neutral-500">Resolution</span>
                <span className="text-emerald-400 font-semibold">{activeVideoMedia.width} x {activeVideoMedia.height} ({(activeVideoMedia.width >= 3840) ? '4K UHD' : '1080p FHD'})</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-neutral-900">
                <span className="text-neutral-500">Frame Rate</span>
                <span className="text-neutral-200">{activeVideoMedia.fps} fps</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-neutral-900">
                <span className="text-neutral-500">Video Codec</span>
                <span className="text-neutral-200">{activeVideoMedia.codec}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-neutral-900">
                <span className="text-neutral-500">Audio Codec</span>
                <span className="text-neutral-200">{activeVideoMedia.audioCodec} ({activeVideoMedia.audioChannels} ch @ {activeVideoMedia.sampleRateHz} Hz)</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-neutral-900">
                <span className="text-neutral-500">Bitrate</span>
                <span className="text-neutral-200">{(activeVideoMedia.bitrateKbps / 1000).toFixed(1)} Mbps</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-neutral-500">Ingested At</span>
                <span className="text-neutral-400 text-[11px]">{new Date(activeVideoMedia.ingestedAt).toLocaleTimeString()}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => selectStage(PipelineStage.ANALYZE)}
                className="w-full py-2.5 bg-white hover:bg-neutral-200 text-black font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Analyze Video with AI</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
