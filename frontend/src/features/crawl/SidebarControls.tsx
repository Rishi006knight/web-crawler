import React, { useState } from 'react';
import {
  Play,
  StopCircle,
  Sliders,
  Globe
} from 'lucide-react';
import { CrawlRequest, CrawlJob } from '../../types';

interface SidebarControlsProps {
  currentJob: CrawlJob | null;
  onStartCrawl: (request: CrawlRequest) => void;
  onStopCrawl: () => void;
  isLoading: boolean;
}

export function SidebarControls({
  currentJob,
  onStartCrawl,
  onStopCrawl,
  isLoading
}: SidebarControlsProps) {
  const [url, setUrl] = useState(currentJob?.startUrl || 'https://news.ycombinator.com');
  const [maxPages, setMaxPages] = useState<number>(currentJob?.maxPages || 20);
  const [maxDepth, setMaxDepth] = useState<number>(currentJob?.maxDepth || 2);
  const [crawlMode, setCrawlMode] = useState<'BFS' | 'DFS'>('BFS');

  const isRunning = currentJob?.status === 'RUNNING';

  const handleLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    onStartCrawl({
      url: url.trim(),
      maxPages,
      maxDepth,
      sameDomainOnly: true,
      urlNormalization: true,
      ignoreRobotsTxt: false
    });
  };

  return (
    <aside className="w-full lg:w-80 shrink-0 space-y-5 text-left">
      <div className="sticky top-20 rounded-3xl glass-panel p-5 border border-white/50 backdrop-blur-xl shadow-soft space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-line/40">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-gradient-start" />
            <h3 className="text-sm font-bold text-ink-strong">Crawler Controls</h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-sunken text-ink-muted font-bold">
            {crawlMode}
          </span>
        </div>

        <form onSubmit={handleLaunch} className="space-y-4">
          {/* Target Seed URL */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Target URL
            </label>
            <div className="relative">
              <Globe className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-2.5" />
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl glass emboss text-ink-strong placeholder:text-ink-muted focus-ring font-mono"
              />
            </div>
          </div>

          {/* Crawl Mode Toggle (BFS vs DFS) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted flex items-center justify-between">
              <span>Crawl Mode</span>
              <span className="text-[10px] font-normal lowercase text-ink-muted">
                {crawlMode === 'BFS' ? 'Breadth-First' : 'Depth-First'}
              </span>
            </label>
            <div className="grid grid-cols-2 p-1 rounded-xl glass emboss bg-surface-sunken/40">
              <button
                type="button"
                onClick={() => setCrawlMode('BFS')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  crawlMode === 'BFS'
                    ? 'gradient-accent text-white shadow-sm'
                    : 'text-ink-secondary hover:text-ink-strong'
                }`}
              >
                BFS (Standard)
              </button>
              <button
                type="button"
                onClick={() => setCrawlMode('DFS')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  crawlMode === 'DFS'
                    ? 'gradient-accent text-white shadow-sm'
                    : 'text-ink-secondary hover:text-ink-strong'
                }`}
              >
                DFS (Deep)
              </button>
            </div>
          </div>

          {/* Settings Sliders */}
          <div className="space-y-3 pt-2 border-t border-line/40">
            {/* Max Pages */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-secondary">Max Pages</span>
                <span className="font-mono font-bold text-ink-strong">{maxPages}</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={maxPages}
                onChange={(e) => setMaxPages(Number(e.target.value))}
                className="w-full accent-cyan-500 h-1.5 bg-surface-sunken rounded-lg cursor-pointer"
              />
            </div>

            {/* Max Depth */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-secondary">Max Depth</span>
                <span className="font-mono font-bold text-ink-strong">{maxDepth}</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={maxDepth}
                onChange={(e) => setMaxDepth(Number(e.target.value))}
                className="w-full accent-purple-500 h-1.5 bg-surface-sunken rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Action Button: Start or Stop */}
          <div className="pt-2">
            {isRunning ? (
              <button
                type="button"
                onClick={onStopCrawl}
                className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold text-xs flex items-center justify-center space-x-2 shadow-glow-sm hover:opacity-90 focus-ring transition"
              >
                <StopCircle className="w-4 h-4" />
                <span>Stop Active Crawl</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-2xl gradient-accent text-white font-semibold text-xs flex items-center justify-center space-x-2 shadow-glow-sm hover:brightness-105 active:scale-95 focus-ring disabled:opacity-50 transition"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isLoading ? 'Launching...' : 'Run Crawl'}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </aside>
  );
}
