import React, { useState } from 'react';
import { CrawlRequest, CrawlResult, CrawlerStats, DomainScope } from '../types';
import { Play, RotateCw, Trash2, Clock, Globe, Shield, FileText, ChevronDown } from 'lucide-react';

interface SidebarProps {
  jobs: CrawlResult[];
  activeJobId: string | null;
  onSelectJob: (jobId: string) => void;
  onDeleteJob: (jobId: string) => void;
  onSubmitCrawl: (req: CrawlRequest) => Promise<void>;
  onRefreshJobs: () => void;
  stats: CrawlerStats | null;
  isSubmitting: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  jobs,
  activeJobId,
  onSelectJob,
  onDeleteJob,
  onSubmitCrawl,
  onRefreshJobs,
  stats,
  isSubmitting
}) => {
  const [seedUrl, setSeedUrl] = useState('');
  const [maxDepth, setMaxDepth] = useState(2);
  const [maxPages, setMaxPages] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [scope, setScope] = useState<DomainScope>('SAME_DOMAIN');
  const [respectRobotsTxt, setRespectRobotsTxt] = useState(true);
  const [useSitemap, setUseSitemap] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await onSubmitCrawl({
        seedUrl: seedUrl.trim(),
        maxDepth,
        maxPages,
        keyword: keyword.trim() || undefined,
        scope,
        respectRobotsTxt,
        useSitemap
      });
      setSeedUrl('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Failed to submit crawl job');
    }
  };

  return (
    <aside className="w-80 lg:w-96 glass-panel border-r border-slate-800/80 flex flex-col flex-shrink-0 z-20 overflow-y-auto">
      {/* Crawl Form */}
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
            Initiate Crawl
          </span>
          <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
            POST /api/crawl
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Seed URL <span className="text-rose-400">*</span>
            </label>
            <input
              type="url"
              required
              value={seedUrl}
              onChange={(e) => setSeedUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full glass-input px-3 py-2 text-xs font-mono text-cyan-300 rounded-lg outline-none placeholder-slate-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Max Depth</label>
              <input
                type="number"
                min="1"
                max="10"
                value={maxDepth}
                onChange={(e) => setMaxDepth(parseInt(e.target.value, 10))}
                className="w-full glass-input px-3 py-1.5 text-xs text-slate-200 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Max Pages</label>
              <input
                type="number"
                min="1"
                max="500"
                value={maxPages}
                onChange={(e) => setMaxPages(parseInt(e.target.value, 10))}
                className="w-full glass-input px-3 py-1.5 text-xs text-slate-200 rounded-lg outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Keyword Filter (Optional)</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. contact, security, pricing"
              className="w-full glass-input px-3 py-1.5 text-xs text-slate-200 rounded-lg outline-none placeholder-slate-500"
            />
          </div>

          {/* Advanced Rules Toggle */}
          <div className="border border-slate-800 rounded-lg p-2 bg-space-900/50">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 font-medium"
            >
              <span>Advanced Crawler Rules</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-2.5 pt-2 border-t border-slate-800/80 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">Domain Scope</label>
                  <select
                    value={scope}
                    onChange={(e) => setScope(e.target.value as DomainScope)}
                    className="w-full glass-input px-2.5 py-1.5 text-xs text-slate-200 rounded-lg outline-none"
                  >
                    <option value="SAME_DOMAIN">SAME_DOMAIN (Strict Host)</option>
                    <option value="SAME_DOMAIN_AND_SUBDOMAINS">SAME_DOMAIN_AND_SUBDOMAINS</option>
                    <option value="ANY">ANY (Follow All Web Links)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-300 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    Respect robots.txt
                  </span>
                  <input
                    type="checkbox"
                    checked={respectRobotsTxt}
                    onChange={(e) => setRespectRobotsTxt(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 bg-space-800 border-slate-700"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    Seed from sitemap.xml
                  </span>
                  <input
                    type="checkbox"
                    checked={useSitemap}
                    onChange={(e) => setUseSitemap(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 bg-space-800 border-slate-700"
                  />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 bg-gradient-to-r from-cyan-500 via-indigo-600 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-cyan-500/25 transition transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            {isSubmitting ? 'Launching...' : 'Launch Crawl'}
          </button>
        </form>
      </div>

      {/* Job History */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-3 bg-space-900/90 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            Job History ({jobs.length})
          </span>
          <button onClick={onRefreshJobs} className="text-slate-400 hover:text-cyan-400 text-xs">
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
          {jobs.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 italic">No past crawl jobs.</div>
          ) : (
            jobs.map((job) => {
              const isSelected = job.jobId === activeJobId;
              const statusColors = {
                RUNNING: 'bg-amber-400 animate-pulse',
                COMPLETED: 'bg-emerald-400',
                FAILED: 'bg-rose-500',
                QUEUED: 'bg-cyan-400'
              };

              return (
                <div
                  key={job.jobId}
                  onClick={() => onSelectJob(job.jobId)}
                  className={`p-2.5 rounded-lg cursor-pointer transition flex items-center justify-between group ${
                    isSelected
                      ? 'bg-cyan-500/10 border border-cyan-500/30'
                      : 'hover:bg-space-800/60 border border-transparent'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${statusColors[job.status] || 'bg-slate-400'}`} />
                      <span className="text-xs font-mono font-medium text-slate-200 truncate group-hover:text-cyan-300">
                        {job.seedUrl}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-1 pl-4">
                      <span>{job.pagesVisited || 0} pages</span>
                      <span>•</span>
                      <span>{((job.durationMillis || 0) / 1000).toFixed(1)}s</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteJob(job.jobId);
                    }}
                    title="Delete Job"
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pinned Telemetry Summary */}
      <div className="p-3 bg-space-900 border-t border-slate-800/80 text-xs">
        <div className="flex items-center justify-between text-slate-400 mb-2 font-mono text-[11px]">
          <span className="flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            TELEMETRY SUMMARY
          </span>
          <span className="text-emerald-400 font-bold">{stats?.activeJobCount || 0} Active</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center font-mono">
          <div className="bg-space-800/60 p-1.5 rounded border border-slate-800">
            <div className="text-cyan-400 font-extrabold text-sm">{stats?.totalPagesCrawled || 0}</div>
            <div className="text-[9px] text-slate-400 uppercase">Pages Crawled</div>
          </div>
          <div className="bg-space-800/60 p-1.5 rounded border border-slate-800">
            <div className="text-indigo-400 font-extrabold text-sm">{stats?.totalEmailsDiscovered || 0}</div>
            <div className="text-[9px] text-slate-400 uppercase">Emails Found</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
