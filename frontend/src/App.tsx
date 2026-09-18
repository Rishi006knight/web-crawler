import React, { useState, useEffect, useRef } from 'react';
import { CrawlRequest, CrawlResult, CrawlerStats, PageInfo } from './types';
import { api } from './services/api';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewTab } from './components/OverviewTab';
import { LinkGraphTab } from './components/LinkGraphTab';
import { PagesTableTab } from './components/PagesTableTab';
import { KeywordMatchesTab } from './components/KeywordMatchesTab';
import { FailedUrlsTab } from './components/FailedUrlsTab';
import { GlobalStatsTab } from './components/GlobalStatsTab';
import { PageDrawer } from './components/PageDrawer';
import { LayoutDashboard, Network, Table, Hash, AlertCircle, FileCode, Activity } from 'lucide-react';

type TabType = 'overview' | 'graph' | 'pages' | 'matches' | 'failed' | 'raw' | 'stats';

export const App: React.FC = () => {
  const [jobs, setJobs] = useState<CrawlResult[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeJob, setActiveJob] = useState<CrawlResult | null>(null);
  const [stats, setStats] = useState<CrawlerStats | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [inspectedPage, setInspectedPage] = useState<PageInfo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pollTimerRef = useRef<number | null>(null);

  const fetchJobs = async () => {
    try {
      const data = await api.getAllJobs();
      setJobs(data);
      if (!activeJobId && data.length > 0) {
        setActiveJobId(data[0].jobId);
      }
    } catch (e) {
      console.warn('Failed loading jobs:', e);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (e) {
      console.warn('Failed loading stats:', e);
    }
  };

  const fetchActiveJob = async (jobId: string) => {
    try {
      const data = await api.getJob(jobId);
      setActiveJob(data);

      if (data.status === 'RUNNING' || data.status === 'QUEUED') {
        if (!pollTimerRef.current) {
          pollTimerRef.current = window.setInterval(() => {
            fetchActiveJob(jobId);
          }, 2000);
        }
      } else {
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }
        fetchJobs();
        fetchStats();
      }
    } catch (e) {
      console.error('Failed fetching active job:', e);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeJobId) {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      fetchActiveJob(activeJobId);
    }
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [activeJobId]);

  const handleSubmitCrawl = async (req: CrawlRequest) => {
    setIsSubmitting(true);
    try {
      const result = await api.startCrawl(req);
      setActiveJobId(result.jobId);
      fetchJobs();
      fetchStats();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (confirm('Delete this crawl job record?')) {
      await api.deleteJob(jobId);
      if (activeJobId === jobId) {
        setActiveJobId(null);
        setActiveJob(null);
      }
      fetchJobs();
      fetchStats();
    }
  };

  const handleClearCache = async () => {
    if (activeJobId && confirm('Clear Redis cache for this job?')) {
      await api.clearJobCache(activeJobId);
      alert('Redis cache cleared!');
      fetchActiveJob(activeJobId);
    }
  };

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 font-sans flex flex-col selection:bg-cyan-500 selection:text-black">
      <Header
        activeJob={activeJob}
        onClearCache={handleClearCache}
        onRefreshStats={() => {
          fetchStats();
          fetchJobs();
        }}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          jobs={jobs}
          activeJobId={activeJobId}
          onSelectJob={(id) => setActiveJobId(id)}
          onDeleteJob={handleDeleteJob}
          onSubmitCrawl={handleSubmitCrawl}
          onRefreshJobs={fetchJobs}
          stats={stats}
          isSubmitting={isSubmitting}
        />

        <main className="flex-1 flex flex-col min-w-0 bg-[#060911] overflow-hidden relative">
          {/* Top Tabs */}
          <div className="h-12 glass-panel border-b border-slate-800 px-6 flex items-center justify-between z-10 flex-shrink-0">
            <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                  activeTab === 'overview'
                    ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-space-800'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Overview
              </button>

              <button
                onClick={() => setActiveTab('graph')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                  activeTab === 'graph'
                    ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-space-800'
                }`}
              >
                <Network className="w-3.5 h-3.5 text-indigo-400" />
                Link Graph
              </button>

              <button
                onClick={() => setActiveTab('pages')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                  activeTab === 'pages'
                    ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-space-800'
                }`}
              >
                <Table className="w-3.5 h-3.5 text-emerald-400" />
                Pages ({activeJob?.pageInfos?.length || 0})
              </button>

              {activeJob?.matchedUrls && activeJob.matchedUrls.length > 0 && (
                <button
                  onClick={() => setActiveTab('matches')}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                    activeTab === 'matches'
                      ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-space-800'
                  }`}
                >
                  <Hash className="w-3.5 h-3.5 text-amber-400" />
                  Keyword Hits ({activeJob.matchedUrls.length})
                </button>
              )}

              {activeJob?.failedUrls && activeJob.failedUrls.length > 0 && (
                <button
                  onClick={() => setActiveTab('failed')}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                    activeTab === 'failed'
                      ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-space-800'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  Failed ({activeJob.failedUrls.length})
                </button>
              )}

              <button
                onClick={() => setActiveTab('raw')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                  activeTab === 'raw'
                    ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-space-800'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-slate-400" />
                Raw URLs
              </button>

              <button
                onClick={() => setActiveTab('stats')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                  activeTab === 'stats'
                    ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-space-800'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-purple-400" />
                Global Stats
              </button>
            </div>

            {activeJob && (activeJob.status === 'RUNNING' || activeJob.status === 'QUEUED') && (
              <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                POLLING ACTIVE
              </div>
            )}
          </div>

          {/* Active Tab View */}
          <div className="flex-1 overflow-y-auto p-6">
            {!activeJob && activeTab !== 'stats' ? (
              <div className="glass-panel p-12 text-center rounded-xl space-y-3">
                <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto">
                  <Network className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-200">No Crawl Job Selected</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Submit a new crawl target URL in the left sidebar or select an existing job from the history list.
                </p>
              </div>
            ) : (
              <>
                {activeTab === 'overview' && activeJob && <OverviewTab job={activeJob} />}
                {activeTab === 'graph' && activeJob && (
                  <LinkGraphTab job={activeJob} onSelectPage={(p) => setInspectedPage(p)} />
                )}
                {activeTab === 'pages' && activeJob && (
                  <PagesTableTab job={activeJob} onSelectPage={(p) => setInspectedPage(p)} />
                )}
                {activeTab === 'matches' && activeJob && <KeywordMatchesTab job={activeJob} />}
                {activeTab === 'failed' && activeJob && <FailedUrlsTab job={activeJob} />}
                {activeTab === 'raw' && activeJob && (
                  <div className="space-y-4">
                    <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-200">
                        Visited URLs Sequence ({(activeJob.visitedUrls || []).length})
                      </h3>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText((activeJob.visitedUrls || []).join('\n'));
                          alert('Copied URLs to clipboard!');
                        }}
                        className="px-2.5 py-1 bg-space-800 hover:bg-space-700 text-slate-300 text-xs rounded border border-slate-700 transition"
                      >
                        Copy All
                      </button>
                    </div>
                    <div className="glass-panel p-4 rounded-xl">
                      <pre className="font-mono text-xs text-cyan-300 max-h-[500px] overflow-y-auto whitespace-pre-wrap select-all">
                        {(activeJob.visitedUrls || []).join('\n') || 'No URLs visited yet.'}
                      </pre>
                    </div>
                  </div>
                )}
                {activeTab === 'stats' && (
                  <GlobalStatsTab stats={stats} onRefresh={fetchStats} />
                )}
              </>
            )}
          </div>

          {/* Slide-over inspector drawer */}
          <PageDrawer page={inspectedPage} onClose={() => setInspectedPage(null)} />
        </main>
      </div>
    </div>
  );
};
