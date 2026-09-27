import { create } from 'zustand';
import { Project, createProjectPaths, TryBuzzerMetadata } from '../../domain/entities/Project';
import { PipelineStage } from '../../domain/enums/PipelineStage';
import { LocalProjectRepository } from '../../infrastructure/storage/LocalProjectRepository';
import { KnowledgeDatabase } from '../../domain/entities/Knowledge';
import { Recommendation, RecommendationType } from '../../domain/entities/Recommendation';
import { Composition, SubtitleCue, SubtitleStyle, TitleOverlay } from '../../domain/entities/Composition';
import { VideoMedia } from '../../domain/entities/VideoMedia';
import { LocalKnowledgeRepository } from '../../infrastructure/storage/LocalKnowledgeRepository';
import { LocalRecommendationRepository } from '../../infrastructure/storage/LocalRecommendationRepository';
import { LocalCompositionRepository } from '../../infrastructure/storage/LocalCompositionRepository';
import { createConfidenceScore } from '../../domain/value-objects/ConfidenceScore';
import { CampaignPipelineEngine } from '../../domain/services/CampaignPipelineEngine';
import { SubtitleTranslationService } from '../../domain/services/SubtitleTranslationService';
import { TitleGenerationService } from '../../domain/services/TitleGenerationService';
import { ViralThumbnailService } from '../../domain/services/ViralThumbnailService';
import { TranscriptionApiService } from '../../domain/services/TranscriptionApiService';
import { OpenAIService } from '../../providers/openai/OpenAIService';
import { GeminiService } from '../../providers/gemini/GeminiService';
import { OllamaService } from '../../providers/ollama/OllamaService';
import { useJobQueueStore } from './useJobQueueStore';
import { useSystemStore } from './useSystemStore';
import { JobStatus, JobType } from '../../domain/enums/JobStatus';

const projectRepo = new LocalProjectRepository();
const knowledgeRepo = new LocalKnowledgeRepository();
const recommendationRepo = new LocalRecommendationRepository();
const compositionRepo = new LocalCompositionRepository();

// Sample campaign keynote video stream for out-of-the-box local desktop testing
const DEFAULT_SAMPLE_VIDEO_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

interface ProjectState {
  projects: readonly Project[];
  activeProject: Project | null;
  currentStage: PipelineStage;
  activeVideoMedia: VideoMedia | null;
  activeKnowledge: KnowledgeDatabase | null;
  activeRecommendations: readonly Recommendation[];
  activeCompositions: readonly Composition[];
  selectedRecommendationId: string | null;
  selectedCompositionId: string | null;
  isLoading: boolean;
  isAnalyzing: boolean;
  analysisProgress: { percent: number; step: string };
  error: string | null;
  lastAutosaveMessage: string | null;

  // Navigation / Actions
  initialize: () => Promise<void>;
  selectProject: (id: string) => Promise<void>;
  selectStage: (stage: PipelineStage) => void;
  createProject: (name: string, description: string, rootPath: string, trybuzzer?: TryBuzzerMetadata) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  restoreSnapshot: (snapshotTimestamp: string) => Promise<void>;
  autosaveNow: () => Promise<void>;
  updateTryBuzzerMetadata: (metadata: Partial<TryBuzzerMetadata>) => void;
  
  // Video Ingestion
  ingestVideo: (media: Partial<VideoMedia>) => Promise<void>;
  
  // AI Video Analysis
  runVideoAnalysis: () => Promise<void>;
  
  // Recommendation & Composition Selection
  selectRecommendation: (id: string | null) => void;
  selectComposition: (id: string | null) => void;
  
  // Review & Edit Operations
  updateClipRange: (startSec: number, endSec: number) => void;
  toggleMergeSegment: (enabled: boolean, mergeRange?: { startSeconds: number; endSeconds: number }) => void;
  updateSubtitleCueText: (cueId: string, newText: string, lang?: 'id' | 'en') => void;
  addSubtitleCue: (startSeconds?: number, text?: string) => void;
  deleteSubtitleCue: (cueId: string) => void;
  clearAllSubtitles: () => void;
  resetSubtitlesFromTranscripts: () => void;
  updateSubtitleStyle: (style: Partial<SubtitleStyle>) => void;
  setSubtitleLanguage: (lang: 'id' | 'en' | 'dual') => void;
  autoTranslateSubtitles: () => void;
  resyncSubtitlesWithAudio: () => void;
  importCustomSubtitleScript: (fullScript: string) => void;
  applySpecificVideoDialogue: () => void;
  transcribeCurrentVideoAudio: (customFileOrBlob?: File | Blob) => Promise<{ success: boolean; count: number; message: string }>;
  isTranscribingAudio: boolean;
  transcriptionProgressMessage: string | null;
  activeVideoFile: File | null;
  setActiveVideoFile: (file: File | null) => void;
  updateSubtitleCueTiming: (cueId: string, startSec: number, endSec: number) => void;
  generateSmartSubtitlesForClip: (topicInput?: string) => void;
  generateMoreTitles: (language?: 'id' | 'en') => void;
  selectTitleOverlay: (title: string) => void;
  updateTitleOverlay: (overlay: Partial<TitleOverlay>) => void;
  updateThumbnailTimestamp: (sec: number) => void;
  generateViralThumbnails: () => void;
  updateAspectRatio: (aspect: '9:16' | '1:1' | '16:9') => void;

