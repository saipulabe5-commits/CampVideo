import React from 'react';
import { useProjectStore } from '../../../application/stores/useProjectStore';
import { useSystemStore } from '../../../application/stores/useSystemStore';
import { PipelineStage } from '../../../domain/enums/PipelineStage';
import { WorkspaceHeader } from './WorkspaceHeader';
import { ProjectsStageView } from './views/ProjectsStageView';
import { UploadStageView } from './views/UploadStageView';
import { AnalyzeStageView } from './views/AnalyzeStageView';
import { RecommendStageView } from './views/RecommendStageView';
import { EditStageView } from './views/EditStageView';
import { RenderStageView } from './views/RenderStageView';
import { ExportStageView } from './views/ExportStageView';
import { SettingsView } from './views/SettingsView';
import { FolderKanban } from 'lucide-react';

export const ProjectWorkspace: React.FC = () => {
  const { activeProject, currentStage, isLoading, selectStage } = useProjectStore();
  const { activeView } = useSystemStore();

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-black text-neutral-500 font-mono text-xs">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full border-2 border-neutral-600 border-t-white animate-spin" />
          <span>INITIALIZING LOCAL DATABASE WORKSPACE...</span>
        </div>
      </div>
    );
  }

  if (activeView === 'settings') {
    return (
      <div className="h-full flex flex-col bg-black overflow-y-auto p-6 lg:p-8">
        <SettingsView />
      </div>
    );
  }

  if (!activeProject && currentStage !== PipelineStage.PROJECT) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-black text-center font-mono space-y-4">
        <FolderKanban className="w-12 h-12 stroke-1 text-neutral-600" />
        <h2 className="text-base font-bold text-white font-sans">No Project Workspace Open</h2>
        <p className="text-xs text-neutral-400 max-w-md font-sans leading-relaxed">
          Create or open a local desktop campaign project from the sidebar to begin understanding video structures.
        </p>
        <button
          onClick={() => selectStage(PipelineStage.PROJECT)}
          className="px-4 py-2 bg-white text-black font-semibold rounded-lg text-xs font-sans hover:bg-neutral-200 transition-colors"
        >
          Open Project Hub
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black overflow-hidden">
      {/* Workspace Header */}
      <WorkspaceHeader />

      {/* Dynamic Stage Canvas */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-7xl mx-auto w-full">
          {currentStage === PipelineStage.PROJECT && <ProjectsStageView />}
          {currentStage === PipelineStage.UPLOAD && <UploadStageView />}
          {currentStage === PipelineStage.ANALYZE && <AnalyzeStageView />}
          {currentStage === PipelineStage.RECOMMEND && <RecommendStageView />}
          {currentStage === PipelineStage.EDIT && <EditStageView />}
          {currentStage === PipelineStage.RENDER && <RenderStageView />}
          {currentStage === PipelineStage.EXPORT && <ExportStageView />}
        </div>
      </div>
    </div>
  );
};
