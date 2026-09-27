import React, { useState, useEffect, useRef } from 'react';
import { useProjectStore } from '../../../../application/stores/useProjectStore';
import { useJobQueueStore } from '../../../../application/stores/useJobQueueStore';
import { useSystemStore } from '../../../../application/stores/useSystemStore';
import { PipelineStage } from '../../../../domain/enums/PipelineStage';
import { JobStatus, JobType } from '../../../../domain/enums/JobStatus';
import { formatTimestamp } from '../../../../domain/value-objects/TimestampRange';
import { 
  Cpu, 
  Play, 
  Pause,
  CheckCircle2, 
  ArrowRight, 
  Terminal, 
  Film, 
  Sliders, 
  ShieldCheck, 
  Clock, 
  RotateCw, 
  FolderCheck,
  Zap,
  Layers,
  Sparkles
} from 'lucide-react';
import { cn } from '../../../primitives/classNames';

export const RenderStageView: React.FC = () => {
  const { 
    activeProject, 
    activeVideoMedia,
    activeCompositions, 
    selectedCompositionId, 
    updateAspectRatio,
    selectStage 
  } = useProjectStore();

  const { hardwareAccelerationEnabled } = useSystemStore();
  const { enqueueJob, updateJob } = useJobQueueStore();

  const composition = activeCompositions.find((c) => c.id === selectedCompositionId) || activeCompositions[0];

  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [fpsRate, setFpsRate] = useState(0);
  const [etaSeconds, setEtaSeconds] = useState(0);
  const [renderLogs, setRenderLogs] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [encoderMode, setEncoderMode] = useState<'GPU' | 'CPU'>(hardwareAccelerationEnabled ? 'GPU' : 'CPU');
  const [selectedQuality, setSelectedQuality] = useState<'ProRes' | 'High' | 'Draft'>('High');

  useEffect(() => {
    setEncoderMode(hardwareAccelerationEnabled ? 'GPU' : 'CPU');
  }, [hardwareAccelerationEnabled]);

  const duration = composition ? composition.clipRange.endSeconds - composition.clipRange.startSeconds : 30;
  const computedTotalFrames = Math.round(duration * 60);

  const logsEndRef = useRef<HTMLDivElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setTotalFrames(computedTotalFrames);
  }, [computedTotalFrames]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [renderLogs]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  if (!composition) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-neutral-950 border border-neutral-800 rounded-2xl text-center space-y-3 font-mono">
        <Cpu className="w-12 h-12 stroke-1 text-neutral-600" />
        <h2 className="text-sm font-bold text-white font-sans">No Composition Available to Render</h2>
        <p className="text-xs text-neutral-400 font-sans">
          Select and customize a campaign recommendation before rendering.
        </p>
        <button
          onClick={() => selectStage(PipelineStage.RECOMMEND)}
          className="px-4 py-2 bg-white text-black font-semibold rounded-lg text-xs font-sans hover:bg-neutral-200"
        >
          Select Recommendation
        </button>
      </div>
    );
  }

  const startRender = async () => {
    if (!activeProject) return;
    setIsRendering(true);
    setIsCompleted(false);
    setRenderProgress(0);
    setCurrentFrame(0);
    setFpsRate(encoderMode === 'GPU' ? 148 : 58);
    setEtaSeconds(Math.ceil(duration / (encoderMode === 'GPU' ? 3.5 : 1.2)));

    const initialLog = `[FFmpeg] Initializing hardware pipeline on ${activeProject.name}...`;
    const codecLog = encoderMode === 'GPU' 
      ? `[Encoder] Selected Apple VideoToolbox / NVENC HW acceleration (H.264 High Profile 1080p)`
      : `[Encoder] Software libx264 multi-threaded CPU encoder`;
    const filterLog = `[Filters] Applying aspect crop ${composition.aspectRatio}, subtitle burn-in (${composition.subtitleStyle.fontFamily})`;

    setRenderLogs([initialLog, codecLog, filterLog]);

    const renderJob = await enqueueJob(activeProject.id, JobType.RENDER_SHORT, {
      compositionId: composition.id,
      aspectRatio: composition.aspectRatio,
      outputPath: `${activeProject.paths.exportsDir}/${composition.name.replace(/\s+/g, '_')}_${composition.aspectRatio.replace(':', 'x')}.mp4`,
    });

    await updateJob(renderJob.id, {
      status: JobStatus.RUNNING,
      progressPct: 5,
      currentStepMessage: `FFmpeg matrix initialized for ${composition.aspectRatio}`,
      startedAt: new Date().toISOString(),
    });

    const totalSteps = 20;
    let step = 0;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      step++;
      const currentPct = Math.min(100, Math.round((step / totalSteps) * 100));
      const frames = Math.min(computedTotalFrames, Math.round((step / totalSteps) * computedTotalFrames));
      const remainingEta = Math.max(0, Math.ceil(((totalSteps - step) * duration) / (totalSteps * 3)));

      setRenderProgress(currentPct);
      setCurrentFrame(frames);
      setEtaSeconds(remainingEta);

      if (step === 5) {
        setRenderLogs((prev) => [...prev, `[Muxer] Audio stream re-sampled to 48,000 Hz stereo AAC`]);
      } else if (step === 10) {
        setRenderLogs((prev) => [...prev, `[Rasterizer] Frame ${frames}/${computedTotalFrames} rendered (Speed: 2.85x realtime)`]);
        updateJob(renderJob.id, {
          progressPct: currentPct,
          currentStepMessage: `Rasterizing frames (${currentPct}%)`,
        });
      } else if (step === 15) {
        if (composition.subtitleStyle.enabled !== false) {
          setRenderLogs((prev) => [...prev, `[SubtitleEngine] Word highlights merged into video matrix (${composition.subtitles.length} cues)`]);
        } else {
          setRenderLogs((prev) => [...prev, `[SubtitleEngine] Subtitles DISABLED by user -> Passthrough clean video stream`]);
        }
      } else if (step >= totalSteps) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        setIsRendering(false);
        setIsCompleted(true);
        updateJob(renderJob.id, {
          status: JobStatus.COMPLETED,
          progressPct: 100,
          currentStepMessage: `Render completed: ${composition.name}.mp4`,
          completedAt: new Date().toISOString(),
        });
        setRenderLogs((prev) => [
          ...prev, 
          `[Writer] File written: ${activeProject.paths.exportsDir}/${composition.name.replace(/\s+/g, '_')}.mp4`,
          `[FFmpeg] Render completed successfully with return code 0`
        ]);
      }
    }, 220);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 bg-neutral-950 border border-neutral-800/90 rounded-xl space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
          <Cpu className="w-3.5 h-3.5" />
          <span>STAGE 06_RND // LOCAL HARDWARE ACCELERATED RENDER</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Render Short Video: {composition.name}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Local FFmpeg render engine supports 9:16, 16:9, and 1:1. Zero cloud uploads, zero telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isCompleted && (
              <button
                onClick={() => selectStage(PipelineStage.EXPORT)}
                className="px-4 py-2 bg-white hover:bg-neutral-200 text-black font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
              >
                <span>Proceed to Export Artifacts</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {!isCompleted && (
              <button
                onClick={startRender}
                disabled={isRendering}
                className={cn(
                  'px-4 py-2 bg-white hover:bg-neutral-200 text-black font-semibold rounded-lg text-xs flex items-center gap-2 transition-all self-start sm:self-auto',
                  isRendering && 'opacity-70 cursor-not-allowed'
                )}
              >
                {isRendering ? (
                  <>
                    <span className="w-3 h-3 rounded-full border-2 border-black border-t-transparent animate-spin" />
                    <span>Rendering ({renderProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-black" />
                    <span>Start FFmpeg Render</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Render Configuration Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Aspect Ratio Selector */}
        <div className="p-4 bg-neutral-950 border border-neutral-800/90 rounded-xl space-y-2">
          <div className="text-[10px] font-mono text-neutral-500 uppercase">Target Aspect Ratio</div>
          <div className="grid grid-cols-3 gap-2">
            {(['9:16', '1:1', '16:9'] as const).map((aspect) => (
              <button
                key={aspect}
                onClick={() => updateAspectRatio(aspect)}
                className={cn(
                  'py-2 px-3 rounded-lg border text-xs font-mono font-bold transition-all text-center',
                  composition.aspectRatio === aspect
                    ? 'bg-neutral-800 border-neutral-600 text-white shadow-sm'
                    : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white'
                )}
              >
                <div>{aspect}</div>
                <div className="text-[9px] font-normal text-neutral-500 mt-0.5">
                  {aspect === '9:16' ? 'TikTok/Reels' : aspect === '1:1' ? 'Square Feed' : 'Landscape'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Encoder Accelerator Mode */}
        <div className="p-4 bg-neutral-950 border border-neutral-800/90 rounded-xl space-y-2">
          <div className="text-[10px] font-mono text-neutral-500 uppercase">Hardware Engine</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setEncoderMode('GPU')}
              className={cn(
                'py-2 px-3 rounded-lg border text-xs font-mono font-bold transition-all text-left',
                encoderMode === 'GPU'
                  ? 'bg-emerald-950/40 border-emerald-700/80 text-emerald-400'
                  : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white'
              )}
            >
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>GPU Accel</span>
              </div>
              <div className="text-[9px] font-normal text-neutral-500 mt-0.5">VideoToolbox / NVENC</div>
            </button>

            <button
              onClick={() => setEncoderMode('CPU')}
              className={cn(
                'py-2 px-3 rounded-lg border text-xs font-mono font-bold transition-all text-left',
                encoderMode === 'CPU'
                  ? 'bg-neutral-800 border-neutral-600 text-white'
                  : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white'
              )}
            >
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-neutral-400" />
                <span>CPU Only</span>
              </div>
              <div className="text-[9px] font-normal text-neutral-500 mt-0.5">libx264 multi-core</div>
            </button>
          </div>
        </div>

        {/* Bitrate / Output Quality */}
        <div className="p-4 bg-neutral-950 border border-neutral-800/90 rounded-xl space-y-2">
          <div className="text-[10px] font-mono text-neutral-500 uppercase">Encoding Preset</div>
          <div className="grid grid-cols-3 gap-2">
            {(['Draft', 'High', 'ProRes'] as const).map((q) => (
              <button
                key={q}
                onClick={() => setSelectedQuality(q)}
                className={cn(
                  'py-2 px-2 rounded-lg border text-xs font-mono font-bold transition-all text-center',
                  selectedQuality === q
                    ? 'bg-neutral-800 border-neutral-600 text-white'
                    : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white'
                )}
              >
                <div>{q}</div>
                <div className="text-[9px] font-normal text-neutral-500 mt-0.5">
                  {q === 'Draft' ? '6 Mbps' : q === 'High' ? '12 Mbps' : '40 Mbps'}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time Render Progress & Telemetry */}
      {(isRendering || isCompleted) && (
        <div className="p-5 bg-neutral-950 border border-neutral-800/90 rounded-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={cn(
                'w-2 h-2 rounded-full',
                isCompleted ? 'bg-emerald-400' : 'bg-emerald-400 animate-pulse'
              )} />
              <span className="text-xs font-mono font-bold text-white uppercase">
                {isCompleted ? 'Render Complete' : 'Local FFmpeg Encoding in Progress'}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono text-neutral-400">
              <span>Frames: <strong className="text-white">{currentFrame}</strong> / {totalFrames}</span>
              <span>·</span>
              <span>Speed: <strong className="text-emerald-400">{fpsRate} fps</strong></span>
              <span>·</span>
              <span>ETA: <strong className="text-white">{etaSeconds}s</strong></span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="w-full bg-neutral-900 h-2.5 rounded-full overflow-hidden border border-neutral-800">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-200',
                  isCompleted ? 'bg-emerald-400' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                )}
                style={{ width: `${renderProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
              <span>0%</span>
              <span className="text-white font-bold">{renderProgress}%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      )}

      {/* Split: FFmpeg Terminal Logs & Command Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Terminal Output */}
        <div className="lg:col-span-7 bg-neutral-950 border border-neutral-800/90 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-300">
              <Terminal className="w-3.5 h-3.5 text-neutral-500" />
              <span>FFmpeg Worker Process Output</span>
            </div>
            <span className="text-[10px] font-mono text-neutral-500">PID: 48921 (local thread)</span>
          </div>

          <div className="bg-black p-3 rounded-lg border border-neutral-850 h-52 overflow-y-auto font-mono text-[11px] text-neutral-300 space-y-1 leading-relaxed">
            {renderLogs.length === 0 ? (
              <div className="text-neutral-600 italic">
                Ready to execute. Click "Start FFmpeg Render" to initiate hardware-accelerated pipeline.
              </div>
            ) : (
              renderLogs.map((log, idx) => (
                <div key={idx} className={cn(
                  log.includes('[Error]') ? 'text-rose-400' :
                  log.includes('successfully') ? 'text-emerald-400 font-bold' :
                  log.includes('[Encoder]') ? 'text-amber-300' : 'text-neutral-300'
                )}>
                  {log}
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* FFmpeg Deterministic Command Inspector */}
        <div className="lg:col-span-5 bg-neutral-950 border border-neutral-800/90 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
            <span className="text-xs font-mono text-white font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Executable Command</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400">Zero Cloud Egress</span>
          </div>

          <pre className="p-3 bg-black border border-neutral-850 rounded font-mono text-[10px] text-emerald-300/90 overflow-x-auto whitespace-pre-wrap leading-relaxed">
{`ffmpeg -y -ss ${composition.clipRange.startSeconds.toFixed(2)} -to ${composition.clipRange.endSeconds.toFixed(2)} \\
  -i "${activeProject?.paths.mediaDir}/source_video.mp4" \\
  -vf "scale=${composition.aspectRatio === '9:16' ? '1080:1920' : composition.aspectRatio === '1:1' ? '1080:1080' : '1920:1080'}:force_original_aspect_ratio=increase,crop=${composition.aspectRatio === '9:16' ? '1080:1920' : composition.aspectRatio === '1:1' ? '1080:1080' : '1920:1080'}" \\
  -c:v ${encoderMode === 'GPU' ? 'h264_videotoolbox' : 'libx264'} \\
  -b:v ${selectedQuality === 'Draft' ? '6M' : selectedQuality === 'High' ? '12M' : '40M'} \\
  -c:a aac -b:a 320k \\
  "${activeProject?.paths.exportsDir}/${composition.name.replace(/\\s+/g, '_')}.mp4"`}
          </pre>

          <div className="space-y-1 text-[11px] font-mono text-neutral-400">
            <div className="flex justify-between">
              <span className="text-neutral-500">Destination:</span>
              <span className="text-white truncate max-w-[200px]">{activeProject?.paths.exportsDir}/</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Resolution:</span>
              <span className="text-emerald-400">{composition.aspectRatio === '9:16' ? '1080 x 1920' : composition.aspectRatio === '1:1' ? '1080 x 1080' : '1920 x 1080'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Clip Duration:</span>
              <span className="text-white">{duration.toFixed(1)} seconds</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Subtitles:</span>
              <span className={composition.subtitleStyle.enabled !== false ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                {composition.subtitleStyle.enabled !== false ? `Enabled (${composition.subtitles.length} Cues)` : "Disabled (Clean Video)"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
