import React, { useState } from 'react';
import { useProjectStore } from '../../../../application/stores/useProjectStore';
import { useSystemStore } from '../../../../application/stores/useSystemStore';
import { OpenAIService } from '../../../../providers/openai/OpenAIService';
import { GeminiService } from '../../../../providers/gemini/GeminiService';
import { OllamaService } from '../../../../providers/ollama/OllamaService';
import { PipelineStage } from '../../../../domain/enums/PipelineStage';
import { formatTimestamp } from '../../../../domain/value-objects/TimestampRange';
import { 
  BrainCircuit, 
  FileText, 
  Sparkles, 
  Flame, 
  Heart, 
  Tag, 
  CheckCircle2, 
  ArrowRight, 
  Play, 
  RotateCw, 
  Layers, 
  Activity, 
  Database,
  Film,
  Bot,
  Send,
  Loader2,
  KeyRound,
  Wand2,
  Network
} from 'lucide-react';
import { cn } from '../../../primitives/classNames';

type AnalysisTab = 'all' | 'transcript' | 'hooks' | 'problems' | 'solutions' | 'benefits' | 'emotions' | 'scenes';

export const AnalyzeStageView: React.FC = () => {
  const { 
    activeProject, 
    activeKnowledge, 
    isAnalyzing, 
    analysisProgress, 
    runVideoAnalysis, 
    selectStage 
  } = useProjectStore();

  const { 
    activeProviderId, 
    openaiApiKey, 
    openaiModel, 
    geminiApiKey, 
    geminiModel, 
    ollamaEndpoint, 
    ollamaModel, 
    setActiveView 
  } = useSystemStore();

  const [activeTab, setActiveTab] = useState<AnalysisTab>('all');
  const [transcriptSearch, setTranscriptSearch] = useState('');
  
  // AI Agent Copilot State
  const [copilotPrompt, setCopilotPrompt] = useState('');
  const [copilotResponse, setCopilotResponse] = useState<string | null>(null);
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);

  const activeProviderName = 
    activeProviderId === 'provider-gemini' ? `Google Gemini (${geminiModel || 'gemini-2.5-flash'})` :
    activeProviderId === 'provider-ollama' ? `Ollama Local (${ollamaModel || 'llama3.3'})` :
    `OpenAI (${openaiModel || 'gpt-4o'})`;

  const handleAskCopilot = async (customPrompt?: string) => {
    const promptToUse = customPrompt || copilotPrompt;
    if (!promptToUse.trim()) return;

    const context = `Campaign: ${activeProject?.name || 'TikTok Campaign'}, Brand: ${activeProject?.trybuzzer?.brandName || 'Brand'}, Goal: ${activeProject?.trybuzzer?.objectiveFocus || 'TikTok Bounty'}. Key Hook: ${activeKnowledge?.hooks?.[0]?.content || 'No hook'}`;

    setIsCopilotLoading(true);
    setCopilotResponse(null);

    try {
      if (activeProviderId === 'provider-gemini') {
        if (!geminiApiKey || !geminiApiKey.trim()) {
          setCopilotResponse('⚠️ Google Gemini API Key belum diisi. Silakan buka menu Settings untuk memasukkan API Key Gemini Anda.');
          return;
        }
        const reply = await GeminiService.generateAgentScriptPrompt(
          geminiApiKey,
          geminiModel || 'gemini-2.5-flash',
          promptToUse,
          context
        );
        setCopilotResponse(reply);
      } else if (activeProviderId === 'provider-ollama') {
        const reply = await OllamaService.generateAgentScriptPrompt(
          ollamaEndpoint || 'http://localhost:11434',
          ollamaModel || 'llama3.3',
          promptToUse,
          context
        );
        setCopilotResponse(reply);
      } else {
        if (!openaiApiKey || !openaiApiKey.trim()) {
          setCopilotResponse('⚠️ OpenAI API Key belum diisi. Silakan buka menu Settings untuk memasukkan API Key OpenAI Anda.');
          return;
        }
        const reply = await OpenAIService.generateAgentScriptPrompt(
          openaiApiKey,
          openaiModel || 'gpt-4o',
          promptToUse,
          context
        );
        setCopilotResponse(reply);
      }

      if (!customPrompt) setCopilotPrompt('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghubungi AI Agent';
      setCopilotResponse(`❌ Error AI Agent: ${msg}`);
    } finally {
      setIsCopilotLoading(false);
    }
  };

  if (!activeKnowledge) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-neutral-950 border border-neutral-800 rounded-2xl text-center space-y-4">
        <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-full">
          {activeProviderId === 'provider-gemini' ? (
            <Sparkles className="w-10 h-10 text-emerald-400" />
          ) : activeProviderId === 'provider-ollama' ? (
            <Network className="w-10 h-10 text-emerald-400" />
          ) : (
            <Bot className="w-10 h-10 text-emerald-400" />
          )}
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-neutral-900 border border-neutral-800 px-3 py-1 rounded-full">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Active Engine: {activeProviderName}</span>
        </div>
        <h2 className="text-base font-bold text-white font-sans">Video Siap Dianalisis dengan AI</h2>
        <p className="text-xs text-neutral-400 max-w-md leading-relaxed">
          Mulai ekstraksi semantik 12-dimensi (Hook ≤7s, Pain Point, Solusi, CTA, Emosi) secara real-time dengan model {activeProviderName}.
        </p>
        <button
          onClick={runVideoAnalysis}
          disabled={isAnalyzing}
          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs flex items-center gap-2 transition-colors shadow-lg shadow-emerald-950"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Menganalisis Video...</span>
            </>
          ) : (
            <>
              <BrainCircuit className="w-4 h-4" />
              <span>Jalankan AI Video Analysis ({activeProviderName})</span>
            </>
          )}
        </button>
      </div>
    );
  }

  const {
    transcripts,
    scenes,
    hooks,
    problems,
    solutions,
    benefits,
    offers,
    callsToAction,
    evidence,
    emotions,
    keywords,
  } = activeKnowledge;

  const filteredTranscripts = transcripts.filter((t) =>
    t.text.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
    (t.speaker && t.speaker.toLowerCase().includes(transcriptSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Stage Header */}
      <div className="p-5 bg-neutral-950 border border-neutral-800/90 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
          <BrainCircuit className="w-3.5 h-3.5" />
          <span>STAGE 03_ANZ // 12-FACTOR LOCAL KNOWLEDGE EXTRACTION</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              AI Video Knowledge Matrix ({activeKnowledge.videoId})
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Extracted via {activeKnowledge.modelIdentifier} · Stored permanently in local <code className="text-neutral-300 font-mono">project.db</code>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runVideoAnalysis}
              disabled={isAnalyzing}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors"
            >
              <RotateCw className={cn('w-3.5 h-3.5 text-neutral-400', isAnalyzing && 'animate-spin')} />
              <span>Re-Analyze</span>
            </button>

            <button
              onClick={() => selectStage(PipelineStage.RECOMMEND)}
              className="px-4 py-2 bg-white hover:bg-neutral-200 text-black font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
            >
              <span>View 3 AI Recommendations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress Bar if Analyzing */}
        {isAnalyzing && (
          <div className="pt-2 space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-400">{analysisProgress.step}</span>
              <span className="text-white font-bold">{analysisProgress.percent}%</span>
            </div>
            <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${analysisProgress.percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Overview Metric Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 pt-2 border-t border-neutral-900 text-xs font-mono">
          <div className="p-2 bg-neutral-900/60 rounded border border-neutral-800">
            <div className="text-neutral-500 text-[10px]">TRANSCRIPT</div>
            <div className="text-white font-bold">{transcripts.length} Segments</div>
          </div>
          <div className="p-2 bg-neutral-900/60 rounded border border-neutral-800">
            <div className="text-neutral-500 text-[10px]">HOOKS DETECTED</div>
            <div className="text-emerald-400 font-bold">{hooks.length} High-Retention</div>
          </div>
          <div className="p-2 bg-neutral-900/60 rounded border border-neutral-800">
            <div className="text-neutral-500 text-[10px]">PROBLEMS IDENTIFIED</div>
            <div className="text-amber-400 font-bold">{problems.length} Critical Pains</div>
          </div>
          <div className="p-2 bg-neutral-900/60 rounded border border-neutral-800">
            <div className="text-neutral-500 text-[10px]">SOLUTIONS / BENEFITS</div>
            <div className="text-white font-bold">{solutions.length + benefits.length} Formulated</div>
          </div>
          <div className="p-2 bg-neutral-900/60 rounded border border-neutral-800">
            <div className="text-neutral-500 text-[10px]">OFFERS & CTAS</div>
            <div className="text-white font-bold">{offers.length + callsToAction.length} Action Points</div>
          </div>
          <div className="p-2 bg-neutral-900/60 rounded border border-neutral-800">
            <div className="text-neutral-500 text-[10px]">SCENE CHANGES</div>
            <div className="text-neutral-300 font-bold">{scenes.length} Visual Cuts</div>
          </div>
        </div>
      </div>

      {/* AI AGENT LIVE COPILOT */}
      <div className="p-4 bg-gradient-to-r from-neutral-950 via-neutral-900/90 to-neutral-950 border border-emerald-500/30 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              {activeProviderId === 'provider-gemini' ? (
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              ) : activeProviderId === 'provider-ollama' ? (
                <Network className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Bot className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </div>
            <div>
              <span className="text-xs font-bold text-white font-mono">
                {activeProviderId === 'provider-gemini' ? 'Gemini AI Agent Copilot' :
                 activeProviderId === 'provider-ollama' ? 'Ollama Local AI Copilot' :
                 'OpenAI Agent Copilot'}
              </span>
              <span className="ml-2 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.5 rounded">
                Model: {activeProviderId === 'provider-gemini' ? (geminiModel || 'gemini-2.5-flash') :
                        activeProviderId === 'provider-ollama' ? (ollamaModel || 'llama3.3') :
                        (openaiModel || 'gpt-4o')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {activeProviderId === 'provider-gemini' && !geminiApiKey ? (
              <button
                onClick={() => setActiveView('settings')}
                className="text-[11px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-950/40 border border-amber-800/60 px-2 py-1 rounded"
              >
                <KeyRound className="w-3 h-3" />
                <span>Input Gemini API Key di Settings</span>
              </button>
            ) : activeProviderId === 'provider-openai' && !openaiApiKey ? (
              <button
                onClick={() => setActiveView('settings')}
                className="text-[11px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-950/40 border border-amber-800/60 px-2 py-1 rounded"
              >
                <KeyRound className="w-3 h-3" />
                <span>Input OpenAI API Key di Settings</span>
              </button>
            ) : activeProviderId === 'provider-ollama' ? (
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <Network className="w-3 h-3" /> Local Engine ({ollamaEndpoint || 'localhost:11434'})
              </span>
            ) : (
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> AI Live Connected
              </span>
            )}
          </div>
        </div>

        {/* Quick Prompt Chips */}
        <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
          <button
            onClick={() => handleAskCopilot('Buatkan 3 alternatif hook opening TikTok di bawah 7 detik yang paling viral dan memancing rasa penasaran penonton')}
            disabled={isCopilotLoading}
            className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white rounded-lg flex items-center gap-1 transition-colors"
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>🎯 3 Hook Viral &lt;7s</span>
          </button>
          <button
            onClick={() => handleAskCopilot('Buatkan 3 kalimat headline clickbait singkat untuk overlay video TikTok agar retensi penonton tinggi')}
            disabled={isCopilotLoading}
            className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white rounded-lg flex items-center gap-1 transition-colors"
          >
            <Wand2 className="w-3 h-3 text-amber-400" />
            <span>⚡ Headline Overlay</span>
          </button>
          <button
            onClick={() => handleAskCopilot('Buatkan caption TikTok TryBuzzer lengkap dengan hook, CTA keranjang kuning, dan hashtag')}
            disabled={isCopilotLoading}
            className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white rounded-lg flex items-center gap-1 transition-colors"
          >
            <Tag className="w-3 h-3 text-cyan-400" />
            <span>📱 Caption &amp; Hashtags</span>
          </button>
        </div>

        {/* Interactive Prompt Input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={copilotPrompt}
            onChange={(e) => setCopilotPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAskCopilot()}
            placeholder={`Tanya AI Agent (${activeProviderName})...`}
            className="flex-1 bg-neutral-950 border border-neutral-800 text-white rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500 placeholder:text-neutral-600"
          />
          <button
            onClick={() => handleAskCopilot()}
            disabled={isCopilotLoading || !copilotPrompt.trim()}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-bold rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors shrink-0"
          >
            {isCopilotLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Kirim</span>
          </button>
        </div>

        {/* AI Agent Response Box */}
        {copilotResponse && (
          <div className="p-3 bg-neutral-950 border border-emerald-800/60 rounded-lg text-xs font-mono text-neutral-200 whitespace-pre-wrap leading-relaxed animate-in fade-in">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-neutral-800 text-[10px] text-emerald-400">
              <span className="flex items-center gap-1">
                <Bot className="w-3 h-3" /> Respon {activeProviderName}:
              </span>
              <button onClick={() => setCopilotResponse(null)} className="text-neutral-500 hover:text-neutral-300">Tutup</button>
            </div>
            {copilotResponse}
          </div>
        )}
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex items-center gap-1 overflow-x-auto p-1 bg-neutral-950 border border-neutral-800/80 rounded-lg">
        {[
          { id: 'all', label: 'All Knowledge' },
          { id: 'transcript', label: 'Transcript' },
          { id: 'hooks', label: 'Hooks' },
          { id: 'problems', label: 'Problems' },
          { id: 'solutions', label: 'Solutions & Benefits' },
          { id: 'emotions', label: 'Emotions' },
          { id: 'scenes', label: 'Scene Changes' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AnalysisTab)}
            className={cn(
              'px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors',
              activeTab === tab.id
                ? 'bg-neutral-800 text-white font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Semantic Knowledge Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hooks */}
        {(activeTab === 'all' || activeTab === 'hooks') && (
          <div className="p-4 bg-neutral-950 border border-neutral-800/90 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase font-mono flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Detected Hooks</span>
              </h3>
              <span className="text-[10px] font-mono text-neutral-500">[{hooks.length} items]</span>
            </div>

            <div className="space-y-2">
              {hooks.map((hk) => (
                <div key={hk.id} className="p-3 bg-neutral-900/60 border border-neutral-800/80 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-emerald-400">
                      {formatTimestamp(hk.range?.startSeconds ?? 0)} → {formatTimestamp(hk.range?.endSeconds ?? 0)}
                    </span>
                    <span className="text-neutral-400">
                      Conf: {(hk.confidence.value * 100).toFixed(0)}% [{hk.hookType}]
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white">{hk.content}</p>
                  <p className="text-[11px] text-neutral-400 italic">"{hk.sourceQuote}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Problems & Pains */}
        {(activeTab === 'all' || activeTab === 'problems') && (
          <div className="p-4 bg-neutral-950 border border-neutral-800/90 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase font-mono flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span>Detected Problems & Bottlenecks</span>
              </h3>
              <span className="text-[10px] font-mono text-neutral-500">[{problems.length} items]</span>
            </div>

            <div className="space-y-2">
              {problems.map((pr) => (
                <div key={pr.id} className="p-3 bg-neutral-900/60 border border-neutral-800/80 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-amber-400">
                      {formatTimestamp(pr.range?.startSeconds ?? 0)} → {formatTimestamp(pr.range?.endSeconds ?? 0)}
                    </span>
                    <span className="text-neutral-400">Severity: {pr.painSeverity}</span>
                  </div>
                  <p className="text-xs font-bold text-white">{pr.content}</p>
                  <p className="text-[11px] text-neutral-400 italic">"{pr.sourceQuote}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Solutions & Benefits */}
        {(activeTab === 'all' || activeTab === 'solutions') && (
          <div className="p-4 bg-neutral-950 border border-neutral-800/90 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase font-mono flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Solutions, Benefits, & Offers</span>
              </h3>
              <span className="text-[10px] font-mono text-neutral-500">[{solutions.length + benefits.length} items]</span>
            </div>

            <div className="space-y-2">
              {solutions.map((sol) => (
                <div key={sol.id} className="p-3 bg-neutral-900/60 border border-emerald-900/40 rounded-lg space-y-1">
                  <div className="text-[10px] font-mono text-emerald-400 uppercase">SOLUTION MECHANISM</div>
                  <p className="text-xs font-semibold text-white">{sol.content}</p>
                  <p className="text-[11px] text-neutral-400">{sol.mechanism}</p>
                </div>
              ))}

              {benefits.map((ben) => (
                <div key={ben.id} className="p-3 bg-neutral-900/60 border border-neutral-800/80 rounded-lg space-y-1">
                  <div className="text-[10px] font-mono text-neutral-400 uppercase">BENEFIT [{ben.impactDimension}]</div>
                  <p className="text-xs font-semibold text-white">{ben.content}</p>
                </div>
              ))}

              {callsToAction.map((cta) => (
                <div key={cta.id} className="p-3 bg-neutral-900/60 border border-neutral-800/80 rounded-lg space-y-1">
                  <div className="text-[10px] font-mono text-amber-400 uppercase">CALL TO ACTION [{cta.actionType}]</div>
                  <p className="text-xs font-semibold text-white">{cta.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Emotions & Resonance */}
        {(activeTab === 'all' || activeTab === 'emotions') && (
          <div className="p-4 bg-neutral-950 border border-neutral-800/90 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase font-mono flex items-center gap-2">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>Emotional Resonance Curve</span>
              </h3>
              <span className="text-[10px] font-mono text-neutral-500">[{emotions.length} anchors]</span>
            </div>

            <div className="space-y-2">
              {emotions.map((em) => (
                <div key={em.id} className="p-3 bg-neutral-900/60 border border-neutral-800/80 rounded-lg flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white">{em.primaryEmotion}</span>
                    <div className="text-[10px] font-mono text-neutral-400">
                      {formatTimestamp(em.range?.startSeconds ?? 0)} → {formatTimestamp(em.range?.endSeconds ?? 0)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-rose-400">
                      {(em.intensityScore * 100).toFixed(0)}% Intensity
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scene Changes */}
        {(activeTab === 'all' || activeTab === 'scenes') && (
          <div className="p-4 bg-neutral-950 border border-neutral-800/90 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase font-mono flex items-center gap-2">
                <Film className="w-3.5 h-3.5 text-neutral-400" />
                <span>Scene Changes & Visual Cuts</span>
              </h3>
              <span className="text-[10px] font-mono text-neutral-500">[{scenes.length} cuts]</span>
            </div>

            <div className="space-y-2">
              {scenes.map((sc) => (
                <div key={sc.id} className="p-3 bg-neutral-900/60 border border-neutral-800/80 rounded-lg space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-neutral-300">
                      {formatTimestamp(sc.range?.startSeconds ?? 0)} - {formatTimestamp(sc.range?.endSeconds ?? 0)}
                    </span>
                    <span className="text-neutral-500">Shot: {sc.shotType}</span>
                  </div>
                  <p className="text-xs text-white">{sc.visualSummary}</p>
                  <p className="text-[11px] text-neutral-400 font-mono">Action: {sc.keyAction}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Raw Transcript Stream */}
        {(activeTab === 'all' || activeTab === 'transcript') && (
          <div className="p-4 bg-neutral-950 border border-neutral-800/90 rounded-xl space-y-3 lg:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-white uppercase font-mono flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-neutral-400" />
                <span>Verbatim Transcript & Speaker Attribution</span>
              </h3>
              <input
                type="text"
                value={transcriptSearch}
                onChange={(e) => setTranscriptSearch(e.target.value)}
                placeholder="Search transcript..."
                className="bg-black border border-neutral-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-neutral-600 font-mono w-48"
              />
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {filteredTranscripts.map((tr) => (
                <div key={tr.id} className="p-3 bg-neutral-900/40 border border-neutral-800/60 rounded-lg space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-neutral-400 font-semibold">{tr.speaker || 'Speaker'}</span>
                    <span className="text-emerald-400">
                      {formatTimestamp(tr.range?.startSeconds ?? 0)} → {formatTimestamp(tr.range?.endSeconds ?? 0)}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-200 leading-relaxed font-sans">{tr.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
