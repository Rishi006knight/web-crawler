import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Moon,
  Sun,
  AlertTriangle,
  History,
  XCircle,
  GitCompare
} from 'lucide-react';
import { PageData, CrawlRequest } from './types';
import { BrandIcon } from './components/BrandIcon';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeProvider, useTheme } from './features/theme/ThemeProvider';
import { ToastProvider, useToast } from './ui/Toast';
import { useCrawl } from './features/crawl/useCrawl';
import { useCrawlHistory } from './features/crawl/useCrawlHistory';
import { CrawlForm } from './features/crawl/CrawlForm';
import { SidebarControls } from './features/crawl/SidebarControls';
import { NetworkGraph } from './features/crawl/NetworkGraph';
import { ResultsDashboard } from './features/crawl/ResultsDashboard';
import { LiveFeed } from './features/crawl/LiveFeed';
import { SkippedList } from './features/crawl/SkippedList';
import { InspectorModal } from './features/crawl/InspectorModal';
import { CrawlDiffModal } from './features/crawl/CrawlDiffModal';
import { CommandPalette } from './features/command/CommandPalette';
import { useKeyboardShortcut } from './hooks/useKeyboardShortcut';
import { useDebounced } from './hooks/useDebounced';

function MainApp() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const {
    job,
    isLoading,
    isWakingUp,
    error,
    feedItems,
    elapsedSeconds,
    startCrawl,
    stopCrawl,
    loadJob,
    loadLatest,
    clearError
  } = useCrawl();

  const { history, saveCrawl, clearHistory } = useCrawlHistory();

  // Local UI State
  const [searchFilter, setSearchFilter] = useState('');
  const debouncedFilter = useDebounced(searchFilter, 150);
  const [selectedPage, setSelectedPage] = useState<PageData | null>(null);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Crawl Diff State
  const [diffBaseJobId, setDiffBaseJobId] = useState<string | null>(null);
  const [isDiffOpen, setIsDiffOpen] = useState(false);

  // Load latest crawl job on mount
  useEffect(() => {
    loadLatest();
  }, []);

  // Save completed crawl to history and trigger toast
  useEffect(() => {
    if (job && (job.status === 'COMPLETED' || job.status === 'STOPPED' || (job.status === 'FAILED' && job.pages?.length > 0))) {
      saveCrawl(job);
      if (job.status === 'COMPLETED') {
        toast(`Crawl finished successfully. Crawled ${job.pages?.length || 0} pages.`, 'success', 'Crawl Completed');
      } else if (job.status === 'FAILED') {
        toast(job.errorMessage || 'Crawl stopped due to errors.', 'error', 'Crawl Failed');
      }
    }
  }, [job?.status, job?.pagesCrawled]);

  // Global Ctrl+K / Cmd+K shortcut for command palette
  useKeyboardShortcut('k', () => setIsCommandPaletteOpen(true), { ctrlOrCmd: true });

  const handleStartCrawl = (request: CrawlRequest) => {
    setSelectedUrls(new Set());
    if (request.searchQuery) {
      setSearchFilter(request.searchQuery);
    }
    startCrawl(request);
    toast(
      request.searchQuery
        ? `Started crawling ${request.url} focused on "${request.searchQuery}"`
        : `Started crawling ${request.url}`,
      'info',
      'Crawl Dispatched'
    );
  };

  // Filtered pages with safety null guards
  const filteredPages = useMemo(() => {
    if (!job?.pages) return [];
    if (!debouncedFilter.trim()) return job.pages;
    const q = debouncedFilter.toLowerCase();
    return job.pages.filter(
      (p) =>
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.url && p.url.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.textContent && p.textContent.toLowerCase().includes(q)) ||
        (p.headings && p.headings.some((h) => h.toLowerCase().includes(q))) ||
        (p.imageDetails && p.imageDetails.some((img) => img.alt && img.alt.toLowerCase().includes(q)))
    );
  }, [job?.pages, debouncedFilter]);

  // Selected pages for bulk export
  const pagesToExport = useMemo(() => {
    if (!job?.pages) return [];
    if (selectedUrls.size > 0) {
      return job.pages.filter((p) => selectedUrls.has(p.url));
    }
    return filteredPages;
  }, [job?.pages, selectedUrls, filteredPages]);

  const toggleSelectPage = (url: string) => {
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!job?.pages) return;
    if (selectedUrls.size === job.pages.length) {
      setSelectedUrls(new Set());
    } else {
      setSelectedUrls(new Set(job.pages.map((p) => p.url)));
    }
  };

  // Next / Prev Page Navigation for Inspector
  const currentIndex = selectedPage && job?.pages ? job.pages.findIndex((p) => p.url === selectedPage.url) : -1;
  const hasNext = currentIndex >= 0 && job?.pages ? currentIndex < job.pages.length - 1 : false;
  const hasPrev = currentIndex > 0;

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink transition-colors">
      {/* Animated subtle gradient wash in background */}
      <div className="fixed inset-0 pointer-events-none z-0 gradient-bg opacity-60" />

      {/* ═══ App Header ═══ */}
      <header className="sticky top-0 z-40 glass-strong border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <BrandIcon className="w-9 h-9 shrink-0 shadow-sm" />
            <div>
              <span className="font-bold text-base tracking-tight text-ink-strong">
                Web Crawler
              </span>
              <span className="hidden sm:inline-block ml-2 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full gradient-accent text-white shadow-glow-sm">
                Pro
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden md:inline-flex items-center space-x-2 px-3.5 py-2 text-xs rounded-2xl glass emboss text-ink-secondary hover:text-ink-strong focus-ring transition-all duration-200 hover:shadow-glow-sm"
              aria-label="Open command palette (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-ink-muted" />
              <span>Search or command...</span>
              <kbd className="px-1.5 py-0.5 rounded-lg bg-surface-sunken text-[10px] font-mono text-ink-muted">
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className="p-2.5 rounded-2xl text-ink-secondary hover:text-ink emboss hover:shadow-glow-sm focus-ring transition-all duration-200 relative"
              aria-label="Crawl History"
              title="Crawl History"
            >
              <History className="w-4 h-4" />
              {history.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full gradient-accent animate-pulse" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 rounded-2xl text-ink-secondary hover:text-ink emboss hover:shadow-glow-sm focus-ring transition-all duration-200"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-status-warning" /> : <Moon className="w-4 h-4 text-brand" />}
            </button>
          </div>
        </div>
      </header>

      {/* ═══ Main Content Workspace ═══ */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6 relative z-10">
        {/* Cold Start Banner */}
        {isWakingUp && (
          <div className="p-4 rounded-2xl glass-panel text-xs text-status-info flex items-center space-x-3 animate-slide-up">
            <span className="animate-spin inline-block w-4 h-4 border-2 border-status-info border-t-transparent rounded-full shrink-0" />
            <span>Waking the crawler backend from free-tier sleep. This may take a few moments...</span>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-status-danger-bg border border-status-danger-line text-xs text-status-danger flex items-center justify-between animate-fade">
            <div className="flex items-center space-x-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={clearError}
              aria-label="Dismiss error"
              className="p-1.5 rounded-xl text-status-danger hover:opacity-80 focus-ring"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ═══ Split Screen Layout When Job Exists ═══ */}
        {job ? (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* LEFT SIDEBAR: Sticky Controls & Settings */}
              <SidebarControls
                currentJob={job}
                onStartCrawl={handleStartCrawl}
                onStopCrawl={stopCrawl}
                isLoading={isLoading}
              />

              {/* CENTER / MAIN: Live Network Graph Visualization & Ticker */}
              <div className="flex-1 w-full space-y-5 min-w-0">
                <NetworkGraph
                  job={job}
                  onSelectPage={setSelectedPage}
                  isRunning={job.status === 'RUNNING'}
                />

                {/* Real-time Event Streaming Ticker */}
                <LiveFeed items={feedItems} isRunning={job.status === 'RUNNING'} />

                {/* Skipped / Blocked URLs */}
                {job.skipped && job.skipped.length > 0 && (
                  <SkippedList
                    skipped={job.skipped}
                    totalAttempted={(job.pages?.length || 0) + job.skipped.length}
                  />
                )}
              </div>
            </div>

            {/* ═══ RESULTS DASHBOARD: 5 Rich Tabs ═══ */}
            <ErrorBoundary fallbackTitle="Results Dashboard Error">
              <ResultsDashboard
                job={job}
                filteredPages={filteredPages}
                pagesToExport={pagesToExport}
                selectedUrls={selectedUrls}
                searchFilter={searchFilter}
                onSearchChange={setSearchFilter}
                onSelectPage={setSelectedPage}
                onToggleSelectPage={toggleSelectPage}
                onToggleSelectAll={toggleSelectAll}
              />
            </ErrorBoundary>
          </div>
        ) : (
          /* ═══ Hero Landing State (When No Job Yet) ═══ */
          <div className="space-y-8 max-w-4xl mx-auto py-6">
            <CrawlForm
              onSubmit={handleStartCrawl}
              isLoading={isLoading}
            />

            {/* Recent Crawls Section */}
            {history.length > 0 && (
              <div className="rounded-3xl glass-panel p-6 border border-white/50 space-y-4 text-left animate-slide-up">
                <div className="flex items-center justify-between pb-2 border-b border-line/40">
                  <div className="flex items-center space-x-2">
                    <History className="w-4 h-4 text-cyan-500" />
                    <h3 className="text-sm font-bold text-ink-strong">Recent Crawls</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsHistoryOpen(true)}
                    className="text-xs gradient-accent-text hover:underline font-semibold"
                  >
                    View All ({history.length})
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {history.slice(0, 3).map((item) => (
                    <div
                      key={item.jobId}
                      onClick={() => loadJob(item.jobId)}
                      className="p-4 rounded-2xl glass emboss hover:bg-surface-raised cursor-pointer transition-all duration-200 group space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-semibold text-ink-strong truncate max-w-[160px]">
                          {item.startUrl}
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-ink-muted group-hover:text-cyan-500 transition-colors" />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-ink-muted">
                        <span>{item.pagesCrawled} pages</span>
                        <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ═══ History Slide-over Drawer ═══ */}
      {isHistoryOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Crawl History Drawer"
          className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-fade"
          onClick={() => setIsHistoryOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-surface-raised h-full p-5 space-y-4 shadow-floating flex flex-col text-left animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center space-x-2">
                <History className="w-4 h-4 text-brand" />
                <h3 className="text-sm font-bold text-ink-strong">
                  Crawl History ({history.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                aria-label="Close history"
                className="p-1.5 rounded-xl text-ink-muted hover:text-ink focus-ring"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5">
              {history.length === 0 ? (
                <div className="text-center py-12 text-xs text-ink-muted">
                  No previous crawl sessions found.
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.jobId}
                    className="p-4 rounded-2xl glass-panel space-y-2.5 text-xs stagger-item animate-slide-up"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-semibold text-ink-strong truncate max-w-[180px]">
                        {item.startUrl}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-mono font-bold gradient-accent text-white">
                        {item.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-ink-muted flex items-center justify-between">
                      <span>{item.pagesCrawled} pages</span>
                      <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          loadJob(item.jobId);
                          setIsHistoryOpen(false);
                        }}
                        className="px-3 py-1.5 rounded-xl gradient-accent text-white text-[11px] font-medium hover:opacity-90 focus-ring transition"
                      >
                        Re-open
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDiffBaseJobId(item.jobId);
                          setIsDiffOpen(true);
                          setIsHistoryOpen(false);
                        }}
                        className="px-3 py-1.5 rounded-xl glass emboss text-ink hover:text-ink-strong text-[11px] font-medium flex items-center space-x-1 focus-ring transition"
                      >
                        <GitCompare className="w-3 h-3" />
                        <span>Diff</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {history.length > 0 && (
              <button
                type="button"
                onClick={clearHistory}
                className="w-full py-2.5 text-xs font-medium text-status-danger hover:bg-status-danger-bg rounded-2xl border border-transparent hover:border-status-danger-line transition focus-ring"
              >
                Clear All History
              </button>
            )}
          </div>
        </div>
      )}

      {/* ═══ Inspector Modal ═══ */}
      <ErrorBoundary fallbackTitle="Inspector Rendering Error">
        <InspectorModal
          page={selectedPage}
          searchQuery={searchFilter || job?.searchQuery}
          onClose={() => setSelectedPage(null)}
          onNext={() => hasNext && job?.pages && setSelectedPage(job.pages[currentIndex + 1])}
          onPrev={() => hasPrev && job?.pages && setSelectedPage(job.pages[currentIndex - 1])}
          hasNext={hasNext}
          hasPrev={hasPrev}
        />
      </ErrorBoundary>

      {/* Crawl Comparison Diff Modal */}
      {isDiffOpen && job && (
        <CrawlDiffModal
          isOpen={isDiffOpen}
          onClose={() => setIsDiffOpen(false)}
          basePages={job.pages || []}
          targetPages={job.pages || []}
          baseTitle="Current Crawl"
          targetTitle="Selected Snapshot"
        />
      )}

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onStartCrawlPrompt={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onStopCrawl={stopCrawl}
        isRunning={job?.status === 'RUNNING'}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onExport={() => {}}
        pages={job?.pages || []}
        onSelectPage={setSelectedPage}
      />
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary isRoot>
      <ThemeProvider>
        <ToastProvider>
          <MainApp />
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
