import React from 'react';
import { CrawlResult } from '../types';
import { Network, Download, FileJson, Trash2, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

interface HeaderProps {
  activeJob: CrawlResult | null;
  onClearCache: () => void;
  onRefreshStats: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeJob, onClearCache, onRefreshStats }) => {
  return (
    <header className="h-16 glass-panel border-b border-slate-800/80 px-6 flex items-center justify-between z-30 sticky top-0">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 via-indigo-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Network className="w-5 h-5 text-black font-bold" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
              CRAWLER MISSION CONTROL
            </h1>
            <div className="text-[10px] text-slate-400 font-mono tracking-wider uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Spring Boot 3.3 • Redis Queue • Jsoup BFS
            </div>
          </div>
        </div>

        <div className="h-5 w-px bg-slate-800 hidden sm:block" />

        {activeJob && (
          <div className="hidden sm:flex items-center space-x-2 bg-space-900/90 px-3 py-1 rounded-full border border-slate-700/60 text-xs">
            <span className="text-slate-400">Target:</span>
            <span className="font-mono text-cyan-400 font-medium truncate max-w-[240px]">
              {activeJob.seedUrl}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                activeJob.status === 'RUNNING'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                  : activeJob.status === 'COMPLETED'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : activeJob.status === 'FAILED'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {activeJob.status}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2.5">
        {activeJob && (
          <>
            <a
              href={api.getExportUrl(activeJob.jobId, 'csv')}
              download
              className="flex items-center gap-1.5 px-3 py-1.5 bg-space-800 hover:bg-space-700 border border-slate-700 text-xs font-semibold rounded-lg transition"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              CSV
            </a>

            <a
              href={api.getExportUrl(activeJob.jobId, 'json')}
              download
              className="flex items-center gap-1.5 px-3 py-1.5 bg-space-800 hover:bg-space-700 border border-slate-700 text-xs font-semibold rounded-lg transition"
            >
              <FileJson className="w-3.5 h-3.5 text-cyan-400" />
              JSON
            </a>

            <button
              onClick={onClearCache}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold rounded-lg transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Cache
            </button>
          </>
        )}

        <button
          onClick={onRefreshStats}
          title="Refresh Telemetry"
          className="p-2 bg-space-800 hover:bg-space-700 border border-slate-700 text-slate-300 hover:text-cyan-400 rounded-lg transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
