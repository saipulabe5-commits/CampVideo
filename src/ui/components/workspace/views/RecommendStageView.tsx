import React from 'react';
import { useProjectStore } from '../../../../application/stores/useProjectStore';
import { PipelineStage } from '../../../../domain/enums/PipelineStage';
import { formatTimestamp } from '../../../../domain/value-objects/TimestampRange';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  Target, 
  FileCheck, 
  CheckCircle2, 
  Flame 
} from 'lucide-react';
import { cn } from '../../../primitives/classNames';

export const RecommendStageView: React.FC = () => {
  const { 
    activeRecommendations, 
    selectedRecommendationId, 
    selectRecommendation,
    selectStage 
  } = useProjectStore();

  const handleProceedToCompose = (recId: string) => {
    selectRecommendation(recId);
    selectStage(PipelineStage.EDIT);
  };

  return (
    <div className="space-y-6">
      {/* Stage Header */}
      <div className="p-5 bg-neutral-950 border border-neutral-800/90 rounded-xl space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>STAGE 04_REC // AI CAMPAIGN RECOMMENDATIONS &amp; MULTIPLE SHORT HOOK OPTIONS</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              {activeRecommendations.length > 0 ? `${activeRecommendations.length} AI Campaign Recommendations` : 'AI Campaign Recommendations'}
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-3xl">
              Dihasilkan otomatis dari pengetahuan semantik video dengan beragam opsi Short Hook berdurasi 15–25s (Shock Hook, Proof Hook, CTA Hook) siap ekspor untuk campaign buzzer.
            </p>
          </div>

          {selectedRecommendationId && (
            <button
              onClick={() => selectStage(PipelineStage.EDIT)}
              className="px-4 py-2 bg-white hover:bg-neutral-200 text-black font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <span>Open in Clip Editor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Recommendations Cards List */}
      <div className="space-y-4">
        {activeRecommendations.length === 0 ? (
          <div className="p-10 bg-neutral-950 border border-neutral-800 rounded-xl text-center space-y-3 font-mono">
            <Sparkles className="w-10 h-10 stroke-1 text-neutral-600 mx-auto" />
            <h3 className="text-sm font-bold text-white font-sans">No Campaign Recommendations Generated Yet</h3>
            <p className="text-xs text-neutral-400 font-sans max-w-md mx-auto leading-relaxed">
              Run AI video analysis in Stage 03 to extract semantic knowledge and auto-generate the 3 high-retention campaign angles (Performance, Storytelling, and Short Hook).
            </p>
            <div className="pt-2">
              <button
                onClick={() => selectStage(PipelineStage.ANALYZE)}
                className="px-4 py-2 bg-white text-black font-semibold rounded-lg text-xs font-sans hover:bg-neutral-200 transition-colors inline-flex items-center gap-2"
              >
                <span>Go to Stage 03 (AI Analyze)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          activeRecommendations.map((rec) => {
            const isSelected = selectedRecommendationId === rec.id;
            return (
              <div
                key={rec.id}
                onClick={() => selectRecommendation(rec.id)}
                className={cn(
                  'p-5 bg-neutral-950 border rounded-xl transition-all cursor-pointer space-y-4',
                  isSelected
                    ? 'border-neutral-500 ring-1 ring-neutral-500 bg-neutral-900/40'
                    : 'border-neutral-800/90 hover:border-neutral-700'
                )}
              >
                {/* Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-800/80">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'px-2.5 py-1 rounded text-xs font-mono font-bold uppercase',
                      rec.recommendationType === 'Performance'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                        : rec.recommendationType === 'Storytelling'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800/80'
                        : 'bg-rose-950 text-rose-400 border border-rose-800/80'
                    )}>
                      {rec.recommendationType}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">{rec.title}</h3>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400 mt-0.5">
                        <span className="text-neutral-300">Goal: {rec.campaignGoal}</span>
                        <span className="text-neutral-600">·</span>
                        <span className="text-emerald-400 font-bold">Klip: {rec.duration.toFixed(0)}s (Min 15s)</span>
                        <span className="text-neutral-600">·</span>
                        <span className="text-amber-400 font-bold">Hook: ≤7s</span>
                        <span className="text-neutral-600">·</span>
                        <span>Target: {rec.suggestedAspectRatio}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProceedToCompose(rec.id);
                    }}
                    className="px-3.5 py-1.5 bg-white hover:bg-neutral-200 text-black font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                  >
                    <span>Select & Edit Clip</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Timing Metadata Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 bg-neutral-900/60 border border-neutral-800/80 rounded-lg">
                    <div className="text-[10px] text-neutral-500 uppercase">Start Time</div>
                    <div className="text-white font-bold mt-1">{formatTimestamp(rec.startTime)} ({rec.startTime.toFixed(1)}s)</div>
                  </div>

                  <div className="p-3 bg-neutral-900/60 border border-neutral-800/80 rounded-lg">
                    <div className="text-[10px] text-neutral-500 uppercase">End Time</div>
                    <div className="text-white font-bold mt-1">{formatTimestamp(rec.endTime)} ({rec.endTime.toFixed(1)}s)</div>
                  </div>

                  <div className="p-3 bg-neutral-900/60 border border-neutral-800/80 rounded-lg">
                    <div className="text-[10px] text-neutral-500 uppercase">Duration</div>
                    <div className="text-emerald-400 font-bold mt-1">{rec.duration.toFixed(1)} seconds</div>
                  </div>

                  <div className="p-3 bg-neutral-900/60 border border-neutral-800/80 rounded-lg">
                    <div className="text-[10px] text-neutral-500 uppercase">Confidence Score</div>
                    <div className="text-white font-bold mt-1">{(rec.confidence.value * 100).toFixed(0)}% [{rec.confidence.level}]</div>
                  </div>
                </div>

                {/* Hook Strategy */}
                <div className="p-3 bg-neutral-900/40 border border-neutral-800/60 rounded-lg">
                  <div className="text-[10px] font-mono text-neutral-500 uppercase">Hook Angle Strategy</div>
                  <div className="text-xs text-neutral-200 mt-0.5 font-medium">{rec.hookStrategy}</div>
                </div>

                {/* Mandatory AI Explainability (Reason & Evidence) */}
                <div className="p-4 bg-neutral-900/40 border border-neutral-800/60 rounded-xl space-y-2">
                  <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Mandatory Explainability Audit</span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-emerald-400 font-semibold shrink-0">REASON:</span>
                      <span className="text-neutral-300 leading-relaxed">{rec.reason}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-amber-400 font-semibold shrink-0">EVIDENCE:</span>
                      <span className="text-neutral-300 leading-relaxed">{rec.evidence}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
