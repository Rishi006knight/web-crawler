import React from 'react';
import { CrawlerStats } from '../types';
import { Activity, RefreshCw } from 'lucide-react';

interface GlobalStatsTabProps {
  stats: CrawlerStats | null;
  onRefresh: () => void;
}

export const GlobalStatsTab: React.FC<GlobalStatsTabProps> = ({ stats, onRefresh }) => {
  if (!stats) {
    return (
      <div className="glass-panel p-8 text-center text-xs text-slate-500 italic">
        Loading crawler engine statistics...
      </div>
    );
  }

  const topDomains = stats.topDomains ? Object.entries(stats.topDomains) : [];
  const maxCount = topDomains.length > 0 ? Math.max(...topDomains.map(([, c]) => c)) : 1;

  return (
    <div className="glass-panel p-5 rounded-xl space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-400" />
          Crawler Engine Lifetime Telemetry (/api/stats)
        </h2>
        <button
          onClick={onRefresh}
          className="px-3 py-1.5 bg-space-800 hover:bg-space-700 text-slate-200 text-xs rounded-lg border border-slate-700 transition flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Stats
        </button>
      </div>

      {/* Global KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl text-center">
          <div className="text-xs text-slate-400 font-bold uppercase">Total Pages Crawled</div>
          <div className="text-3xl font-extrabold text-cyan-400 font-mono mt-2">{stats.totalPagesCrawled || 0}</div>
        </div>
        <div className="glass-card p-4 rounded-xl text-center">
          <div className="text-xs text-slate-400 font-bold uppercase">Unique Domains</div>
          <div className="text-3xl font-extrabold text-indigo-400 font-mono mt-2">{stats.totalUniqueDomains || 0}</div>
        </div>
        <div className="glass-card p-4 rounded-xl text-center">
          <div className="text-xs text-slate-400 font-bold uppercase">Emails Harvested</div>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono mt-2">{stats.totalEmailsDiscovered || 0}</div>
        </div>
        <div className="glass-card p-4 rounded-xl text-center">
          <div className="text-xs text-slate-400 font-bold uppercase">Avg Duration</div>
          <div className="text-3xl font-extrabold text-purple-400 font-mono mt-2">
            {((stats.averageCrawlDurationMs || 0) / 1000).toFixed(1)}s
          </div>
        </div>
      </div>

      {/* Top Domains Breakdown */}
      <div className="mt-6 pt-6 border-t border-slate-800">
        <h3 className="text-sm font-bold text-slate-300 mb-3">Top Crawled Domains Breakdown</h3>
        <div className="space-y-2">
          {topDomains.length === 0 ? (
            <div className="text-xs text-slate-500 italic">No domain statistics available.</div>
          ) : (
            topDomains.map(([domain, count]) => {
              const pct = Math.round((count / maxCount) * 100);
              return (
                <div key={domain}>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-slate-300 font-semibold">{domain}</span>
                    <span className="text-cyan-400">{count} pages</span>
                  </div>
                  <div className="w-full h-2 bg-space-800 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
