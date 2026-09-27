/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode, useEffect } from 'react';
import { useProjectStore } from './application/stores/useProjectStore';
import { useJobQueueStore } from './application/stores/useJobQueueStore';
import { useSystemStore } from './application/stores/useSystemStore';
import { AppSidebar } from './ui/components/sidebar/AppSidebar';
import { AppStatusBar } from './ui/components/statusbar/AppStatusBar';
import { ProjectWorkspace } from './ui/components/workspace/ProjectWorkspace';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class DesktopErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Desktop App Crash caught by ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-black text-white flex flex-col items-center justify-center p-8 font-mono select-none">
          <div className="max-w-md w-full bg-neutral-950 border border-neutral-800 rounded-xl p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-800/80 flex items-center justify-center mx-auto text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Desktop Runtime Fault Caught
              </h2>
              <p className="text-xs text-neutral-400 font-sans">
                {this.state.error?.message || 'An unexpected rendering anomaly occurred.'}
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={this.handleReset}
                className="w-full py-2.5 bg-white hover:bg-neutral-200 text-black font-semibold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors font-sans"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Local Cache & Relaunch</span>
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const initializeProjects = useProjectStore((s) => s.initialize);
  const initializeQueue = useJobQueueStore((s) => s.initialize);
  const activeProject = useProjectStore((s) => s.activeProject);
  const autosaveNow = useProjectStore((s) => s.autosaveNow);
  const accentColor = useSystemStore((s) => s.accentColor);

  useEffect(() => {
    document.documentElement.dataset.accent = accentColor;
  }, [accentColor]);

  useEffect(() => {
    initializeProjects();
    initializeQueue();
  }, [initializeProjects, initializeQueue]);

  // Periodic 30-second offline autosave
  useEffect(() => {
    if (!activeProject) return;
    const interval = setInterval(() => {
      autosaveNow();
    }, 30000);
    return () => clearInterval(interval);
  }, [activeProject?.id, autosaveNow]);

  return (
    <DesktopErrorBoundary>
      <div className="flex flex-col h-screen w-screen bg-black text-neutral-100 font-sans overflow-hidden select-none antialiased">
        {/* Main Workspace Frame */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar */}
          <AppSidebar />

          {/* Central Workspace Area */}
          <main className="flex-1 overflow-hidden flex flex-col bg-black">
            <ProjectWorkspace />
          </main>
        </div>

        {/* Bottom Status Bar */}
        <AppStatusBar />
      </div>
    </DesktopErrorBoundary>
  );
}
