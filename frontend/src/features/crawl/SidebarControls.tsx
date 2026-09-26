import React, { useState } from 'react';
import {
  Play,
  StopCircle,
  Sliders,
  ShieldCheck,
  Globe,
  Settings2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  Info,
  Search
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
  const [searchQuery, setSearchQuery] = useState(currentJob?.searchQuery || '');
  const [maxPages, setMaxPages] = useState<number>(currentJob?.maxPages || 20);
  const [maxDepth, setMaxDepth] = useState<number>(currentJob?.maxDepth || 2);
  const [crawlMode, setCrawlMode] = useState<'BFS' | 'DFS'>('BFS');
  const [ignoreRobotsTxt, setIgnoreRobotsTxt] = useState(false);
  const [sameDomainOnly, setSameDomainOnly] = useState(true);
  const [urlNormalization, setUrlNormalization] = useState(true);
  const [includePattern, setIncludePattern] = useState('');
  const [excludePattern, setExcludePattern] = useState('');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const isRunning = currentJob?.status === 'RUNNING';

  const handleLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    onStartCrawl({
      url: url.trim(),
      maxPages,
      maxDepth,
      ignoreRobotsTxt,
      sameDomainOnly,
      urlNormalization,
      includePattern: includePattern.trim() || undefined,
      excludePattern: excludePattern.trim() || undefined,
      searchQuery: searchQuery.trim() || undefined
    });
  };

  return (
    <aside className="w-full lg:w-80 shrink-0 space-y-5 text-left">
      <div className="sticky top-20 rounded-3xl glass-panel p-5 border border-white/50 backdrop-blur-xl shadow-soft space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-line/40">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-cyan-500" />
            <h3 className="text-sm font-bold text-ink-strong">Crawler Controls</h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 font-bold">
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

          {/* Search Focus Keyword */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted flex items-center justify-between">
              <span>Focus Keyword (Optional)</span>
              <span className="text-[10px] text-ink-muted">e.g. laptop</span>
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="laptop, electronics..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl glass emboss text-ink-strong placeholder:text-ink-muted focus-ring"
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

          {/* Quick Settings Sliders */}
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

          {/* Compliance & Security Check */}
          <div className="p-3 rounded-2xl bg-surface-sunken/60 space-y-2 border border-line/40 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="font-semibold text-ink-strong">SSRF Shield</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                Active
              </span>
            </div>

            <label className="flex items-center justify-between cursor-pointer pt-1">
              <span className="text-[11px] text-ink-secondary">Robots.txt Policy</span>
              <input
                type="checkbox"
                checked={!ignoreRobotsTxt}
                onChange={(e) => setIgnoreRobotsTxt(!e.target.checked)}
                className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
              />
            </label>
          </div>

          {/* Advanced Options Accordion */}
          <div className="border-t border-line/40 pt-2">
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="w-full flex items-center justify-between text-xs text-ink-secondary hover:text-ink-strong py-1"
            >
              <span className="font-semibold">Advanced Filters</span>
              {isAdvancedOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {isAdvancedOpen && (
              <div className="pt-2.5 space-y-2.5 text-xs animate-slide-up">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-ink-secondary">Same Domain Only</span>
                  <input
                    type="checkbox"
                    checked={sameDomainOnly}
                    onChange={(e) => setSameDomainOnly(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-ink-secondary">URL Normalization</span>
                  <input
                    type="checkbox"
                    checked={urlNormalization}
                    onChange={(e) => setUrlNormalization(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500 rounded"
                  />
                </label>

                <div className="space-y-1">
                  <span className="text-[10px] text-ink-muted">Include Regex</span>
                  <input
                    type="text"
                    value={includePattern}
                    onChange={(e) => setIncludePattern(e.target.value)}
                    placeholder="e.g. ^/blog/.*"
                    className="w-full px-2.5 py-1 text-[11px] rounded-lg glass font-mono text-ink-strong"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-ink-muted">Exclude Regex</span>
                  <input
                    type="text"
                    value={excludePattern}
                    onChange={(e) => setExcludePattern(e.target.value)}
                    placeholder="e.g. .*\\.pdf$"
                    className="w-full px-2.5 py-1 text-[11px] rounded-lg glass font-mono text-ink-strong"
                  />
                </div>
              </div>
            )}
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
                <span>Stop Live Crawl</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-2xl gradient-accent text-white font-semibold text-xs flex items-center justify-center space-x-2 shadow-glow-sm hover:opacity-95 focus-ring transition"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{isLoading ? 'Starting...' : 'Start New Crawl'}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </aside>
  );
}
