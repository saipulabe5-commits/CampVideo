import React, { useState } from 'react';
import { useSystemStore } from '../../../../application/stores/useSystemStore';
import { useProjectStore } from '../../../../application/stores/useProjectStore';
import { ProviderRegistry } from '../../../../providers/registry/ProviderRegistry';
import { OpenAIService } from '../../../../providers/openai/OpenAIService';
import { GeminiService } from '../../../../providers/gemini/GeminiService';
import { OllamaService } from '../../../../providers/ollama/OllamaService';
import { 
  Settings, 
  Cpu, 
  Database, 
  ShieldCheck, 
  Check, 
  Server, 
  Sliders,
  HardDrive,
  Folder,
  Palette,
  CheckCircle2,
  RefreshCw,
  FolderOpen,
  KeyRound,
  Bot,
  Sparkles,
  Eye,
  EyeOff,
  AlertCircle,
  Network
} from 'lucide-react';
import { cn } from '../../../primitives/classNames';

export const SettingsView: React.FC = () => {
  const { 
    stats, 
    activeProviderId, 
    setActiveProviderId, 
    openaiApiKey: storedOpenAIKey,
    openaiModel: storedOpenAIModel,
    geminiApiKey: storedGeminiKey,
    geminiModel: storedGeminiModel,
    ollamaEndpoint: storedOllamaEndpoint,
    ollamaModel: storedOllamaModel,
    setOpenAIApiKey,
    setOpenAIModel,
    setGeminiApiKey,
    setGeminiModel,
    setOllamaEndpoint,
    setOllamaModel,
    hardwareAccelerationEnabled, 
    setHardwareAcceleration,
    outputDirectory,
    threadCount: initialThreads,
    accentColor: initialAccent,
    saveSettings,
    setActiveView
  } = useSystemStore();

  const { activeProject } = useProjectStore();

  const [outputFolder, setOutputFolder] = useState(outputDirectory);
  const [threadCount, setThreadCountState] = useState<number>(initialThreads);
  const [accentColor, setAccentColorState] = useState<'emerald' | 'cyan' | 'amber' | 'neutral'>(initialAccent);
  
  // OpenAI state
  const [openAIKeyInput, setOpenAIKeyInput] = useState(storedOpenAIKey || '');
  const [openAIModelSelected, setOpenAIModelSelected] = useState(storedOpenAIModel || 'gpt-4o');
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [isTestingOpenAI, setIsTestingOpenAI] = useState(false);
  const [openAITestResult, setOpenAITestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Gemini state
  const [geminiKeyInput, setGeminiKeyInput] = useState(storedGeminiKey || '');
  const [geminiModelSelected, setGeminiModelSelected] = useState(storedGeminiModel || 'gemini-2.5-flash');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Ollama state
  const [ollamaEndpointInput, setOllamaEndpointInput] = useState(storedOllamaEndpoint || 'http://localhost:11434');
  const [ollamaModelSelected, setOllamaModelSelected] = useState(storedOllamaModel || 'llama3.3');
  const [isTestingOllama, setIsTestingOllama] = useState(false);
  const [ollamaTestResult, setOllamaTestResult] = useState<{ success: boolean; message: string; models?: string[] } | null>(null);

  const [notice, setNotice] = useState<string | null>(null);

  const aiProviders = ProviderRegistry.getAIProviders();
  const transcriptionProviders = ProviderRegistry.getTranscriptionProviders();

  const handleTestOpenAI = async () => {
    setIsTestingOpenAI(true);
    setOpenAITestResult(null);
    try {
      const res = await OpenAIService.testKey(openAIKeyInput);
      setOpenAITestResult(res);
      if (res.success) {
        setOpenAIApiKey(openAIKeyInput.trim());
        setOpenAIModel(openAIModelSelected);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Koneksi gagal';
      setOpenAITestResult({ success: false, message: msg });
    } finally {
      setIsTestingOpenAI(false);
    }
  };

  const handleTestGemini = async () => {
    setIsTestingGemini(true);
    setGeminiTestResult(null);
    try {
      const res = await GeminiService.testKey(geminiKeyInput);
      setGeminiTestResult(res);
      if (res.success) {
        setGeminiApiKey(geminiKeyInput.trim());
        setGeminiModel(geminiModelSelected);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Koneksi gagal';
      setGeminiTestResult({ success: false, message: msg });
    } finally {
      setIsTestingGemini(false);
    }
  };

  const handleTestOllama = async () => {
    setIsTestingOllama(true);
    setOllamaTestResult(null);
    try {
      const res = await OllamaService.testConnection(ollamaEndpointInput);
      setOllamaTestResult(res);
      if (res.success) {
        setOllamaEndpoint(ollamaEndpointInput.trim());
        setOllamaModel(ollamaModelSelected);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Koneksi gagal';
      setOllamaTestResult({ success: false, message: msg });
    } finally {
      setIsTestingOllama(false);
    }
  };

  const handleSaveSettings = () => {
    saveSettings({
      outputDirectory: outputFolder.trim() || outputDirectory,
      threadCount,
      accentColor,
      openaiApiKey: openAIKeyInput.trim(),
      openaiModel: openAIModelSelected,
      geminiApiKey: geminiKeyInput.trim(),
      geminiModel: geminiModelSelected,
      ollamaEndpoint: ollamaEndpointInput.trim(),
      ollamaModel: ollamaModelSelected,
      activeProviderId,
    });
    setNotice(`Settings tersimpan (${activeProviderId} · ${threadCount} threads)`);
    setTimeout(() => setNotice(null), 3500);
  };

  return (
    <div className="space-y-6 max-w-4xl pb-8">
      {/* Header */}
      <div className="p-5 bg-neutral-950 border border-neutral-800/90 rounded-xl space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
          <Settings className="w-3.5 h-3.5" />
          <span>FEATURE 12 // PLATFORM SETTINGS & ENGINE CONFIGURATION</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Settings & Hardware Preferences
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Configure AI Provider, GPU/CPU Rendering, Pure Black Dark Theme, and Default Output Folder.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('workspace')}
              className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white rounded-lg text-xs font-mono transition-colors"
            >
              Back to Workspace
            </button>
            <button
              onClick={handleSaveSettings}
              className="px-4 py-1.5 bg-white hover:bg-neutral-200 text-black font-semibold rounded-lg text-xs transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>

        {notice && (
          <div className="p-2 bg-emerald-950/40 border border-emerald-800/60 rounded flex items-center gap-2 text-xs font-mono text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{notice}</span>
          </div>
        )}
      </div>

      {/* 1. AI PROVIDER CONFIGURATION */}
      <div className="p-5 bg-neutral-950 border border-neutral-800/90 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase font-mono flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-neutral-400" />
            <span>1. AI Provider Plugins</span>
          </h3>
          <span className="text-[10px] font-mono text-neutral-500">[{aiProviders.length} registered]</span>
        </div>

        <p className="text-xs text-neutral-400">
          Select your primary knowledge extraction engine. The core application logic remains strictly independent of all external providers via Clean Architecture ports.
        </p>

        <div className="space-y-2">
          {aiProviders.map((provider) => {
            const isSelected = activeProviderId === provider.id;
            const caps = provider.getCapabilities();

            return (
              <div
                key={provider.id}
                onClick={() => setActiveProviderId(provider.id)}
                className={cn(
                  'p-4 bg-neutral-900/60 border rounded-xl flex items-center justify-between gap-4 cursor-pointer transition-all',
                  isSelected
                    ? 'border-neutral-400 ring-1 ring-neutral-400 bg-neutral-900'
                    : 'border-neutral-800/80 hover:border-neutral-700'
                )}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{provider.name}</span>
                    {provider.id === 'provider-openai' && (
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> LIVE READY
                      </span>
                    )}
                    {provider.isLocal ? (
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                        100% OFFLINE LOCAL
                      </span>
                    ) : (
                      provider.id !== 'provider-openai' && (
                        <span className="text-[10px] font-mono text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded">
                          SECURE PROXY API
                        </span>
                      )
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-neutral-500">
                    Max Context: {caps.maxContextTokens.toLocaleString()} tokens · Local Execution: {caps.supportsLocalExecution ? 'Yes' : 'No'}
                  </div>
                </div>

                <div className="w-5 h-5 rounded-full border border-neutral-700 flex items-center justify-center">
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* OPENAI LIVE API KEY & MODEL CONFIGURATION */}
        {activeProviderId === 'provider-openai' && (
          <div className="p-4 bg-neutral-900/80 border border-emerald-500/30 rounded-xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-white uppercase font-mono">OpenAI Live Integration</h4>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-800/80 px-2 py-0.5 rounded">
                Active Provider
              </span>
            </div>

            <p className="text-[11px] text-neutral-300 leading-relaxed">
              Masukkan OpenAI API Key Anda untuk menghubungkan AI Agent <span className="text-emerald-400 font-mono">gpt-4o</span> secara langsung. Video dan transkrip Anda akan dianalisis secara real-time oleh model resmi OpenAI.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Model Choice */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-neutral-400">OpenAI Model Target:</label>
                <select
                  value={openAIModelSelected}
                  onChange={(e) => setOpenAIModelSelected(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500"
                >
                  <option value="gpt-4o">gpt-4o (Flagship Multimodal - Paling Cerdas)</option>
                  <option value="gpt-4o-mini">gpt-4o-mini (Cepat &amp; Hemat Biaya)</option>
                  <option value="gpt-4-turbo">gpt-4-turbo (High Context Precision)</option>
                  <option value="gpt-3.5-turbo">gpt-3.5-turbo (Legacy Fast)</option>
                </select>
              </div>

              {/* API Key Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-neutral-400 flex items-center justify-between">
                  <span>OpenAI API Key:</span>
                  <span className="text-neutral-500 text-[10px]">(sk-proj-...)</span>
                </label>
                <div className="relative">
                  <input
                    type={showOpenAIKey ? 'text' : 'password'}
                    value={openAIKeyInput}
                    onChange={(e) => setOpenAIKeyInput(e.target.value)}
                    placeholder="sk-proj-..."
                    className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg px-3 py-2 text-xs font-mono pr-16 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1 text-[11px]"
                  >
                    {showOpenAIKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-800">
              <div className="text-[11px] font-mono text-neutral-400 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-neutral-500" />
                <span>Kunci disimpan lokal di browser (Local Storage) &amp; aman.</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestOpenAI}
                  disabled={isTestingOpenAI || !openAIKeyInput.trim()}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={cn('w-3 h-3', isTestingOpenAI && 'animate-spin')} />
                  <span>{isTestingOpenAI ? 'Menguji Key...' : 'Test Koneksi OpenAI'}</span>
                </button>
              </div>
            </div>

            {openAITestResult && (
              <div className={cn(
                'p-2.5 rounded-lg border text-xs font-mono flex items-center gap-2',
                openAITestResult.success
                  ? 'bg-emerald-950/60 border-emerald-700/80 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-800/80 text-rose-300'
              )}>
                {openAITestResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{openAITestResult.message}</span>
              </div>
            )}
          </div>
        )}

        {/* GOOGLE GEMINI LIVE API & MODEL CONFIGURATION */}
        {activeProviderId === 'provider-gemini' && (
          <div className="p-4 bg-neutral-900/80 border border-emerald-500/30 rounded-xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-white uppercase font-mono">Google Gemini Live Integration</h4>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-800/80 px-2 py-0.5 rounded">
                Active Provider
              </span>
            </div>

            <p className="text-[11px] text-neutral-300 leading-relaxed">
              Ditenagai langsung oleh official SDK <code className="text-emerald-400 font-mono">@google/genai</code> dengan model multimodal mutakhir untuk pemahaman video visual dan audio transkrip secara serentak.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Model Choice */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-neutral-400">Gemini Model Target:</label>
                <select
                  value={geminiModelSelected}
                  onChange={(e) => setGeminiModelSelected(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500"
                >
                  <option value="gemini-2.5-flash">gemini-2.5-flash (Direkomendasikan - Multimodal &amp; Cepat)</option>
                  <option value="gemini-2.5-pro">gemini-2.5-pro (Penalaran Kompleks)</option>
                  <option value="gemini-3.8-flash">gemini-3.8-flash (Model Terbaru Flash)</option>
                </select>
              </div>

              {/* Gemini API Key Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-neutral-400 flex items-center justify-between">
                  <span>Google Gemini API Key:</span>
                  <span className="text-neutral-500 text-[10px]">(AIzaSy...)</span>
                </label>
                <div className="relative">
                  <input
                    type={showGeminiKey ? 'text' : 'password'}
                    value={geminiKeyInput}
                    onChange={(e) => setGeminiKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg px-3 py-2 text-xs font-mono pr-16 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1 text-[11px]"
                  >
                    {showGeminiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-800">
              <div className="text-[11px] font-mono text-neutral-400 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-neutral-500" />
                <span>Kunci Gemini tersimpan lokal di browser &amp; aman.</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestGemini}
                  disabled={isTestingGemini || !geminiKeyInput.trim()}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={cn('w-3 h-3', isTestingGemini && 'animate-spin')} />
                  <span>{isTestingGemini ? 'Menguji Key...' : 'Test Koneksi Gemini'}</span>
                </button>
              </div>
            </div>

            {geminiTestResult && (
              <div className={cn(
                'p-2.5 rounded-lg border text-xs font-mono flex items-center gap-2',
                geminiTestResult.success
                  ? 'bg-emerald-950/60 border-emerald-700/80 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-800/80 text-rose-300'
              )}>
                {geminiTestResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{geminiTestResult.message}</span>
              </div>
            )}
          </div>
        )}

        {/* OLLAMA LOCAL OFFLINE LLM CONFIGURATION */}
        {activeProviderId === 'provider-ollama' && (
          <div className="p-4 bg-neutral-900/80 border border-emerald-500/30 rounded-xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-white uppercase font-mono">Ollama Local Engine (100% Offline)</h4>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-800/80 px-2 py-0.5 rounded">
                Active Provider
              </span>
            </div>

            <p className="text-[11px] text-neutral-300 leading-relaxed">
              Jalankan AI Agent sepenuhnya secara lokal di komputer/laptop Anda tanpa biaya token API (<span className="text-emerald-400 font-mono">0 cloud egress &amp; 100% offline</span>). Membutuhkan aplikasi Ollama berjalan di komputer Anda.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Ollama Endpoint */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-neutral-400">Ollama Local Endpoint:</label>
                <input
                  type="text"
                  value={ollamaEndpointInput}
                  onChange={(e) => setOllamaEndpointInput(e.target.value)}
                  placeholder="http://localhost:11434"
                  className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Model Choice / Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-neutral-400">Model Name (Lokal):</label>
                <select
                  value={ollamaModelSelected}
                  onChange={(e) => setOllamaModelSelected(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500"
                >
                  <option value="llama3.3">llama3.3 (Meta Llama 3.3 70B / 8B)</option>
                  <option value="llama3.1">llama3.1 (Llama 3.1 8B Quick)</option>
                  <option value="qwen2.5">qwen2.5 (Alibaba Qwen 2.5)</option>
                  <option value="deepseek-r1:7b">deepseek-r1:7b (DeepSeek Reasoning)</option>
                  <option value="mistral">mistral (Mistral 7B Instruct)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-800">
              <div className="text-[11px] font-mono text-neutral-400 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-neutral-500" />
                <span>Format JSON terstruktur diekstrak langsung dari GPU/CPU lokal.</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestOllama}
                  disabled={isTestingOllama}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={cn('w-3 h-3', isTestingOllama && 'animate-spin')} />
                  <span>{isTestingOllama ? 'Memeriksa Ollama...' : 'Test Koneksi Ollama Local'}</span>
                </button>
              </div>
            </div>

            {ollamaTestResult && (
              <div className={cn(
                'p-2.5 rounded-lg border text-xs font-mono flex items-center gap-2',
                ollamaTestResult.success
                  ? 'bg-emerald-950/60 border-emerald-700/80 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-800/80 text-rose-300'
              )}>
                {ollamaTestResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{ollamaTestResult.message}</span>
              </div>
            )}
          </div>
        )}

        {/* Audio Speech Engine (Whisper) */}
        <div className="pt-2 border-t border-neutral-900">
          <div className="flex items-center justify-between text-xs font-mono text-neutral-400 mb-2">
            <span>Audio Transcription Engine:</span>
            <span className="text-emerald-400">Faster Whisper (Local CTranslate2)</span>
          </div>
          <div className="p-3 bg-neutral-900/40 border border-neutral-800/80 rounded-lg text-[11px] text-neutral-400 font-mono">
            Model: whisper-large-v3-turbo (Int8 quantized) · Latency: 1.4s per minute of speech · 0 cloud egress
          </div>
        </div>
      </div>

      {/* 2. GPU / CPU RENDERING CONFIGURATION */}
      <div className="p-5 bg-neutral-950 border border-neutral-800/90 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase font-mono flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-neutral-400" />
            <span>2. GPU / CPU Rendering Engine</span>
          </h3>
          <span className="text-[10px] font-mono text-emerald-400">FFmpeg 7.0.1</span>
        </div>

        <p className="text-xs text-neutral-400">
          Hardware acceleration offloads frame transforms and video encoding to your local GPU (Metal VideoToolbox on macOS, NVENC on NVIDIA, or VA-API on Linux).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Hardware Acceleration Toggle */}
          <div
            onClick={() => setHardwareAcceleration(!hardwareAccelerationEnabled)}
            className={cn(
              'p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between',
              hardwareAccelerationEnabled
                ? 'bg-neutral-900 border-neutral-600'
                : 'bg-neutral-900/40 border-neutral-800 text-neutral-400'
            )}
          >
            <div>
              <div className="text-xs font-bold text-white">GPU Hardware Acceleration</div>
              <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                {hardwareAccelerationEnabled ? 'Active (h264_videotoolbox / NVENC)' : 'Disabled (Software libx264)'}
              </div>
            </div>
            <div className={cn(
              'w-8 h-4 rounded-full transition-colors relative',
              hardwareAccelerationEnabled ? 'bg-emerald-500' : 'bg-neutral-700'
            )}>
              <div className={cn(
                'w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform',
                hardwareAccelerationEnabled ? 'right-0.5' : 'left-0.5'
              )} />
            </div>
          </div>

          {/* CPU Multi-Thread Limit */}
          <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white font-bold">CPU Thread Allocation</span>
              <span className="font-mono text-emerald-400">{threadCount} Threads</span>
            </div>
            <input
              type="range"
              min="2"
              max="32"
              step="2"
              value={threadCount}
              onChange={(e) => setThreadCountState(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-neutral-500">
              <span>2 threads</span>
              <span>16 threads</span>
              <span>32 threads (HX Max)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. THEME CONFIGURATION */}
      <div className="p-5 bg-neutral-950 border border-neutral-800/90 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase font-mono flex items-center gap-2">
            <Palette className="w-3.5 h-3.5 text-neutral-400" />
            <span>3. Appearance & Theme</span>
          </h3>
          <span className="text-[10px] font-mono text-neutral-400">Pure Black (#000000)</span>
        </div>

        <p className="text-xs text-neutral-400">
          The platform is architected exclusively in Dark Mode with a pure black (#000000) background for industrial minimalism and video color accuracy.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-black border border-neutral-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Pure Black Canvas</span>
              <span className="text-[10px] font-mono text-emerald-400">LOCKED MANDATE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-black border border-neutral-700 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
              <span className="text-xs font-mono text-neutral-300">#000000 Dark Theme</span>
            </div>
            <p className="text-[11px] text-neutral-500">
              Prevents eye fatigue during long video review and eliminates color distortion.
            </p>
          </div>

          <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-2">
            <div className="text-xs font-bold text-white">Accent Indicator Style</div>
            <div className="flex items-center gap-2 pt-1">
              {[
                { id: 'emerald', color: 'bg-emerald-400', label: 'Emerald' },
                { id: 'cyan', color: 'bg-cyan-400', label: 'Cyan' },
                { id: 'amber', color: 'bg-amber-400', label: 'Amber' },
                { id: 'neutral', color: 'bg-neutral-200', label: 'Monochrome' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    const chosen = item.id as any;
                    setAccentColorState(chosen);
                    saveSettings({ accentColor: chosen });
                  }}
                  className={cn(
                    'flex-1 py-1.5 px-2 rounded-lg border text-[11px] font-mono flex items-center justify-center gap-1.5 transition-all',
                    accentColor === item.id
                      ? 'border-white bg-neutral-800 text-white'
                      : 'border-neutral-800 text-neutral-400 hover:text-white'
                  )}
                >
                  <span className={cn('w-2 h-2 rounded-full', item.color)} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. OUTPUT FOLDER CONFIGURATION */}
      <div className="p-5 bg-neutral-950 border border-neutral-800/90 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase font-mono flex items-center gap-2">
            <FolderOpen className="w-3.5 h-3.5 text-neutral-400" />
            <span>4. Output Folder Directory</span>
          </h3>
          <span className="text-[10px] font-mono text-emerald-400">Local Disk Storage</span>
        </div>

        <p className="text-xs text-neutral-400">
          Default filesystem directory where rendered MP4 videos, subtitles (.srt), thumbnail images (.png), and JSON analysis reports will be packaged.
        </p>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={outputFolder}
                onChange={(e) => setOutputFolder(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded-lg py-2.5 px-3 text-xs font-mono text-white focus:outline-none focus:border-neutral-600"
              />
            </div>
            <button
              onClick={() => {
                setOutputFolder(activeProject?.paths.exportsDir || '/Users/campaign/workspace/exports');
              }}
              className="px-3.5 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white rounded-lg text-xs font-mono transition-colors"
            >
              Use Project Default
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px]">
            <div className="p-2.5 bg-neutral-900/60 border border-neutral-800/80 rounded">
              <span className="text-neutral-500 block text-[10px]">AVAILABLE VOLUME SPACE</span>
              <span className="text-white font-bold">418.2 GB Free</span>
            </div>
            <div className="p-2.5 bg-neutral-900/60 border border-neutral-800/80 rounded">
              <span className="text-neutral-500 block text-[10px]">FILESYSTEM FORMAT</span>
              <span className="text-white font-bold">APFS / Ext4 / NTFS</span>
            </div>
            <div className="p-2.5 bg-neutral-900/60 border border-neutral-800/80 rounded">
              <span className="text-neutral-500 block text-[10px]">WRITE PERMISSIONS</span>
              <span className="text-emerald-400 font-bold">Read / Write Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
