import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Command,
  Moon,
  Sun,
  Palette,
  AlertTriangle,
  History,
  XCircle,
  GitCompare,
  RotateCcw
} from 'lucide-react';
import { PageData, CrawlRequest } from './types';
import { BrandIcon } from './components/BrandIcon';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeProvider, useTheme } from './features/theme/ThemeProvider';
import { useCrawl } from './features/crawl/useCrawl';
import { useCrawlHistory } from './features/crawl/useCrawlHistory';
import { CrawlForm } from './features/crawl/CrawlForm';
import { CrawlProgress } from './features/crawl/CrawlProgress';
import { LiveFeed } from './features/crawl/LiveFeed';
import { ResultsTable } from './features/crawl/ResultsTable';
import { ResultsCards } from './features/crawl/ResultsCards';
import { SkippedList } from './features/crawl/SkippedList';
import { InspectorModal } from './features/crawl/InspectorModal';
import { ExportMenu } from './features/crawl/ExportMenu';
import { CrawlDiffModal } from './features/crawl/CrawlDiffModal';
import { CommandPalette } from './features/command/CommandPalette';
import { DesignPage } from './features/design/DesignPage';
import { useKeyboardShortcut } from './hooks/useKeyboardShortcut';
import { useDebounced } from './hooks/useDebounced';

