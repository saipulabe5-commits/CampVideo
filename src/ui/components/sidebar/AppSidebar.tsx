import React, { useState } from 'react';
import { useProjectStore } from '../../../application/stores/useProjectStore';
import { useSystemStore } from '../../../application/stores/useSystemStore';
import { PipelineStage, PIPELINE_STAGES } from '../../../domain/enums/PipelineStage';
import { 
  FolderKanban, 
  BrainCircuit, 
  Sparkles, 
  Layers, 
  Cpu, 
  HardDrive, 
  Plus, 
  FolderPlus, 
  Settings, 
  Activity, 
  Database,
  ChevronRight,
  ShieldCheck,
  Film,
  Upload,
  Scissors,
  Download
} from 'lucide-react';
import { cn } from '../../primitives/classNames';

export const AppSidebar: React.FC = () => {
  const { 
    projects, 
    activeProject, 
    currentStage, 
    selectProject, 
    selectStage,
    createProject 
  } = useProjectStore();

  const { activeView, setActiveView } = useSystemStore();

  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectPath, setNewProjectPath] = useState('/Users/campaign/workspace/');

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const fullPath = `${newProjectPath.replace(/\/$/, '')}/${newProjectName.replace(/\s+/g, '_')}`;
    await createProject(newProjectName.trim(), 'Desktop local campaign workspace', fullPath);
    setNewProjectName('');
    setIsCreatingProject(false);
    setActiveView('workspace');
  };

  const getStageIcon = (stage: PipelineStage) => {
    switch (stage) {
      case PipelineStage.PROJECT:
        return <FolderKanban className="w-4 h-4" />;
      case PipelineStage.UPLOAD:
        return <Upload className="w-4 h-4" />;
      case PipelineStage.ANALYZE:
        return <BrainCircuit className="w-4 h-4" />;
      case PipelineStage.RECOMMEND:
        return <Sparkles className="w-4 h-4" />;
      case PipelineStage.EDIT:
        return <Scissors className="w-4 h-4" />;
      case PipelineStage.RENDER:
        return <Cpu className="w-4 h-4" />;
      case PipelineStage.EXPORT:
        return <Download className="w-4 h-4" />;
      default:
        return <FolderKanban className="w-4 h-4" />;
    }
  };

  return (
    <aside className="w-72 bg-black border-r border-neutral-800/90 flex flex-col h-full shrink-0 select-none text-neutral-300">
      {/* Platform Brand Header */}
      <div className="p-4 border-b border-neutral-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-neutral-100 text-black flex items-center justify-center font-black text-xs tracking-tighter">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold tracking-tight text-white uppercase font-mono">
              AICampaign
            </div>
            <div className="text-[10px] text-neutral-500 font-mono">
              Desktop Engine v1.0.0
            </div>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-1.5 py-0.5 rounded">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          LOCAL
        </span>
      </div>

      {/* Project Selector / Switcher */}
      <div className="p-3 border-b border-neutral-800/80 bg-neutral-950/60">
        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mb-2">
          <span className="uppercase tracking-wider">Active Project</span>
          <button
            onClick={() => setIsCreatingProject(!isCreatingProject)}
            className="text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
            title="Create local project directory"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        {isCreatingProject ? (
          <form onSubmit={handleCreateSubmit} className="p-2.5 bg-neutral-900 border border-neutral-700 rounded-lg space-y-2">
            <div className="text-[10px] font-mono text-neutral-300 uppercase">Initialize Project</div>
            <input
              type="text"
              autoFocus
              required
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project Name..."
              className="w-full bg-black border border-neutral-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-neutral-500 font-mono"
            />
            <input
              type="text"
              value={newProjectPath}
              onChange={(e) => setNewProjectPath(e.target.value)}
              placeholder="Root Directory..."
              className="w-full bg-black border border-neutral-700 rounded px-2 py-1 text-[11px] text-neutral-400 focus:outline-none focus:border-neutral-500 font-mono"
            />
            <div className="flex items-center justify-end gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setIsCreatingProject(false)}
                className="px-2 py-0.5 text-[11px] text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-2.5 py-0.5 bg-white text-black font-semibold rounded text-[11px] hover:bg-neutral-200"
              >
                Create
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-1">
            <select
              value={activeProject?.id || ''}
              onChange={(e) => selectProject(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-medium focus:outline-none truncate"
            >
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name}
                </option>
              ))}
            </select>
            {activeProject && (
              <div className="text-[10px] font-mono text-neutral-500 truncate px-1 pt-1" title={activeProject.rootPath}>
                {activeProject.rootPath}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Core DNA Pipeline Navigation */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 px-2 mb-2">
            Pipeline DNA
          </div>

          <nav className="space-y-1">
            {PIPELINE_STAGES.map((item) => {
              const isActive = activeView === 'workspace' && currentStage === item.stage;
              return (
                <button
                  key={item.stage}
                  onClick={() => {
                    setActiveView('workspace');
                    selectStage(item.stage);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors text-left group',
                    isActive
                      ? 'bg-neutral-900 text-white font-semibold border border-neutral-700/80 shadow-inner'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-950 border border-transparent'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={cn('p-1 rounded', isActive ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-300')}>
                      {getStageIcon(item.stage)}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span>{item.label}</span>
                        <span className="font-mono text-[9px] text-neutral-500">[{item.code}]</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={cn('w-3.5 h-3.5 opacity-0 transition-opacity', isActive ? 'opacity-100 text-neutral-400' : 'group-hover:opacity-60')} />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Local Storage Scaffold Inspector */}
        {activeProject && (
          <div className="p-3 bg-neutral-950/80 border border-neutral-800/80 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
              <span className="uppercase tracking-wider flex items-center gap-1">
                <Database className="w-3 h-3 text-neutral-400" />
                <span>Project Storage</span>
              </span>
              <span className="text-emerald-400 text-[9px]">LOCAL_OK</span>
            </div>

            <div className="space-y-1 font-mono text-[10px] text-neutral-400">
              <button
                onClick={() => {
                  setActiveView('workspace');
                  selectStage(PipelineStage.PROJECT);
                }}
                className="w-full flex items-center justify-between hover:text-white transition-colors p-1 rounded hover:bg-neutral-900 text-left"
                title="View project database checkpoints"
              >
                <span>📁 project.db</span>
                <span className="text-neutral-500">SQLite v3</span>
              </button>
              <button
                onClick={() => {
                  setActiveView('workspace');
                  selectStage(PipelineStage.UPLOAD);
                }}
                className="w-full flex items-center justify-between hover:text-white transition-colors p-1 rounded hover:bg-neutral-900 text-left"
                title="View ingested video in media store"
              >
                <span>📁 media/</span>
                <span className="text-neutral-500">Source Video</span>
              </button>
              <button
                onClick={() => {
                  setActiveView('workspace');
                  selectStage(PipelineStage.ANALYZE);
                }}
                className="w-full flex items-center justify-between hover:text-white transition-colors p-1 rounded hover:bg-neutral-900 text-left"
                title="View cached analysis vectors"
              >
                <span>📁 cache/</span>
                <span className="text-neutral-500">Frames & Speech</span>
              </button>
              <button
                onClick={() => {
                  setActiveView('workspace');
                  selectStage(PipelineStage.EXPORT);
                }}
                className="w-full flex items-center justify-between hover:text-white transition-colors p-1 rounded hover:bg-neutral-900 text-left"
                title="View rendered export deliverables"
              >
                <span>📁 exports/</span>
                <span className="text-neutral-500">FFmpeg Output</span>
              </button>
              <button
                onClick={() => {
                  setActiveView('workspace');
                  selectStage(PipelineStage.PROJECT);
                }}
                className="w-full flex items-center justify-between hover:text-white transition-colors p-1 rounded hover:bg-neutral-900 text-left"
                title="View recovery checkpoints & audit logs"
              >
                <span>📁 logs/</span>
                <span className="text-neutral-500">Audit Trail</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation (Settings & System) */}
      <div className="p-3 border-t border-neutral-800/80 bg-neutral-950/40 space-y-1">
        <button
          onClick={() => setActiveView('settings')}
          className={cn(
            'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-colors text-left',
            activeView === 'settings'
              ? 'bg-neutral-900 text-white font-medium border border-neutral-700'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-950'
          )}
        >
          <Settings className="w-4 h-4" />
          <span>Engine & Providers</span>
        </button>
      </div>
    </aside>
  );
};
