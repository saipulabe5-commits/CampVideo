import React, { useState } from 'react';
import { useProjectStore } from '../../../../application/stores/useProjectStore';
import { PipelineStage } from '../../../../domain/enums/PipelineStage';
import { TRYBUZZER_CAMPAIGN_PRESETS, TryBuzzerBountyPreset } from '../../../../domain/constants/TryBuzzerBounties';
import { TryBuzzerMetadata } from '../../../../domain/entities/Project';
import { 
  FolderPlus, 
  FolderOpen, 
  Clock, 
  History, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  ArrowRight, 
  HardDrive, 
  Database,
  Trash2,
  Film,
  Sparkles,
  ShoppingBag,
  Tag,
  DollarSign
} from 'lucide-react';
import { cn } from '../../../primitives/classNames';

export const ProjectsStageView: React.FC = () => {
  const { 
    projects, 
    activeProject, 
    selectProject, 
    createProject, 
    deleteProject, 
    restoreSnapshot, 
    autosaveNow, 
    selectStage,
    lastAutosaveMessage 
  } = useProjectStore();

  const [isCreating, setIsCreating] = useState(false);
  const [selectedPresetKey, setSelectedPresetKey] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [verificationCode, setVerificationCode] = useState('TB-9941');
  const [rootPath, setRootPath] = useState(() => {
    const isWin = typeof navigator !== 'undefined' && /Windows/i.test(navigator.userAgent);
    return isWin ? 'C:/workspace/' : '/Users/campaign/workspace/';
  });
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleSelectPreset = (preset: TryBuzzerBountyPreset) => {
    setSelectedPresetKey(preset.key);
    setName(preset.title.replace(/[^a-zA-Z0-9_-]/g, '_'));
    setDescription(`TryBuzzer Bounty: ${preset.objective[0]}`);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const sanitizedName = name.trim().replace(/\s+/g, '_');
    const fullPath = `${rootPath.replace(/\/$/, '')}/${sanitizedName}`;

    let trybuzzerData: TryBuzzerMetadata | undefined = undefined;
    if (selectedPresetKey) {
      const found = TRYBUZZER_CAMPAIGN_PRESETS.find((p) => p.key === selectedPresetKey);
      if (found) {
        trybuzzerData = {
          campaignKey: found.key,
          brandName: found.brand,
          cpmRateIdr: found.cpmRateIdr,
          minViews: found.minViews,
          maxViews: found.maxViews,
          requiredHashtags: found.hashtags,
          requiredMentions: found.mentions.tiktok ? [found.mentions.tiktok] : [],
          yellowCart: found.yellowCart,
          yellowCartLink: found.yellowCartLink,
          hookMaxSeconds: found.hookMaxSeconds,
          niche: found.niche,
          objectiveFocus: found.objective.join(' · '),
          mandatoryCtaText: found.objective[0],
          verificationCode: verificationCode.trim() || 'TB-VERIFIED',
        };
      }
    }

    const newProj = await createProject(
      name.trim(), 
      description.trim() || 'Campaign workspace', 
      fullPath,
      trybuzzerData
    );

    setName('');
    setDescription('');
    setSelectedPresetKey(null);
    setIsCreating(false);
    setActionNotice(`Created project: ${newProj.name} ${trybuzzerData ? '(TryBuzzer Preset Applied)' : ''}`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleAutosave = async () => {
    await autosaveNow();
    setActionNotice('Project state autosaved successfully to SQLite project.db');
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleRestore = async (timestamp: string) => {
    await restoreSnapshot(timestamp);
    setActionNotice(`Restored snapshot from ${new Date(timestamp).toLocaleTimeString()}`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 bg-neutral-950 border border-neutral-800/90 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <Database className="w-3.5 h-3.5" />
              <span>FEATURE 01 // LOCAL PROJECT MANAGEMENT</span>
            </div>
            <h2 className="text-base font-bold text-white tracking-tight mt-1">
              Project Hub, Autosave, & State Recovery
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Manage offline-first campaign workspaces. Each project maintains its own isolated <code className="text-neutral-300 font-mono">project.db</code>, media store, and recovery checkpoints.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAutosave}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors"
              title="Trigger immediate snapshot autosave"
            >
              <Save className="w-3.5 h-3.5 text-emerald-400" />
              <span>Autosave Now</span>
            </button>

            <button
              onClick={() => setIsCreating(!isCreating)}
              className="px-3.5 py-1.5 bg-white hover:bg-neutral-200 text-black font-semibold rounded-lg text-xs font-sans flex items-center gap-1.5 transition-colors"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* Notice feedback */}
        {(actionNotice || lastAutosaveMessage) && (
          <div className="p-2.5 bg-neutral-900/60 border border-neutral-800 rounded-lg flex items-center gap-2 text-xs font-mono text-neutral-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{actionNotice || lastAutosaveMessage}</span>
          </div>
        )}
      </div>

      {/* New Project Form */}
      {isCreating && (
        <form onSubmit={handleCreate} className="p-5 bg-neutral-950 border border-neutral-700 rounded-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-xs font-bold text-white uppercase font-mono flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-emerald-400" />
              <span>Create New Campaign Project</span>
            </h3>
            <span className="text-[10px] font-mono text-neutral-400">Offline SQLite & Media Store</span>
          </div>

          {/* TryBuzzer Bounty 1-Click Presets */}
          <div className="p-3 bg-neutral-900/70 border border-neutral-800 rounded-lg space-y-2">
            <div className="text-[11px] font-mono text-amber-400 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>PILIH PRESET KAMPANYE TRYBUZZER BOUNTY:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
              {TRYBUZZER_CAMPAIGN_PRESETS.map((preset) => {
                const isSelected = selectedPresetKey === preset.key;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={cn(
                      'p-2.5 rounded-lg border text-left transition-all',
                      isSelected
                        ? 'bg-amber-950/50 border-amber-500 text-white ring-1 ring-amber-500/50'
                        : 'bg-black/60 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:text-white'
                    )}
                  >
                    <div className="font-bold text-xs truncate">{preset.title}</div>
                    <div className="text-[10px] text-amber-400/90 mt-0.5">
                      CPM Rp{preset.cpmRateIdr.toLocaleString('id-ID')} · {preset.niche}
                    </div>
                    <div className="text-[9px] text-neutral-500 mt-1 flex items-center gap-1">
                      <span>Min: {preset.minViews.toLocaleString('id-ID')}</span>
                      <span>·</span>
                      <span>Keranjang: {preset.yellowCart}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-neutral-400 font-mono text-[11px] mb-1">Project Name *</label>
              <input
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Cave_x_Duo_Bahlul_Bounty"
                className="w-full bg-black border border-neutral-800 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-neutral-600"
              />
            </div>

            <div>
              <label className="block text-neutral-400 font-mono text-[11px] mb-1">Root Storage Directory *</label>
              <input
                type="text"
                required
                value={rootPath}
                onChange={(e) => setRootPath(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded-lg p-2.5 text-neutral-300 font-mono focus:outline-none focus:border-neutral-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="block text-neutral-400 font-mono text-[11px] mb-1">Description / Campaign Goal</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. TryBuzzer Bounty: Angkat pembahasan Talent & Parfum Cave"
                className="w-full bg-black border border-neutral-800 rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-neutral-600"
              />
            </div>

            <div>
              <label className="block text-neutral-400 font-mono text-[11px] mb-1">Kode Verifikasi Akun TryBuzzer</label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="e.g. TB-9941"
                className="w-full bg-black border border-neutral-800 rounded-lg p-2.5 text-amber-400 font-mono text-xs focus:outline-none focus:border-neutral-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3 py-1.5 text-neutral-400 hover:text-white text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-white text-black font-semibold rounded-lg text-xs hover:bg-neutral-200 transition-colors"
            >
              Initialize Workspace
            </button>
          </div>
        </form>
      )}

      {/* Grid: Recent Projects & Project Recovery */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Projects List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 bg-neutral-950 border border-neutral-800/90 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase font-mono flex items-center gap-2">
                <FolderOpen className="w-3.5 h-3.5 text-neutral-400" />
                <span>Recent Projects ({projects.length})</span>
              </h3>
              <span className="text-[10px] font-mono text-neutral-500">Local Directory Store</span>
            </div>

            <div className="space-y-2.5">
              {projects.map((proj) => {
                const isActive = activeProject?.id === proj.id;
                return (
                  <div
                    key={proj.id}
                    onClick={() => selectProject(proj.id)}
                    className={cn(
                      'p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                      isActive
                        ? 'bg-neutral-900 border-neutral-600 ring-1 ring-neutral-600'
                        : 'bg-neutral-900/40 border-neutral-800/80 hover:border-neutral-700'
                    )}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white tracking-tight">{proj.name}</span>
                        {isActive && (
                          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.2 rounded">
                            CURRENT
                          </span>
                        )}
                        {proj.trybuzzer && (
                          <span className="text-[9px] font-mono text-amber-400 bg-amber-950/70 border border-amber-800/80 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                            TRYBUZZER BOUNTY · CPM Rp{proj.trybuzzer.cpmRateIdr?.toLocaleString('id-ID')}
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-neutral-500">[{proj.currentStage}]</span>
                      </div>

                      <p className="text-[11px] text-neutral-400 line-clamp-1">{proj.description}</p>

                      <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500 pt-0.5">
                        <span className="truncate max-w-[200px]" title={proj.rootPath}>{proj.rootPath}</span>
                        <span>·</span>
                        <span>{proj.videoFileName || 'No video yet'}</span>
                        <span>·</span>
                        <span>Saved {new Date(proj.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          selectProject(proj.id);
                          selectStage(proj.currentStage);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-neutral-200 text-black text-xs font-semibold rounded-md flex items-center gap-1 transition-colors"
                      >
                        <span>Open</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      {projects.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProject(proj.id);
                          }}
                          className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 rounded transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Project Recovery & Autosave Snapshots */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 bg-neutral-950 border border-neutral-800/90 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase font-mono flex items-center gap-2">
                <History className="w-3.5 h-3.5 text-emerald-400" />
                <span>Project Recovery Checkpoints</span>
              </h3>
              <span className="text-[10px] font-mono text-neutral-500">Auto-rollback</span>
            </div>

            <p className="text-[11px] text-neutral-400 leading-relaxed">
              If an offline job fails or you want to undo manual edits, rollback your project state instantly to any checkpoint.
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {(activeProject?.recoverySnapshots && activeProject.recoverySnapshots.length > 0) ? (
                activeProject.recoverySnapshots.map((snap, idx) => (
                  <div
                    key={`${snap.timestamp}-${idx}`}
                    className="p-3 bg-neutral-900/60 border border-neutral-800/80 rounded-lg space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-white font-semibold flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-neutral-400" />
                        <span>{new Date(snap.timestamp).toLocaleTimeString()}</span>
                      </span>
                      <span className="text-emerald-400">[{snap.stage}]</span>
                    </div>

                    <p className="text-[11px] text-neutral-300">{snap.description}</p>

                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={() => handleRestore(snap.timestamp)}
                        className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-[10px] font-mono flex items-center gap-1 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3 text-amber-400" />
                        <span>Restore This State</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs font-mono text-neutral-500 border border-dashed border-neutral-800 rounded-lg">
                  No snapshots recorded yet. Click "Autosave Now" to record one.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
