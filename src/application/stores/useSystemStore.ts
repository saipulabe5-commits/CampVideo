import { create } from 'zustand';
import { DesktopBridge, SystemHardwareStats } from '../../infrastructure/bridge/DesktopBridge';

const bridge = DesktopBridge.getInstance();
const SETTINGS_STORAGE_KEY = 'aicampaign_settings_v1';

export type AccentColorType = 'emerald' | 'cyan' | 'amber' | 'neutral';

interface StoredSettings {
  activeProviderId?: string;
  hardwareAccelerationEnabled?: boolean;
  renderingDevice?: 'GPU' | 'CPU';
  outputDirectory?: string;
  threadCount?: number;
  accentColor?: AccentColorType;
  openaiApiKey?: string;
  openaiModel?: string;
  geminiApiKey?: string;
  geminiModel?: string;
  ollamaEndpoint?: string;
  ollamaModel?: string;
}

const loadStoredSettings = (): StoredSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const initialStored = loadStoredSettings();

interface SystemState {
  stats: SystemHardwareStats;
  isOffline: boolean;
  activeView: 'workspace' | 'settings' | 'report';
  activeProviderId: string;
  openaiApiKey: string;
  openaiModel: string;
  geminiApiKey: string;
  geminiModel: string;
  ollamaEndpoint: string;
  ollamaModel: string;
  hardwareAccelerationEnabled: boolean;
  renderingDevice: 'GPU' | 'CPU';
  outputDirectory: string;
  threadCount: number;
  accentColor: AccentColorType;
  theme: 'PURE_BLACK';
  autosaveEnabled: boolean;
  autosaveIntervalSeconds: number;
  
  // Actions
  refreshStats: () => void;
  setActiveView: (view: 'workspace' | 'settings' | 'report') => void;
  setActiveProviderId: (id: string) => void;
  setOpenAIApiKey: (key: string) => void;
  setOpenAIModel: (model: string) => void;
  setGeminiApiKey: (key: string) => void;
  setGeminiModel: (model: string) => void;
  setOllamaEndpoint: (endpoint: string) => void;
  setOllamaModel: (model: string) => void;
  setHardwareAcceleration: (enabled: boolean) => void;
  setRenderingDevice: (device: 'GPU' | 'CPU') => void;
  setOutputDirectory: (dir: string) => void;
  setThreadCount: (count: number) => void;
  setAccentColor: (color: AccentColorType) => void;
  setAutosaveEnabled: (enabled: boolean) => void;
  saveSettings: (delta: {
    outputDirectory?: string;
    threadCount?: number;
    accentColor?: AccentColorType;
    activeProviderId?: string;
    openaiApiKey?: string;
    openaiModel?: string;
    geminiApiKey?: string;
    geminiModel?: string;
    ollamaEndpoint?: string;
    ollamaModel?: string;
    hardwareAccelerationEnabled?: boolean;
  }) => void;
}

export const useSystemStore = create<SystemState>((set, get) => ({
  stats: bridge.getHardwareStats(),
  isOffline: true, // Offline-first guarantee
  activeView: 'workspace',
  activeProviderId: initialStored.activeProviderId || 'provider-gemini',
  openaiApiKey: initialStored.openaiApiKey || '',
  openaiModel: initialStored.openaiModel || 'gpt-4o',
  geminiApiKey: initialStored.geminiApiKey || (import.meta.env?.VITE_GEMINI_API_KEY as string) || '',
  geminiModel: initialStored.geminiModel || 'gemini-2.5-flash',
  ollamaEndpoint: initialStored.ollamaEndpoint || 'http://localhost:11434',
  ollamaModel: initialStored.ollamaModel || 'llama3.3',
  hardwareAccelerationEnabled: initialStored.hardwareAccelerationEnabled !== undefined ? initialStored.hardwareAccelerationEnabled : true,
  renderingDevice: initialStored.renderingDevice || 'GPU',
  outputDirectory: initialStored.outputDirectory || '/Users/campaign/workspace/exports',
  threadCount: initialStored.threadCount || 8,
  accentColor: initialStored.accentColor || 'emerald',
  theme: 'PURE_BLACK',
  autosaveEnabled: true,
  autosaveIntervalSeconds: 30,

  refreshStats: () => {
    set({ stats: bridge.getHardwareStats() });
  },

  setActiveView: (view) => set({ activeView: view }),
  setActiveProviderId: (id) => {
    set({ activeProviderId: id });
    get().saveSettings({ activeProviderId: id });
  },
  setOpenAIApiKey: (key) => {
    set({ openaiApiKey: key });
    get().saveSettings({ openaiApiKey: key });
  },
  setOpenAIModel: (model) => {
    set({ openaiModel: model });
    get().saveSettings({ openaiModel: model });
  },
  setGeminiApiKey: (key) => {
    set({ geminiApiKey: key });
    get().saveSettings({ geminiApiKey: key });
  },
  setGeminiModel: (model) => {
    set({ geminiModel: model });
    get().saveSettings({ geminiModel: model });
  },
  setOllamaEndpoint: (endpoint) => {
    set({ ollamaEndpoint: endpoint });
    get().saveSettings({ ollamaEndpoint: endpoint });
  },
  setOllamaModel: (model) => {
    set({ ollamaModel: model });
    get().saveSettings({ ollamaModel: model });
  },
  setHardwareAcceleration: (enabled) => {
    set({ hardwareAccelerationEnabled: enabled, renderingDevice: enabled ? 'GPU' : 'CPU' });
    get().saveSettings({ hardwareAccelerationEnabled: enabled });
  },
  setRenderingDevice: (device) => set({ renderingDevice: device }),
  setOutputDirectory: (dir) => set({ outputDirectory: dir }),
  setThreadCount: (count) => set({ threadCount: count }),
  setAccentColor: (color) => set({ accentColor: color }),
  setAutosaveEnabled: (enabled) => set({ autosaveEnabled: enabled }),

  saveSettings: (delta) => {
    const current = get();
    const updated = {
      activeProviderId: delta.activeProviderId ?? current.activeProviderId,
      openaiApiKey: delta.openaiApiKey ?? current.openaiApiKey,
      openaiModel: delta.openaiModel ?? current.openaiModel,
      geminiApiKey: delta.geminiApiKey ?? current.geminiApiKey,
      geminiModel: delta.geminiModel ?? current.geminiModel,
      ollamaEndpoint: delta.ollamaEndpoint ?? current.ollamaEndpoint,
      ollamaModel: delta.ollamaModel ?? current.ollamaModel,
      hardwareAccelerationEnabled: delta.hardwareAccelerationEnabled ?? current.hardwareAccelerationEnabled,
      renderingDevice: ((delta.hardwareAccelerationEnabled ?? current.hardwareAccelerationEnabled) ? 'GPU' : 'CPU') as 'GPU' | 'CPU',
      outputDirectory: delta.outputDirectory ?? current.outputDirectory,
      threadCount: delta.threadCount ?? current.threadCount,
      accentColor: delta.accentColor ?? current.accentColor,
    };

    set(updated);

    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  },
}));