function MainApp() {
  const { theme, setTheme } = useTheme();
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

  const { history, saveCrawl, removeHistoryItem, clearHistory } = useCrawlHistory();

  // Local UI State
  const [searchFilter, setSearchFilter] = useState('');
  const debouncedFilter = useDebounced(searchFilter, 150);
  const [selectedPage, setSelectedPage] = useState<PageData | null>(null);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showDesignPage, setShowDesignPage] = useState(false);

  // Crawl Diff State
  const [diffBaseJobId, setDiffBaseJobId] = useState<string | null>(null);
  const [isDiffOpen, setIsDiffOpen] = useState(false);

  // Load latest crawl job on mount
  useEffect(() => {
    loadLatest();
  }, []);

  // Save completed crawl to history
  useEffect(() => {
    if (job && (job.status === 'COMPLETED' || job.status === 'STOPPED' || (job.status === 'FAILED' && job.pages?.length > 0))) {
      saveCrawl(job);
    }
  }, [job?.status, job?.pagesCrawled]);

  // Global Ctrl+K / Cmd+K shortcut for command palette
  useKeyboardShortcut('k', () => setIsCommandPaletteOpen(true), { ctrlOrCmd: true });

  const handleStartCrawl = (request: CrawlRequest) => {
    setSelectedUrls(new Set());
    startCrawl(request);
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
        (p.textContent && p.textContent.toLowerCase().includes(q))
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

  if (showDesignPage) {
    return <DesignPage onBack={() => setShowDesignPage(false)} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* App Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BrandIcon className="w-8 h-8 text-sky-500 flex-shrink-0" />
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100">
                Web Crawler
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-full bg-sky-500/10 text-sky-500 font-semibold border border-sky-500/20">
                Mission Control 2.0
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden md:inline-flex items-center space-x-2 px-3 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 focus-ring transition"
              aria-label="Open command palette (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search or command...</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono text-slate-400">
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus-ring transition relative"
              aria-label="Crawl History"
              title="Crawl History"
            >
              <History className="w-4 h-4" />
              {history.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-sky-500" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowDesignPage(true)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus-ring transition"
              aria-label="Design System Showcase"
              title="Design System Showcase"
            >
              <Palette className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus-ring transition"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Cold Start Banner */}
        {isWakingUp && (
          <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-600 dark:text-sky-400 flex items-center space-x-2 animate-in">
            <span className="animate-spin inline-block w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full flex-shrink-0" />
            <span>Waking the crawler backend from free-tier sleep. This may take a few moments...</span>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 flex items-center justify-between animate-in">
            <div className="flex items-center space-x-2.5">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={clearError}
              aria-label="Dismiss error"
              className="p-1 rounded text-red-500 hover:text-red-700"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Crawl Launcher Form */}
        <CrawlForm
          onSubmit={handleStartCrawl}
          isLoading={isLoading}
          defaultValues={job ? { url: job.startUrl, maxPages: job.maxPages, maxDepth: job.maxDepth } : undefined}
        />

        {/* Crawl Progress & Stat Counters */}
        {job && (
          <CrawlProgress
            job={job}
            elapsedSeconds={elapsedSeconds}
            onStop={stopCrawl}
            isLoading={isLoading}
          />
        )}

        {/* Real-time Event Streaming Ticker */}
        {job && <LiveFeed items={feedItems} isRunning={job.status === 'RUNNING'} />}

        {/* Skipped & Blocked URLs Panel */}
        {job?.skipped && job.skipped.length > 0 && (
          <SkippedList
            skipped={job.skipped}
            totalAttempted={(job.pages?.length || 0) + job.skipped.length}
          />
        )}

        {/* Results Workspace Area */}
        {job && (
          <ErrorBoundary fallbackTitle="Results Rendering Error">
            <div className="space-y-4">
              {/* Results Controls Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2 w-full sm:w-auto flex-1 max-w-sm">
                  <div className="relative w-full">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder="Filter by title, URL or text..."
                      className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus-ring"
                    />
                    {searchFilter && (
                      <button
                        type="button"
                        onClick={() => setSearchFilter('')}
                        aria-label="Clear filter"
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <ExportMenu
                    job={job}
                    pagesToExport={pagesToExport}
                    selectedCount={selectedUrls.size}
                  />
                </div>
              </div>

              {/* Empty / Error States */}
              {job.pages && job.pages.length === 0 && (
                <div className="p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 space-y-3">
                  <BrandIcon className="w-12 h-12 text-slate-400 mx-auto opacity-40" />
                  {job.status === 'RUNNING' ? (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Crawl in progress...
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Pages will stream into view here as discovered.
                      </p>
                    </div>
                  ) : job.status === 'FAILED' ? (
                    <div>
                      <h4 className="text-sm font-semibold text-red-500">
                        Crawl Completed with No Valid Pages
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                        {job.errorMessage || 'Target blocked crawler or returned non-HTML responses.'}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        No pages discovered
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Verify target URL and scope settings.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Filter Mismatch State */}
              {job.pages && job.pages.length > 0 && filteredPages.length === 0 && (
                <div className="p-8 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 space-y-2">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    No pages match filter &ldquo;{debouncedFilter}&rdquo;
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchFilter('')}
                    className="text-xs text-sky-500 hover:underline font-medium"
                  >
                    Clear Search Filter
                  </button>
                </div>
              )}

              {/* Desktop Table View */}
              {filteredPages.length > 0 && (
                <div className="hidden sm:block">
                  <ResultsTable
                    pages={filteredPages}
                    onSelectPage={setSelectedPage}
                    selectedPages={selectedUrls}
                    onToggleSelectPage={toggleSelectPage}
                    onToggleSelectAll={toggleSelectAll}
                    searchQuery={debouncedFilter}
                  />
                </div>
              )}

              {/* Mobile Card View (<640px) */}
              {filteredPages.length > 0 && (
                <ResultsCards
                  pages={filteredPages}
                  onSelectPage={setSelectedPage}
                  selectedPages={selectedUrls}
                  onToggleSelectPage={toggleSelectPage}
                  searchQuery={debouncedFilter}
                />
              )}
            </div>
          </ErrorBoundary>
        )}
      </main>

      {/* History Slide-over Drawer */}
      {isHistoryOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Crawl History Drawer"
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in"
          onClick={() => setIsHistoryOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-slate-900 h-full p-5 space-y-4 shadow-2xl flex flex-col text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <History className="w-4 h-4 text-sky-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Crawl History ({history.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                aria-label="Close history"
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5">
              {history.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400">
                  No previous crawl sessions found.
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.jobId}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                        {item.startUrl}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-mono font-bold bg-sky-500/10 text-sky-500">
                        {item.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
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
                        className="px-2 py-1 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 text-[11px] font-medium"
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
                        className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 text-[11px] font-medium flex items-center space-x-1"
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
                className="w-full py-2 text-xs font-medium text-red-500 hover:bg-red-500/10 rounded-lg transition"
              >
                Clear All History
              </button>
            )}
          </div>
        </div>
      )}

      {/* Inspector Modal / Sheet */}
      <ErrorBoundary fallbackTitle="Inspector Rendering Error">
        <InspectorModal
          page={selectedPage}
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
        <MainApp />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
