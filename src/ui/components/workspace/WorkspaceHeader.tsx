import React from 'react';
import { useProjectStore } from '../../../application/stores/useProjectStore';
import { useSystemStore } from '../../../application/stores/useSystemStore';
import { PIPELINE_STAGES, PipelineStage } from '../../../domain/enums/PipelineStage';
import { Folder, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { cn } from '../../primitives/classNames';

export const WorkspaceHeader: React.FC = () => {
  const { activeProject, currentStage, selectStage } = useProjectStore();
  const { setActiveView, accentColor } = useSystemStore();

  const getAccentClass = () => {
    switch (accentColor) {
      case 'cyan': return 'text-cyan-400';
      case 'amber': return 'text-amber-400';
      case 'neutral': return 'text-neutral-200';
      case 'emerald':
      default:
        return 'text-emerald-400';
    }
  };

  return (
    <div className="h-14 border-b border-neutral-800/80 bg-black px-6 flex items-center justify-between shrink-0 select-none">
      {/* Breadcrumb path */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
          <Folder className="w-3.5 h-3.5 text-neutral-500" />
          <span className="text-white font-semibold">{activeProject?.name || 'No Project Selected'}</span>
          <span className="text-neutral-600">/</span>
          <span className={cn('font-bold uppercase', getAccentClass())}>[{currentStage}]</span>
          {activeProject?.videoFileName && (
            <span className="hidden xl:inline text-[11px] text-neutral-500 font-mono">
              · {activeProject.videoFileName}
            </span>
          )}
        </div>
      </div>

      {/* Stage Step Progress Bar */}
      <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800/80">
        {PIPELINE_STAGES.map((s, idx) => {
          const isActive = currentStage === s.stage;
          return (
            <React.Fragment key={s.stage}>
              <button
                onClick={() => {
                  setActiveView('workspace');
                  selectStage(s.stage);
                }}
                className={cn(
                  'px-2.5 py-1 rounded text-xs font-mono transition-colors flex items-center gap-1.5',
                  isActive
                    ? 'bg-neutral-800 text-white font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200'
                )}
              >
                <span>{s.code}</span>
                <span className="hidden md:inline font-sans">{s.label}</span>
              </button>
              {idx < PIPELINE_STAGES.length - 1 && (
                <ArrowRight className="w-3 h-3 text-neutral-700 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
