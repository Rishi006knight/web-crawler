import React from 'react';
import { CrawlResult } from '../types';
import { Copy, Mail, Globe, Shield, CheckCircle, AlertTriangle } from 'lucide-react';

interface OverviewTabProps {
  job: CrawlResult;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ job }) => {
  const isRunning = job.status === 'RUNNING' || job.status === 'QUEUED';
  const pages = job.pageInfos || [];

  // Deduplicate emails
  const emailsSet = new Set<string>();
  pages.forEach((p) => {
    if (p.emailsFound) p.emailsFound.forEach((e) => emailsSet.add(e));
  });
  const uniqueEmails = Array.from(emailsSet);

  // Link calculations
  let totalInternal = 0;
  let totalExternal = 0;
  let totalWords = 0;
  let totalImages = 0;

  pages.forEach((p) => {
    totalInternal += p.internalLinkCount || 0;
    totalExternal += p.externalLinkCount || 0;
    totalWords += p.wordCount || 0;
    totalImages += p.imageCount || 0;
  });

  const totalLinks = totalInternal + totalExternal;
  const internalPct = totalLinks > 0 ? Math.round((totalInternal / totalLinks) * 100) : 50;

  const handleCopyEmails = () => {
    if (uniqueEmails.length > 0) {
      navigator.clipboard.writeText(uniqueEmails.join('\n'));
      alert(`Copied ${uniqueEmails.length} email addresses!`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Live progress indicator when RUNNING */}
      {isRunning && (
        <div className="glass-panel p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-amber-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              CRAWL IN PROGRESS — REDIS QUEUE ACTIVE
            </span>
            <span className="font-mono text-amber-300 font-bold">Auto-Polling Active</span>
          </div>
          <div className="w-full h-2 bg-space-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-cyan-400 transition-all duration-300 animate-pulse"
              style={{ width: '60%' }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] font-mono text-slate-400">
            <span>Visited {job.pagesVisited || 0} pages</span>
            <span>Polling every 2 seconds</span>
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="glass-card p-4 rounded-xl border-l-4 border-cyan-500">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pages Visited</div>
          <div className="text-2xl font-extrabold text-cyan-400 font-mono mt-1">{job.pagesVisited || 0}</div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">Status: {job.status}</div>
        </div>

        <div className="glass-card p-4 rounded-xl border-l-4 border-indigo-500">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Discovered URLs</div>
          <div className="text-2xl font-extrabold text-indigo-400 font-mono mt-1">{job.urlsDiscovered || 0}</div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">In Queue / Visited</div>
        </div>

        <div className="glass-card p-4 rounded-xl border-l-4 border-emerald-500">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Duration</div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">
            {((job.durationMillis || 0) / 1000).toFixed(1)}s
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">Total Elapsed</div>
        </div>

        <div className="glass-card p-4 rounded-xl border-l-4 border-amber-500">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Keyword Hits</div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono mt-1">
            {(job.matchedUrls || []).length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">Filter Matches</div>
        </div>

        <div className="glass-card p-4 rounded-xl border-l-4 border-purple-500">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Duplicates</div>
          <div className="text-2xl font-extrabold text-purple-400 font-mono mt-1">{job.duplicateCount || 0}</div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">SHA-256 Hash</div>
        </div>

        <div className="glass-card p-4 rounded-xl border-l-4 border-rose-500">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Failed / Blocked</div>
          <div className="text-2xl font-extrabold text-rose-400 font-mono mt-1">
            {(job.failedUrls || []).length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">Robots / 5xx</div>
        </div>
      </div>

      {/* Discovered Emails Panel */}
      <div className="glass-panel p-5 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Mail className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-200">
              Aggregated Emails Discovered ({uniqueEmails.length})
            </h3>
          </div>
          {uniqueEmails.length > 0 && (
            <button
              onClick={handleCopyEmails}
              className="px-2.5 py-1 bg-space-800 hover:bg-space-700 text-slate-300 text-xs rounded border border-slate-700 transition flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy All
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {uniqueEmails.length === 0 ? (
            <span className="text-xs text-slate-500 italic">No emails discovered on crawled pages.</span>
          ) : (
            uniqueEmails.map((email) => (
              <span
                key={email}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-mono text-xs"
              >
                <Mail className="w-3 h-3 text-emerald-400" />
                {email}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Content & Link Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-5 rounded-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            Content & Link Metrics
          </h3>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Internal vs. External Links</span>
                <span className="text-cyan-300">{internalPct}% Internal</span>
              </div>
              <div className="w-full h-2 bg-space-800 rounded-full overflow-hidden flex">
                <div className="bg-cyan-500 h-full" style={{ width: `${internalPct}%` }} />
                <div className="bg-indigo-500 h-full" style={{ width: `${100 - internalPct}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>{totalInternal} internal</span>
                <span>{totalExternal} external</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center">
              <div className="bg-space-900/80 p-2.5 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase">Avg Words / Page</div>
                <div className="text-slate-100 font-bold text-sm mt-0.5">
                  {pages.length > 0 ? Math.round(totalWords / pages.length) : 0}
                </div>
              </div>
              <div className="bg-space-900/80 p-2.5 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase">Total Images</div>
                <div className="text-slate-100 font-bold text-sm mt-0.5">{totalImages}</div>
              </div>
              <div className="bg-space-900/80 p-2.5 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase">Crawl Scope</div>
                <div className="text-cyan-400 font-bold text-xs mt-1 truncate">{job.scope || 'SAME_DOMAIN'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Politeness & Compliance */}
        <div className="glass-panel p-5 rounded-xl space-y-3 text-xs font-mono">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 font-sans">
            <Shield className="w-4 h-4 text-emerald-400" />
            Compliance & Engine Settings
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Job ID:</span>
              <span className="text-slate-300 select-all">{job.jobId}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Robots.txt Enforced:</span>
              <span className="text-emerald-400 font-semibold">{job.respectRobotsTxt ? 'YES' : 'NO'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Sitemap.xml Pre-seeding:</span>
              <span className="text-slate-300">{job.useSitemap ? 'YES' : 'NO'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Politeness Delay:</span>
              <span className="text-cyan-400">500ms + robots.txt Crawl-delay</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Redis Storage:</span>
              <span className="text-slate-300">7-Day Retention</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