  refreshActiveProjectData: () => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  activeProject: null,
  currentStage: PipelineStage.UPLOAD,
  activeVideoFile: null,
  isTranscribingAudio: false,
  transcriptionProgressMessage: null,
  setActiveVideoFile: (file: File | null) => set({ activeVideoFile: file }),
  activeVideoMedia: {
    id: 'vid-keynote-4k.mp4',
    projectId: 'proj-acme-launch-2026',
    fileName: 'HyperScale_Keynote_4K.mp4',
    filePath: '/Users/campaign/workspace/HyperScale_Keynote/media/HyperScale_Keynote_4K.mp4',
    fileSizeBytes: 245082400, // ~245 MB
    durationSeconds: 154.5,
    width: 3840,
    height: 2160,
    fps: 60,
    codec: 'h264 (High Profile)',
    audioCodec: 'aac (LC)',
    audioChannels: 2,
    sampleRateHz: 48000,
    bitrateKbps: 12800,
    previewUrl: DEFAULT_SAMPLE_VIDEO_URL,
    ingestedAt: '2026-09-26T10:30:00.000Z',
  },
  activeKnowledge: null,
  activeRecommendations: [],
  activeCompositions: [],
  selectedRecommendationId: null,
  selectedCompositionId: null,
  isLoading: true,
  isAnalyzing: false,
  analysisProgress: { percent: 0, step: 'Idle' },
  error: null,
  lastAutosaveMessage: null,

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });
      const list = await projectRepo.getAll();
      const first = list[0] || null;
      set({ projects: list, activeProject: first });
      if (first) {
        await get().selectProject(first.id);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to initialize projects';
      set({ error: message });
    } finally {
      set({ isLoading: false });
    }
  },

  selectProject: async (id: string) => {
    const list = get().projects;
    const project = list.find((p) => p.id === id) || null;
    if (!project) return;

    set({ activeProject: project, currentStage: project.currentStage });

    // Load related knowledge, recommendations, and compositions for active project
    const [knowledge, recommendations, compositions] = await Promise.all([
      knowledgeRepo.getByProjectId(id),
      recommendationRepo.getByProjectId(id),
      compositionRepo.getByProjectId(id),
    ]);

    const vFileName = (project.videoFileName || '').toLowerCase();
    const isWaterVideo = /minum|air_putih|hidrasi/i.test(vFileName) || (project.id === 'proj-acme-launch-2026' && !project.videoFileName);

    let effectiveRecommendations = recommendations;
    let effectiveCompositions = compositions;
    let effectiveKnowledge = knowledge;

    const hasOutdatedRecs = recommendations.length === 0 || recommendations.some((r) => /14 Hours Saved|Manual Video Editing|Never Upload 10GB/i.test(r.title || ''));
    const hasOutdatedComps = compositions.length === 0 || compositions.some((c) => c.subtitles.some((s) => /legacy|editing has hit a wall|metode edit/i.test(s.text || '')));

    if (hasOutdatedRecs || hasOutdatedComps) {
      const activeVideoFileName = project.videoFileName || (isWaterVideo ? 'source_video.mp4' : 'custom_video.mp4');
      const tempMedia: VideoMedia = {
        id: project.sourceVideoId || `vid-${project.id}`,
        projectId: project.id,
        fileName: activeVideoFileName,
        filePath: `${project.paths.mediaDir}/${activeVideoFileName}`,
        fileSizeBytes: 245082400,
        durationSeconds: project.videoDurationSeconds || (isWaterVideo ? 10.0 : 60.0),
        width: 1920,
        height: 1080,
        fps: 60,
        codec: 'h264 (High Profile)',
        audioCodec: 'aac (LC)',
        audioChannels: 2,
        sampleRateHz: 48000,
        bitrateKbps: 12800,
        previewUrl: DEFAULT_SAMPLE_VIDEO_URL,
        ingestedAt: project.updatedAt || new Date().toISOString(),
      };

      const dynKnowledge = CampaignPipelineEngine.extractKnowledge(
        project.id,
        tempMedia,
        'Dynamic Content Engine',
        project.trybuzzer
      );
      await knowledgeRepo.save(dynKnowledge);
      effectiveKnowledge = dynKnowledge;

      const dynRecs = CampaignPipelineEngine.generateRecommendations(dynKnowledge, project.trybuzzer);
      await recommendationRepo.saveMany(dynRecs);
      effectiveRecommendations = dynRecs;

      const dynComp = CampaignPipelineEngine.createComposition(project.id, dynRecs[0], dynKnowledge);
      await compositionRepo.save(dynComp);
      effectiveCompositions = [dynComp];
    }

    const videoMedia: VideoMedia = {
      id: project.sourceVideoId || `vid-${project.id}`,
      projectId: project.id,
      fileName: project.videoFileName || 'source_video.mp4',
      filePath: `${project.paths.mediaDir}/${project.videoFileName || 'source_video.mp4'}`,
      fileSizeBytes: 245082400,
      durationSeconds: project.videoDurationSeconds || 154.5,
      width: 1920,
      height: 1080,
      fps: 60,
      codec: 'h264 (High Profile)',
      audioCodec: 'aac (LC)',
      audioChannels: 2,
      sampleRateHz: 48000,
      bitrateKbps: 12800,
      previewUrl: DEFAULT_SAMPLE_VIDEO_URL,
      ingestedAt: project.updatedAt || new Date().toISOString(),
    };

    set({
      activeVideoMedia: videoMedia,
      activeKnowledge: effectiveKnowledge,
      activeRecommendations: effectiveRecommendations,
      activeCompositions: effectiveCompositions,
      selectedRecommendationId: effectiveRecommendations[0]?.id || null,
      selectedCompositionId: effectiveCompositions[0]?.id || null,
      lastAutosaveMessage: `Loaded ${project.name} (${project.paths.projectDb})`,
    });
  },

  selectStage: (stage: PipelineStage) => {
    const active = get().activeProject;
    if (active) {
      projectRepo.updateStage(active.id, stage);
      set({ currentStage: stage });
    } else {
      set({ currentStage: stage });
    }
  },

  createProject: async (name: string, description: string, rootPath: string, trybuzzer?: TryBuzzerMetadata) => {
    const id = `proj-${Date.now()}`;
    const paths = createProjectPaths(rootPath);
    const newProj: Project = {
      id,
      name,
      description,
      rootPath,
      paths,
      currentStage: PipelineStage.UPLOAD,
      trybuzzer,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastAutosavedAt: new Date().toISOString(),
      recoverySnapshots: [
        {
          timestamp: new Date().toISOString(),
          stage: PipelineStage.UPLOAD,
          description: 'Project scaffold created and SQLite initialized',
        },
      ],
    };

    await projectRepo.save(newProj);
    const updatedList = await projectRepo.getAll();
    set({ projects: updatedList });
    await get().selectProject(id);
    return newProj;
  },

  updateTryBuzzerMetadata: (metadata: Partial<TryBuzzerMetadata>) => {
    const active = get().activeProject;
    if (!active) return;
    const updated: Project = {
      ...active,
      trybuzzer: {
        ...(active.trybuzzer || {}),
        ...metadata,
      },
      updatedAt: new Date().toISOString(),
    };
    projectRepo.save(updated);
    const updatedProjects = get().projects.map((p) => (p.id === updated.id ? updated : p));
    set({ projects: updatedProjects, activeProject: updated });
  },

  deleteProject: async (id: string) => {
    await projectRepo.delete(id);
    const updatedList = await projectRepo.getAll();
    set({ projects: updatedList });
    if (updatedList.length > 0) {
      await get().selectProject(updatedList[0].id);
    } else {
      set({
        activeProject: null,
        activeKnowledge: null,
        activeRecommendations: [],
        activeCompositions: [],
      });
    }
  },

  restoreSnapshot: async (snapshotTimestamp: string) => {
    const active = get().activeProject;
    if (!active || !active.recoverySnapshots) return;
    const snap = active.recoverySnapshots.find((s) => s.timestamp === snapshotTimestamp);
    if (!snap) return;

    const restoredProject: Project = {
      ...active,
      currentStage: snap.stage,
      updatedAt: new Date().toISOString(),
    };
    await projectRepo.save(restoredProject);
    const updatedProjects = get().projects.map((p) => p.id === restoredProject.id ? restoredProject : p);
    set({ projects: updatedProjects, activeProject: restoredProject, currentStage: snap.stage });
    set({ lastAutosaveMessage: `Restored snapshot from ${new Date(snapshotTimestamp).toLocaleTimeString()}` });
  },

  autosaveNow: async () => {
    const active = get().activeProject;
    if (!active) return;
    const now = new Date().toISOString();
    const updatedProject: Project = {
      ...active,
      lastAutosavedAt: now,
      recoverySnapshots: [
        {
          timestamp: now,
          stage: get().currentStage,
          description: `Autosaved state at ${new Date(now).toLocaleTimeString()}`,
        },
        ...(active.recoverySnapshots || []).slice(0, 9), // keep last 10
      ],
      updatedAt: now,
    };
    await projectRepo.save(updatedProject);
    const updatedProjects = get().projects.map((p) => p.id === updatedProject.id ? updatedProject : p);
    set({ projects: updatedProjects, activeProject: updatedProject, lastAutosaveMessage: `Autosaved at ${new Date(now).toLocaleTimeString()}` });
  },

  ingestVideo: async (mediaData: Partial<VideoMedia>) => {
    const active = get().activeProject;
    if (!active) return;

    const fileName = mediaData.fileName || 'source_video.mp4';
    const newMedia: VideoMedia = {
      id: `vid-${Date.now()}`,
      projectId: active.id,
      fileName,
      filePath: `${active.paths.mediaDir}/${fileName}`,
      fileSizeBytes: mediaData.fileSizeBytes || 184500000,
      durationSeconds: mediaData.durationSeconds || 120.0,
      width: mediaData.width || 1920,
      height: mediaData.height || 1080,
      fps: mediaData.fps || 60,
      codec: mediaData.codec || 'h264 (High Profile)',
      audioCodec: mediaData.audioCodec || 'aac',
      audioChannels: mediaData.audioChannels || 2,
      sampleRateHz: mediaData.sampleRateHz || 48000,
      bitrateKbps: mediaData.bitrateKbps || 12000,
      previewUrl: mediaData.previewUrl || DEFAULT_SAMPLE_VIDEO_URL,
      ingestedAt: new Date().toISOString(),
    };

    // Update project with video reference
    const updatedProject: Project = {
      ...active,
      sourceVideoId: newMedia.id,
      videoFileName: newMedia.fileName,
      videoDurationSeconds: newMedia.durationSeconds,
      updatedAt: new Date().toISOString(),
    };
    await projectRepo.save(updatedProject);
    const updatedProjects = get().projects.map((p) => p.id === updatedProject.id ? updatedProject : p);

    // Dynamic extraction: immediately adapt knowledge, recommendations, and compositions to the new video!
    const freshKnowledge = CampaignPipelineEngine.extractKnowledge(
      active.id,
      newMedia,
      'Local Faster-Whisper + Dynamic Content Engine',
      active.trybuzzer
    );
    await knowledgeRepo.save(freshKnowledge);

    const freshRecommendations = CampaignPipelineEngine.generateRecommendations(freshKnowledge, active.trybuzzer);
    await recommendationRepo.saveMany(freshRecommendations);

    const topRec = freshRecommendations[0];
    const freshComposition = CampaignPipelineEngine.createComposition(active.id, topRec, freshKnowledge);
    await compositionRepo.save(freshComposition);

    set({
      projects: updatedProjects,
      activeProject: updatedProject,
      activeVideoMedia: newMedia,
      activeKnowledge: freshKnowledge,
      activeRecommendations: freshRecommendations,
      activeCompositions: [freshComposition],
      selectedRecommendationId: topRec ? topRec.id : null,
      selectedCompositionId: freshComposition ? freshComposition.id : null,
      lastAutosaveMessage: `Video ${newMedia.fileName} berhasil disinkronkan otomatis`,
    });
    get().autosaveNow();
  },

  runVideoAnalysis: async () => {
    const active = get().activeProject;
    if (!active) return;

    const queueStore = useJobQueueStore.getState();
    const job = await queueStore.enqueueJob(active.id, JobType.EXTRACT_KNOWLEDGE, {
      videoId: active.sourceVideoId || active.videoFileName,
    });

    set({ isAnalyzing: true, analysisProgress: { percent: 10, step: 'Extracting audio & audio waveform probe...' } });
    await queueStore.updateJob(job.id, {
      status: JobStatus.RUNNING,
      progressPct: 10,
      currentStepMessage: 'Extracting audio & audio waveform probe...',
    });

    // Deterministic clean background progression simulation
    await new Promise((r) => setTimeout(r, 600));
    set({ analysisProgress: { percent: 35, step: 'Running local Faster-Whisper speech model...' } });
    await queueStore.updateJob(job.id, {
      progressPct: 35,
      currentStepMessage: 'Running local Faster-Whisper speech model...',
    });

    await new Promise((r) => setTimeout(r, 700));
    set({ analysisProgress: { percent: 65, step: 'Detecting hooks, problems, solutions, & emotional resonance...' } });
    await queueStore.updateJob(job.id, {
      progressPct: 65,
      currentStepMessage: 'Detecting hooks, problems, solutions, & emotional resonance...',
    });

    await new Promise((r) => setTimeout(r, 600));
    set({ analysisProgress: { percent: 90, step: 'Synthesizing scene cuts & indexing into local SQLite project.db...' } });
    await queueStore.updateJob(job.id, {
      progressPct: 90,
      currentStepMessage: 'Synthesizing scene cuts & indexing into local SQLite project.db...',
    });

    await new Promise((r) => setTimeout(r, 400));

    // Extract knowledge from active video media using Clean Architecture domain engine
    const activeMedia = get().activeVideoMedia || {
      id: active.sourceVideoId || 'source_video.mp4',
      projectId: active.id,
      fileName: active.videoFileName || 'source_video.mp4',
      filePath: `${active.paths.mediaDir}/${active.videoFileName || 'source_video.mp4'}`,
      fileSizeBytes: 245082400,
      durationSeconds: active.videoDurationSeconds || 154.5,
      width: 1920,
      height: 1080,
      fps: 60,
      codec: 'h264 (High Profile)',
      audioCodec: 'aac (LC)',
      audioChannels: 2,
      sampleRateHz: 48000,
      bitrateKbps: 12800,
      previewUrl: DEFAULT_SAMPLE_VIDEO_URL,
      ingestedAt: new Date().toISOString(),
    };

    const systemStore = useSystemStore.getState();
    const activeProviderId = systemStore.activeProviderId;
    const openaiApiKey = systemStore.openaiApiKey;
    const openaiModel = systemStore.openaiModel || 'gpt-4o';
    const geminiApiKey = systemStore.geminiApiKey;
    const geminiModel = systemStore.geminiModel || 'gemini-2.5-flash';
    const ollamaEndpoint = systemStore.ollamaEndpoint || 'http://localhost:11434';
    const ollamaModel = systemStore.ollamaModel || 'llama3.3';

    let extractedKnowledge: KnowledgeDatabase;

    if (activeProviderId === 'provider-gemini' && geminiApiKey && geminiApiKey.trim().length > 10) {
      set({ analysisProgress: { percent: 75, step: `Connecting live to Google Gemini API (${geminiModel})...` } });
      try {
        const gemRes = await GeminiService.extractCampaignKnowledge(
          geminiApiKey,
          geminiModel,
          active.id,
          {
            projectName: active.name,
            description: active.description,
            videoDurationSeconds: activeMedia.durationSeconds,
            trybuzzer: active.trybuzzer,
          }
        );
        extractedKnowledge = gemRes.knowledge;
      } catch (err: unknown) {
        console.warn('Gemini live call failed, falling back to domain extractor:', err);
        const providerLabel = `Google Gemini (${geminiModel}) + Domain Fallback`;
        extractedKnowledge = CampaignPipelineEngine.extractKnowledge(active.id, activeMedia, providerLabel, active.trybuzzer);
      }
    } else if (activeProviderId === 'provider-ollama') {
      set({ analysisProgress: { percent: 75, step: `Connecting to Ollama Local Engine (${ollamaModel})...` } });
      try {
        const olRes = await OllamaService.extractCampaignKnowledge(
          ollamaEndpoint,
          ollamaModel,
          active.id,
          {
            projectName: active.name,
            description: active.description,
            videoDurationSeconds: activeMedia.durationSeconds,
            trybuzzer: active.trybuzzer,
          }
        );
        extractedKnowledge = olRes.knowledge;
      } catch (err: unknown) {
        console.warn('Ollama local call failed, falling back to domain extractor:', err);
        const providerLabel = `Ollama (${ollamaModel}) + Domain Fallback`;
        extractedKnowledge = CampaignPipelineEngine.extractKnowledge(active.id, activeMedia, providerLabel, active.trybuzzer);
      }
    } else if (activeProviderId === 'provider-openai' && openaiApiKey && openaiApiKey.trim().length > 10) {
      set({ analysisProgress: { percent: 75, step: `Connecting live to OpenAI API (${openaiModel})...` } });
      try {
        const oaiRes = await OpenAIService.extractCampaignKnowledge(
          openaiApiKey,
          openaiModel,
          active.id,
          {
            projectName: active.name,
            description: active.description,
            videoDurationSeconds: activeMedia.durationSeconds,
            trybuzzer: active.trybuzzer,
          }
        );
        extractedKnowledge = oaiRes.knowledge;
      } catch (err: unknown) {
        console.warn('OpenAI live call failed, falling back to local domain extractor:', err);
        const providerLabel = `OpenAI (${openaiModel}) + Domain Fallback`;
        extractedKnowledge = CampaignPipelineEngine.extractKnowledge(active.id, activeMedia, providerLabel, active.trybuzzer);
      }
    } else {
      const providerLabel = activeProviderId === 'provider-ollama'
        ? 'Ollama (Offline Local Llama-3 8B)'
        : activeProviderId === 'provider-gemini'
        ? 'Google Gemini Multimodal (Domain Extraction / Set Key in Settings)'
        : activeProviderId === 'provider-openai'
        ? 'OpenAI Engine (Domain Extraction / Set Key in Settings)'
        : 'Local Faster-Whisper + Clean Domain Extractor';

      extractedKnowledge = CampaignPipelineEngine.extractKnowledge(active.id, activeMedia, providerLabel, active.trybuzzer);
    }

    await knowledgeRepo.save(extractedKnowledge);

    // Generate 3 campaign recommendations strictly FROM knowledge (zero subsequent AI calls)
    const generatedRecommendations = CampaignPipelineEngine.generateRecommendations(extractedKnowledge, active.trybuzzer);
    await recommendationRepo.saveMany(generatedRecommendations);

    // Compose the initial composition for the primary recommendation
    const topRec = generatedRecommendations[0];
    const initialComp = CampaignPipelineEngine.createComposition(active.id, topRec, extractedKnowledge);
    await compositionRepo.save(initialComp);

    await queueStore.updateJob(job.id, {
      status: JobStatus.COMPLETED,
      progressPct: 100,
      currentStepMessage: '12 semantic structures extracted & indexed in SQLite project.db',
      completedAt: new Date().toISOString(),
    });

    set({
      isAnalyzing: false,
      analysisProgress: { percent: 100, step: 'Analysis Complete' },
      activeKnowledge: extractedKnowledge,
      activeRecommendations: generatedRecommendations,
      activeCompositions: [initialComp],
      selectedRecommendationId: topRec.id,
      selectedCompositionId: initialComp.id,
      currentStage: PipelineStage.RECOMMEND,
    });

    // Update project stage
    await projectRepo.updateStage(active.id, PipelineStage.RECOMMEND);
    get().autosaveNow();
  },

  selectRecommendation: (id: string | null) => {
    set({ selectedRecommendationId: id });
    const rec = get().activeRecommendations.find((r) => r.id === id);
    const comp = get().activeCompositions[0];
    const knowledge = get().activeKnowledge;
    const project = get().activeProject;

    if (rec && project) {
      if (knowledge) {
        const fresh = CampaignPipelineEngine.createComposition(project.id, rec, knowledge);
        const mergedComp: Composition = {
          ...fresh,
          id: comp?.id || fresh.id,
          aspectRatio: comp?.aspectRatio || fresh.aspectRatio,
          subtitleStyle: comp?.subtitleStyle || fresh.subtitleStyle,
        };
        compositionRepo.save(mergedComp);
        set({ activeCompositions: [mergedComp], selectedCompositionId: mergedComp.id });
      } else if (comp) {
        const updatedComp: Composition = {
          ...comp,
          recommendationId: rec.id,
          name: `${rec.title} (${comp.aspectRatio})`,
          clipRange: rec.selectedRange,
          titleOverlay: {
            ...comp.titleOverlay,
            text: rec.title.toUpperCase(),
          },
          thumbnailTimestampSec: Number((rec.startTime + 2.5).toFixed(2)),
          suggestedThumbnailTimestampSec: Number((rec.startTime + 2.5).toFixed(2)),
        };
        compositionRepo.save(updatedComp);
        set({ activeCompositions: [updatedComp], selectedCompositionId: updatedComp.id });
      }
    }
  },

  selectComposition: (id: string | null) => {
    set({ selectedCompositionId: id });
  },

  updateClipRange: (startSec: number, endSec: number) => {
    const comp = get().activeCompositions[0];
    if (!comp) return;
    const clampedStart = Math.max(0, Number(startSec.toFixed(2)));
    const clampedEnd = Math.max(clampedStart + 1, Number(endSec.toFixed(2)));
    const viralCandidates = ViralThumbnailService.generateCandidates(clampedStart, clampedEnd);

    const updated: Composition = {
      ...comp,
      clipRange: {
        startSeconds: clampedStart,
        endSeconds: clampedEnd,
      },
      viralCandidates,
      updatedAt: new Date().toISOString(),
    };
    compositionRepo.save(updated);
    set({ activeCompositions: [updated] });
  },

  toggleMergeSegment: (enabled: boolean, mergeRange?: { startSeconds: number; endSeconds: number }) => {
    const comp = get().activeCompositions[0];
    if (!comp) return;
    const updated: Composition = {
      ...comp,
      mergedRange: enabled ? (mergeRange || { startSeconds: 105.0, endSeconds: 110.0 }) : undefined,
      updatedAt: new Date().toISOString(),
    };
    compositionRepo.save(updated);
    set({ activeCompositions: [updated] });
  },

  updateSubtitleCueText: (cueId: string, newText: string) => {
    const comp = get().activeCompositions[0];
    if (!comp) return;

    const nextCues = comp.subtitles.map((cue) => {
      if (cue.id !== cueId) return cue;
      return {
        ...cue,
        text: newText,
        textId: newText,
        textEn: newText,
      };
    });

    const updated: Composition = {
      ...comp,
      subtitles: nextCues,
      updatedAt: new Date().toISOString(),
    };
    compositionRepo.save(updated);
    set({ activeCompositions: [updated] });
  },

  addSubtitleCue: (startSeconds?: number, text?: string) => {
    const comp = get().activeCompositions[0];
    if (!comp) return;
    const clipStart = comp.clipRange.startSeconds;
    const clipEnd = comp.clipRange.endSeconds;
    const lastCue = comp.subtitles[comp.subtitles.length - 1];

    let newStart = startSeconds !== undefined ? startSeconds : (lastCue ? lastCue.endSeconds : clipStart);
    if (newStart < clipStart || newStart >= clipEnd) {
      newStart = clipStart;
    }
    const newEnd = Math.min(clipEnd, Number((newStart + 2.5).toFixed(2)));
    const defaultText = text || 'Subtitle baru';

    const newCue: SubtitleCue = {
      id: `cue-${Date.now()}`,
      startSeconds: Number(newStart.toFixed(2)),
      endSeconds: Number(newEnd.toFixed(2)),
      text: defaultText,
      textId: defaultText,
      textEn: defaultText,
    };

    const nextCues = [...comp.subtitles, newCue].sort((a, b) => a.startSeconds - b.startSeconds);
    const updated: Composition = {
      ...comp,
      subtitles: nextCues,
      updatedAt: new Date().toISOString(),
    };
    compositionRepo.save(updated);
    set({ activeCompositions: [updated], lastAutosaveMessage: 'Baris subtitle ditambahkan' });
  },

  deleteSubtitleCue: (cueId: string) => {
    const comp = get().activeCompositions[0];
    if (!comp) return;
    const nextCues = comp.subtitles.filter((c) => c.id !== cueId);
    const updated: Composition = {
      ...comp,
      subtitles: nextCues,
      updatedAt: new Date().toISOString(),
    };
    compositionRepo.save(updated);
    set({ activeCompositions: [updated], lastAutosaveMessage: 'Baris subtitle dihapus' });
  },

  clearAllSubtitles: () => {
    const comp = get().activeCompositions[0];
    if (!comp) return;
    const updated: Composition = {
      ...comp,
      subtitles: [],
      updatedAt: new Date().toISOString(),
    };
    compositionRepo.save(updated);
    set({ activeCompositions: [updated], lastAutosaveMessage: 'Semua baris subtitle telah dihapus' });
  },

  resetSubtitlesFromTranscripts: () => {
    const comp = get().activeCompositions[0];
    if (!comp) return;
    const kb = get().activeKnowledge;
    const clipStart = comp.clipRange.startSeconds;
    const clipEnd = comp.clipRange.endSeconds;

    const newCues: SubtitleCue[] = [];
    if (kb?.transcripts && kb.transcripts.length > 0) {
      kb.transcripts.forEach((tr, idx) => {
        if (!tr || !tr.range) return;
        const trStart = tr.range.startSeconds ?? 0;
        const trEnd = tr.range.endSeconds ?? 0;
        if (trEnd > clipStart && trStart < clipEnd) {
          const text = (tr.text || '').trim();
          if (!text) return;
          const cStart = Math.max(clipStart, trStart);
          const cEnd = Math.min(clipEnd, trEnd);
          if (cEnd - cStart >= 0.2) {
            newCues.push({
              id: `cue-tr-${idx}-${Date.now()}`,
              startSeconds: Number(cStart.toFixed(2)),
              endSeconds: Number(cEnd.toFixed(2)),
              text,
              textId: text,
              textEn: text,
            });
          }
        }
      });
    }

    const updated: Composition = {
      ...comp,
      subtitles: newCues,
      updatedAt: new Date().toISOString(),
    };
    compositionRepo.save(updated);
    set({
      activeCompositions: [updated],
      lastAutosaveMessage: newCues.length > 0 ? `${newCues.length} baris subtitle dimuat dari transkrip video` : 'Tidak ditemukan rekaman transkrip pada rentang klip ini'
    });
  },

  setSubtitleLanguage: (lang: 'id' | 'en' | 'dual') => {
    const comp = get().activeCompositions[0];
    if (!comp) return;

    // Enrich existing cues with dual translations if not already populated
    const enrichedCues = SubtitleTranslationService.enrichBilingualCues(comp.subtitles, lang);

    const targetTitleLang = lang === 'en' ? 'en' : 'id';
    const rec = get().activeRecommendations.find((r) => r.id === comp.recommendationId) || get().activeRecommendations[0];
    const kb = get().activeKnowledge;
    const newTitles = rec ? TitleGenerationService.generateTitles(rec, kb || undefined, targetTitleLang) : comp.generatedTitles;
    const activeTitle = newTitles[0] || comp.titleOverlay.text;

    const updated: Composition = {
      ...comp,
      subtitles: enrichedCues,
      generatedTitles: newTitles,
      titleOverlay: {
        ...comp.titleOverlay,
        text: activeTitle,
      },
      subtitleStyle: {
        ...comp.subtitleStyle,
        language: lang,
      },
      updatedAt: new Date().toISOString(),
    };
    compositionRepo.save(updated);
    set({ activeCompositions: [updated] });
  },

  autoTranslateSubtitles: () => {
    const comp = get().activeCompositions[0];
    if (!comp) return;

    const currentLang = comp.subtitleStyle.language || 'id';
    const enrichedCues = SubtitleTranslationService.enrichBilingualCues(comp.subtitles, currentLang);
    const updated: Composition = {
      ...comp,
      subtitles: enrichedCues,
      updatedAt: new Date().toISOString(),
    };
    compositionRepo.save(updated);
    set({ activeCompositions: [updated] });
  },

  resyncSubtitlesWithAudio: () => {
    const comp = get().activeCompositions[0];
    if (!comp) return;
    const kb = get().activeKnowledge;
    const clipStart = comp.clipRange.startSeconds;
    const clipEnd = comp.clipRange.endSeconds;

    const newCues: SubtitleCue[] = [];
    if (kb && kb.transcripts && kb.transcripts.length > 0) {
      kb.transcripts.forEach((tr, idx) => {
        if (!tr || !tr.range) return;
        const trStart = tr.range.startSeconds ?? 0;
        const trEnd = tr.range.endSeconds ?? 0;
        if (trEnd > clipStart && trStart < clipEnd) {
          const words = (tr.text || '').trim().split(/\s+/).filter(Boolean);
          if (words.length === 0) return;

          const chunkSize = 4;
          const totalChunks = Math.ceil(words.length / chunkSize);
          const trDuration = Math.max(0.5, trEnd - trStart);
          const chunkDuration = trDuration / totalChunks;

          for (let i = 0; i < words.length; i += chunkSize) {
            const chunkWords = words.slice(i, i + chunkSize).join(' ');
            const chunkIdx = Math.floor(i / chunkSize);
            const rawStart = trStart + chunkIdx * chunkDuration;
            const rawEnd = rawStart + chunkDuration;

            if (rawEnd <= clipStart || rawStart >= clipEnd) continue;

            const cStart = Math.max(clipStart, rawStart);
            const cEnd = Math.min(clipEnd, rawEnd);

            if (cEnd - cStart >= 0.2) {
              newCues.push({
                id: `cue-${idx}-${chunkIdx}`,
                startSeconds: Number(cStart.toFixed(2)),
                endSeconds: Number(cEnd.toFixed(2)),
                text: chunkWords,
              });
            }
          }
        }
      });
    }

    let finalCues = newCues;
    if (finalCues.length === 0 && comp.subtitles.length > 0) {
      const total = comp.subtitles.length;
      const duration = Math.max(1.0, clipEnd - clipStart);
      const cueDur = duration / total;
      finalCues = comp.subtitles.map((cue, idx) => {
        const cStart = clipStart + idx * cueDur;
        const cEnd = idx === total - 1 ? clipEnd : cStart + cueDur;
        return {
          ...cue,
          startSeconds: Number(cStart.toFixed(2)),
          endSeconds: Number(cEnd.toFixed(2)),
        };
      });
    }

    const targetLang = comp.subtitleStyle.language || 'id';
    const enrichedCues = SubtitleTranslationService.enrichBilingualCues(
      finalCues.length > 0 ? finalCues : comp.subtitles,
      targetLang
    );

    const updated: Composition = {
      ...comp,
      subtitles: enrichedCues,
      updatedAt: new Date().toISOString(),
    };
    compositionRepo.save(updated);
    set({ activeCompositions: [updated] });
  },

  importCustomSubtitleScript: (fullScript: string) => {
    const comp = get().activeCompositions[0];
    if (!comp || !fullScript || !fullScript.trim()) return;

    const clipStart = comp.clipRange.startSeconds;
    const clipEnd = comp.clipRange.endSeconds;
    const clipDuration = Math.max(1.0, clipEnd - clipStart);

    // Split text into natural sentences or clauses
    const rawSentences = fullScript
      .split(/[.!?\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const rawPhrases: string[] = [];
    rawSentences.forEach((sentence) => {
      const words = sentence.split(/\s+/).filter(Boolean);
      if (words.length <= 7) {
        rawPhrases.push(sentence);
      } else {
        const chunkSize = 5;
        for (let i = 0; i < words.length; i += chunkSize) {
          rawPhrases.push(words.slice(i, i + chunkSize).join(' '));
        }
      }
    });

    if (rawPhrases.length === 0) return;

    const totalPhrases = rawPhrases.length;
    const phraseDuration = clipDuration / totalPhrases;

    const newCues: SubtitleCue[] = rawPhrases.map((phrase, idx) => {
      const cStart = clipStart + idx * phraseDuration;
      const cEnd = idx === totalPhrases - 1 ? clipEnd : cStart + phraseDuration;
      return {
        id: `cue-custom-${Date.now()}-${idx}`,
        startSeconds: Number(cStart.toFixed(2)),
        endSeconds: Number(cEnd.toFixed(2)),
        text: phrase,
      };
    });

    const currentLang = comp.subtitleStyle.language || 'id';
    const enrichedCues = SubtitleTranslationService.enrichBilingualCues(newCues, currentLang);

    // Also update transcript segments in knowledge so titles and analysis match
    const activeProject = get().activeProject;
    const existingKb = get().activeKnowledge;
    const updatedTranscripts = rawPhrases.map((text, idx) => ({
      id: `tr-custom-${idx}`,
      range: {
        startSeconds: Number((clipStart + idx * phraseDuration).toFixed(2)),
        endSeconds: Number((idx === totalPhrases - 1 ? clipEnd : clipStart + (idx + 1) * phraseDuration).toFixed(2)),
      },
      text,
      speaker: 'Kreator',
      words: [],
    }));

    const updatedKb: KnowledgeDatabase = existingKb ? {
      ...existingKb,
      transcripts: updatedTranscripts,
    } : {
      id: `kb-${activeProject?.id || 'prj'}-${Date.now()}`,
      projectId: activeProject?.id || 'prj',
      videoId: activeProject?.sourceVideoId || 'vid',
      analyzedAt: new Date().toISOString(),
      modelIdentifier: 'Custom Dialogue Script Engine',
      transcripts: updatedTranscripts,
      scenes: [],
      hooks: [{
        id: `hk-custom-1`,
        range: { startSeconds: clipStart, endSeconds: Math.min(clipEnd, clipStart + 3.5) },
        content: rawPhrases[0] || 'Hook Utama Video',
        confidence: createConfidenceScore(0.98),
        sourceQuote: rawPhrases[0] || '',
        hookType: 'CURIOSITY',
        retentionPotential: 'EXEMPLARY',
      }],
      problems: [],
      solutions: [],
      benefits: [],
      callsToAction: [{
        id: `cta-custom-1`,
        range: { startSeconds: Math.max(clipStart, clipEnd - 3.0), endSeconds: clipEnd },
        content: rawPhrases[rawPhrases.length - 1] || 'Call to action',
        confidence: createConfidenceScore(0.95),
        sourceQuote: rawPhrases[rawPhrases.length - 1] || '',
        actionType: 'COMMENT',
      }],
      offers: [],
      evidence: [],
      reasons: [],
      emotions: [],
      keywords: [{ keyword: rawPhrases[0]?.split(' ')[0] || 'Konten', occurrences: [1.0], relevanceScore: 1.0 }],
    };

    knowledgeRepo.save(updatedKb);

    // Generate fresh titles matching this exact script
    const activeRec = get().activeRecommendations.find((r) => r.id === comp.recommendationId) || {
      id: comp.recommendationId,
      projectId: comp.projectId,
      title: rawPhrases[0] || 'Highlight Video',
      recommendationType: 'Performance' as const,
      campaignGoal: 'DIRECT_CONVERSION' as const,
      hookStrategy: rawPhrases[0] || '',
      startTime: clipStart,
      endTime: clipEnd,
      duration: clipDuration,
      selectedRange: { startSeconds: clipStart, endSeconds: clipEnd },
      reason: 'Berdasarkan naskah transkrip yang dimasukkan.',
      evidence: 'Sesuai dengan dialog video.',
      confidence: createConfidenceScore(0.98),
      suggestedAspectRatio: comp.aspectRatio,
      createdAt: new Date().toISOString(),
    };

    const newTitles = TitleGenerationService.generateTitles(activeRec, updatedKb, currentLang === 'en' ? 'en' : 'id');
    const primaryTitle = newTitles[0] || rawPhrases[0].toUpperCase();

    const updated: Composition = {
      ...comp,
      subtitles: enrichedCues,
      generatedTitles: newTitles,
      titleOverlay: {
        ...comp.titleOverlay,
        text: primaryTitle,
      },
      updatedAt: new Date().toISOString(),
    };
    compositionRepo.save(updated);

    set({ 
      activeCompositions: [updated],
      activeKnowledge: updatedKb,
      lastAutosaveMessage: 'Naskah video & judul berhasil diperbarui',
    });
  },

  transcribeCurrentVideoAudio: async (customFileOrBlob?: File | Blob) => {
    const activeMedia = get().activeVideoMedia;
    const activeProject = get().activeProject;
    const comp = get().activeCompositions[0];

    const audioSource = customFileOrBlob || get().activeVideoFile || activeMedia?.previewUrl;
    if (!audioSource) {
      const msg = 'Tidak ada video atau sumber audio yang tersedia untuk ditranskrip.';
      set({ lastAutosaveMessage: msg });
      return { success: false, count: 0, message: msg };
    }

    set({ 
      isTranscribingAudio: true, 
      transcriptionProgressMessage: 'Mengekstrak audio dari video...' 
    });

    try {
      const result = await TranscriptionApiService.transcribeVideoAudio(
        audioSource,
        activeProject?.name || activeMedia?.fileName || 'Video Campaign',
        (step) => set({ transcriptionProgressMessage: step })
      );

      if (!result.success || !result.transcripts || result.transcripts.length === 0) {
        const fallbackMsg = result.errorMessage || 'Tidak ada ucapan atau dialog yang terdeteksi dari audio video ini.';
        set({ 
          isTranscribingAudio: false, 
          transcriptionProgressMessage: null,
          lastAutosaveMessage: fallbackMsg 
        });
        return { success: false, count: 0, message: fallbackMsg };
      }

      const allCues = result.transcripts;
      const clipStart = comp ? comp.clipRange.startSeconds : 0;
      const clipEnd = comp ? comp.clipRange.endSeconds : (activeMedia?.durationSeconds || 60);

      // Filter cues that fall within the current clip range if clip is trimmed
      let relevantCues = allCues;
      if (comp && comp.clipRange && (comp.clipRange.startSeconds > 0 || comp.clipRange.endSeconds < (activeMedia?.durationSeconds || 60) - 1)) {
        const overlapping = allCues.filter(c => c.endSeconds > clipStart && c.startSeconds < clipEnd);
        if (overlapping.length > 0) {
          relevantCues = overlapping;
        }
      }

      // Convert all transcripts to TranscriptSegments for KnowledgeDatabase
      const transcriptSegments = allCues.map((c, idx) => ({
        id: `tr-audio-${idx + 1}`,
        range: { startSeconds: c.startSeconds, endSeconds: c.endSeconds },
        text: c.text,
        speaker: 'Pembicara',
        words: [],
      }));

      // Update active knowledge
      const existingKb = get().activeKnowledge;
      const updatedKb: KnowledgeDatabase = existingKb ? {
        ...existingKb,
        transcripts: transcriptSegments,
        analyzedAt: new Date().toISOString(),
      } : {
        id: `kb-${activeProject?.id || 'prj'}-${Date.now()}`,
        projectId: activeProject?.id || 'prj',
        videoId: activeMedia?.id || 'vid',
        analyzedAt: new Date().toISOString(),
        modelIdentifier: 'Google Gemini (Live Audio Transcription)',
        transcripts: transcriptSegments,
        scenes: [],
        hooks: [{
          id: 'hk-1',
          content: relevantCues[0]?.text || 'Hook Pembuka',
          sourceQuote: relevantCues[0]?.text || '',
          hookType: 'CURIOSITY',
          retentionPotential: 'EXEMPLARY',
          range: { startSeconds: clipStart, endSeconds: Math.min(clipEnd, clipStart + 4.0) },
          confidence: createConfidenceScore(0.98),
        }],
        problems: [],
        solutions: [],
        benefits: [],
        callsToAction: [{
          id: 'cta-1',
          content: relevantCues[relevantCues.length - 1]?.text || 'Call to action',
          sourceQuote: relevantCues[relevantCues.length - 1]?.text || '',
          actionType: 'COMMENT',
          range: { startSeconds: Math.max(clipStart, clipEnd - 4.0), endSeconds: clipEnd },
          confidence: createConfidenceScore(0.95),
        }],
        offers: [],
        evidence: [],
        reasons: [],
        emotions: [],
        keywords: [],
      };
      await knowledgeRepo.save(updatedKb);

      // Generate matching titles from real dialogue
      let newTitles = comp ? comp.generatedTitles : [];
      if (comp) {
        const rec = get().activeRecommendations.find(r => r.id === comp.recommendationId) || {
          id: comp.recommendationId,
          projectId: comp.projectId,
          title: relevantCues[0]?.text || 'Video Highlight',
          recommendationType: 'Performance' as const,
          campaignGoal: 'DIRECT_CONVERSION' as const,
          hookStrategy: relevantCues[0]?.text || '',
          startTime: clipStart,
          endTime: clipEnd,
          duration: Math.max(1, clipEnd - clipStart),
          selectedRange: { startSeconds: clipStart, endSeconds: clipEnd },
          reason: 'Berdasarkan ucapan asli video',
          evidence: 'Transkrip audio Gemini',
          confidence: createConfidenceScore(0.98),
          suggestedAspectRatio: comp.aspectRatio,
          createdAt: new Date().toISOString(),
        };
        newTitles = TitleGenerationService.generateTitles(rec, updatedKb, comp.subtitleStyle.language === 'en' ? 'en' : 'id');
      }

      // Update composition with the real subtitles
      if (comp) {
        const updatedComp: Composition = {
          ...comp,
          subtitles: relevantCues,
          generatedTitles: newTitles,
          titleOverlay: {
            ...comp.titleOverlay,
            text: newTitles[0] || relevantCues[0]?.text.toUpperCase() || comp.titleOverlay.text,
          },
          updatedAt: new Date().toISOString(),
        };
        await compositionRepo.save(updatedComp);
        set({
          activeCompositions: [updatedComp],
          activeKnowledge: updatedKb,
          isTranscribingAudio: false,
          transcriptionProgressMessage: null,
          lastAutosaveMessage: `✓ Berhasil mentranskrip ${relevantCues.length} baris dialog langsung dari audio video!`,
        });
      } else {
        set({
          activeKnowledge: updatedKb,
          isTranscribingAudio: false,
          transcriptionProgressMessage: null,
          lastAutosaveMessage: `✓ Berhasil mentranskrip ${allCues.length} baris dialog audio!`,
        });
      }

      get().autosaveNow();
      return {
        success: true,
        count: relevantCues.length,
        message: `✓ Berhasil mentranskrip ${relevantCues.length} baris dialog langsung dari audio!`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan saat proses transkripsi.';
      set({
        isTranscribingAudio: false,
        transcriptionProgressMessage: null,
        lastAutosaveMessage: `❌ Gagal mentranskrip: ${msg}`,
      });
      return { success: false, count: 0, message: msg };
    }
  },

  applySpecificVideoDialogue: () => {
    get().transcribeCurrentVideoAudio();
  },

  updateSubtitleCueTiming: (cueId: string, startSec: number, endSec: number) => {
    const comp = get().activeCompositions[0];
    if (!comp) return;

    const nextCues = comp.subtitles.map((cue) => {
      if (cue.id !== cueId) return cue;
      return {
        ...cue,
        startSeconds: Number(startSec.toFixed(2)),
        endSeconds: Number(endSec.toFixed(2)),
      };
    });

    const updated: Composition = {
      ...comp,
      subtitles: nextCues,
      updatedAt: new Date().toISOString(),
    };
    compositionRepo.save(updated);
    set({ activeCompositions: [updated] });
  },

  generateSmartSubtitlesForClip: (topicInput?: string) => {
    const comp = get().activeCompositions[0];
    if (!comp) return;
    const clipStart = comp.clipRange.startSeconds;
    const clipEnd = comp.clipRange.endSeconds;
    const clipDur = Math.max(1.0, clipEnd - clipStart);
    const active = get().activeProject;
    const activeMedia = get().activeVideoMedia;

    const cleanRaw = activeMedia?.fileName.replace(/\.[^/.]+$/, '').replace(/[_.\-]+/g, ' ') || '';
    const isGeneric = /^(scene|clip|video|output|draft|final|01|rec)[\s_\-\d]*$/i.test(cleanRaw.trim());
    const derivedTopic = !isGeneric && cleanRaw.length > 2
      ? cleanRaw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      : (active?.name || 'Konten Unggulan');

    const topic = topicInput?.trim() || derivedTopic;

    const phrases = [
      `Ini dia rahasia penting seputar ${topic} yang wajib kamu tahu!`,
      'Banyak orang yang belum tahu cara paling praktis dan tepatnya.',
      'Perhatikan tips simpel ini agar hasilnya bisa maksimal.',
      'Trik ini terbukti bikin prosesnya jadi jauh lebih mudah.',
      'Save video ini sekarang dan bagikan ke teman-temanmu ya!'
    ];

    const segDur = clipDur / phrases.length;
    const newCues: SubtitleCue[] = phrases.map((text, idx) => {
      const cStart = Number((clipStart + idx * segDur).toFixed(2));
      const cEnd = Number((idx === phrases.length - 1 ? clipEnd : clipStart + (idx + 1) * segDur).toFixed(2));
      return {
        id: `cue-smart-${Date.now()}-${idx}`,
        startSeconds: cStart,
        endSeconds: cEnd,
        text,
        textId: text,
        textEn: SubtitleTranslationService.translateIdToEn(text),
      };
    });

    const currentLang = comp.subtitleStyle.language || 'id';
    const enriched = SubtitleTranslationService.enrichBilingualCues(newCues, currentLang);
    const updated: Composition = {
      ...comp,
      subtitles: enriched,
      updatedAt: new Date().toISOString(),
    };
    compositionRepo.save(updated);
    set({ activeCompositions: [updated], lastAutosaveMessage: 'Subtitle berhasil dibuat otomatis' });
  },

  updateSubtitleStyle: (styleDelta: Partial<SubtitleStyle>) => {
    const comp = get().activeCompositions[0];
    if (!comp) return;
    const updated: Composition = {
      ...comp,
      subtitleStyle: {
        ...comp.subtitleStyle,
        ...styleDelta,
      },
      updatedAt: new Date().toISOString(),
    };
    compositionRepo.save(updated);
    set({ activeCompositions: [updated] });
  },

  generateMoreTitles: (language?: 'id' | 'en') => {
    const comp = get().activeCompositions[0];
    if (!comp) return;
    const rec = get().activeRecommendations.find((r) => r.id === comp.recommendationId) || get().activeRecommendations[0];
    const kb = get().activeKnowledge;

    // Detect language or use passed language (default to Indonesian)
    const lang = language || (comp.subtitleStyle.language === 'en' ? 'en' : 'id');
    const newSuggestions = rec ? TitleGenerationService.generateTitles(rec, kb || undefined, lang) : [
      lang === 'id' ? 'RAHASIA VIRAL SHORT VIDEO 2026' : 'THE UNTOLD TRUTH ABOUT VIDEO EDITING IN 2026',
      lang === 'id' ? 'JANGAN SALAH PILIH! REVIEW TERBAIK' : 'WHY SMART AGENCIES STOPPED USING TIMELINES',
      lang === 'id' ? 'BANYAK YANG GAK NYANGKA HASILNYA SEBAGUS INI' : 'THE 38-SECOND CAMPAIGN REVOLUTION',
      lang === 'id' ? 'REKOMENDASI WAJIB COBA HARI INI' : 'HOW WE CUT 14 HOURS OF VIDEO FATIGUE',
      lang === 'id' ? 'AUTO PERCAYA DIRI SEHARIAN PENUH!' : 'ONE CLICK SHORT-FORM MASTERY: LOCAL FIRST',
      lang === 'id' ? 'PROMO SPESIAL SEBELUM KEHABISAN!' : 'FROM LONG-FORM TO VIRAL SHORTS IN SECONDS',
    ];

    const updated: Composition = {
      ...comp,
      generatedTitles: newSuggestions,
      titleOverlay: {
        ...comp.titleOverlay,
        text: newSuggestions[0] || comp.titleOverlay.text,
      },
      updatedAt: new Date().toISOString(),
    };
    compositionRepo.save(updated);
    set({ activeCompositions: [updated] });
  },

  selectTitleOverlay: (title: string) => {
    const comp = get().activeCompositions[0];
    if (!comp) return;
    const updated: Composition = {
      ...comp,
      titleOverlay: {
        ...comp.titleOverlay,
        text: title.toUpperCase(),
      },
      updatedAt: new Date().toISOString(),
    };
    compositionRepo.save(updated);
    set({ activeCompositions: [updated] });
  },

  updateTitleOverlay: (overlayDelta: Partial<TitleOverlay>) => {
    const comp = get().activeCompositions[0];
    if (!comp) return;
    const updated: Composition = {
      ...comp,
      titleOverlay: {
        ...comp.titleOverlay,
        ...overlayDelta,
      },
      updatedAt: new Date().toISOString(),
    };
    compositionRepo.save(updated);
    set({ activeCompositions: [updated] });
  },

  updateThumbnailTimestamp: (sec: number) => {
    const comp = get().activeCompositions[0];
    if (!comp) return;
    const updated: Composition = {
      ...comp,
      thumbnailTimestampSec: Number(sec.toFixed(2)),
      updatedAt: new Date().toISOString(),
    };
    compositionRepo.save(updated);
    set({ activeCompositions: [updated] });
  },

  generateViralThumbnails: () => {
    const comp = get().activeCompositions[0];
    if (!comp) return;
    const rec = get().activeRecommendations.find((r) => r.id === comp.recommendationId);
    const candidates = ViralThumbnailService.generateCandidates(comp.clipRange.startSeconds, comp.clipRange.endSeconds, rec);
    const updated: Composition = {
      ...comp,
      viralCandidates: candidates,
      updatedAt: new Date().toISOString(),
    };
    compositionRepo.save(updated);
    set({ activeCompositions: [updated] });
  },

  updateAspectRatio: (aspect: '9:16' | '1:1' | '16:9') => {
    const comp = get().activeCompositions[0];
    if (!comp) return;
    const resolution =
      aspect === '9:16'
        ? { width: 1080, height: 1920 }
        : aspect === '1:1'
        ? { width: 1080, height: 1080 }
        : { width: 1920, height: 1080 };

    const updated: Composition = {
      ...comp,
      aspectRatio: aspect,
      exportResolution: resolution,
      updatedAt: new Date().toISOString(),
    };
    compositionRepo.save(updated);
    set({ activeCompositions: [updated] });
  },

  refreshActiveProjectData: async () => {
    const active = get().activeProject;
    if (!active) return;
    const [knowledge, recommendations, compositions] = await Promise.all([
      knowledgeRepo.getByProjectId(active.id),
      recommendationRepo.getByProjectId(active.id),
      compositionRepo.getByProjectId(active.id),
    ]);
    set({
      activeKnowledge: knowledge,
      activeRecommendations: recommendations,
      activeCompositions: compositions,
    });
  },
}));
