import React, { useState, useEffect, useRef } from 'react';
import { api } from './services/api';
import { CrawlJob, PageData } from './types';

export function App() {
  const [url, setUrl] = useState('https://example.com');
  const [maxPages, setMaxPages] = useState<number>(20);
  const [maxDepth, setMaxDepth] = useState<number>(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentJob, setCurrentJob] = useState<CrawlJob | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPage, setSelectedPage] = useState<PageData | null>(null);

  const pollIntervalRef = useRef<number | null>(null);

  // Poll job status if running
  useEffect(() => {
    if (currentJob && currentJob.status === 'RUNNING') {
      pollIntervalRef.current = window.setInterval(async () => {
        try {
          const updated = await api.getJob(currentJob.jobId);
          setCurrentJob(updated);
          if (updated.status !== 'RUNNING') {
            setLoading(false);
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          }
        } catch (err) {
          console.error('Error polling job:', err);
        }
      }, 1000);
    } else {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      setLoading(false);
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [currentJob?.jobId, currentJob?.status]);

  // Try loading latest job on initial mount
  useEffect(() => {
    api.getLatestJob()
      .then((job) => {
        if (job) setCurrentJob(job);
      })
      .catch(() => {});
  }, []);

  const handleStartCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Please enter a website URL');
      return;
    }

    setError(null);
    setLoading(true);
    setSelectedPage(null);

    try {
      const job = await api.startCrawl({
        url: url.trim(),
        maxPages: Number(maxPages) || 20,
        maxDepth: Number(maxDepth) || 2,
      });
      setCurrentJob(job);
    } catch (err: any) {
      setError(err.message || 'Failed to start crawler');
      setLoading(false);
    }
  };

  const handleStopCrawl = async () => {
    if (currentJob) {
      try {
        await api.stopCrawl(currentJob.jobId);
        const updated = await api.getJob(currentJob.jobId);
        setCurrentJob(updated);
      } catch (err) {
        console.error('Failed to stop crawl', err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Filter pages by search query
  const filteredPages = currentJob?.pages?.filter((page) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      page.title.toLowerCase().includes(q) ||
      page.url.toLowerCase().includes(q) ||
      page.textContent.toLowerCase().includes(q)
    );
  }) || [];

  const progressPercent = currentJob
    ? Math.min(100, Math.round((currentJob.pagesCrawled / currentJob.maxPages) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-xl shadow-lg shadow-cyan-500/10">
              🕷️
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Web Crawler
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-medium">
                  Simple & Fast
                </span>
              </h1>
              <p className="text-xs text-slate-400">Extract titles, text, links, and images with one click</p>
            </div>
          </div>

          {currentJob && (
            <div className="flex items-center gap-2">
              <a
                href={api.getExportUrl(currentJob.jobId, 'csv')}
                download
                className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition flex items-center gap-1.5"
              >
                <span>📥</span> Export CSV
              </a>
              <a
                href={api.getExportUrl(currentJob.jobId, 'json')}
                download
                className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition flex items-center gap-1.5"
              >
                <span>📄</span> Export JSON
              </a>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* URL Input Form Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <form onSubmit={handleStartCrawl} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-base">
                  🌐
                </span>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm font-medium transition"
                  disabled={loading}
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="w-28">
                  <label className="block text-[11px] text-slate-400 font-medium mb-1">Max Pages</label>
                  <select
                    value={maxPages}
                    onChange={(e) => setMaxPages(Number(e.target.value))}
                    disabled={loading}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value={10}>10 pages</option>
                    <option value={20}>20 pages</option>
                    <option value={50}>50 pages</option>
                    <option value={100}>100 pages</option>
                  </select>
                </div>

                <div className="w-24">
                  <label className="block text-[11px] text-slate-400 font-medium mb-1">Max Depth</label>
                  <select
                    value={maxDepth}
                    onChange={(e) => setMaxDepth(Number(e.target.value))}
                    disabled={loading}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value={1}>1 (shallow)</option>
                    <option value={2}>2 (standard)</option>
                    <option value={3}>3 (deep)</option>
                  </select>
                </div>

                <div className="pt-5">
                  {loading ? (
                    <button
                      type="button"
                      onClick={handleStopCrawl}
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition flex items-center gap-2 shadow-lg shadow-red-600/20"
                    >
                      <span className="animate-spin text-xs">⏳</span> Stop
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded-xl transition flex items-center gap-2 shadow-lg shadow-cyan-600/20"
                    >
                      <span>🚀</span> Start Crawl
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
              <span className="text-slate-500 font-medium">Quick Presets:</span>
              {['https://example.com', 'https://books.toscrape.com', 'https://news.ycombinator.com'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setUrl(preset)}
                  disabled={loading}
                  className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-[11px]"
                >
                  {preset.replace('https://', '')}
                </button>
              ))}
            </div>

            {error && (
              <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}
          </form>
        </div>

        {/* Crawl Status & Metrics Bar */}
        {currentJob && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-3">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                    currentJob.status === 'RUNNING'
                      ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                      : currentJob.status === 'COMPLETED'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : currentJob.status === 'STOPPED'
                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                      : 'bg-red-950 text-red-400 border border-red-800'
                  }`}
                >
                  {currentJob.status === 'RUNNING' && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
                  )}
                  {currentJob.status}
                </span>
                <span className="text-slate-400 text-xs">
                  Target: <span className="text-slate-200 font-medium">{currentJob.startUrl}</span>
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-500">Pages Crawled:</span>{' '}
                  <span className="text-cyan-400 font-bold">{currentJob.pagesCrawled}</span> / {currentJob.maxPages}
                </div>
                <div>
                  <span className="text-slate-500">Links Discovered:</span>{' '}
                  <span className="text-purple-400 font-bold">{currentJob.discoveredUrlsCount}</span>
                </div>
                <div>
                  <span className="text-slate-500">Elapsed:</span>{' '}
                  <span className="text-slate-300 font-medium">
                    {((currentJob.durationMillis || (Date.now() - currentJob.startTime)) / 1000).toFixed(1)}s
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-300 ${
                  currentJob.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-cyan-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Crawled Pages Results */}
        {currentJob && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Crawled Data
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  {filteredPages.length} {filteredPages.length === 1 ? 'Page' : 'Pages'}
                </span>
              </h2>

              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by title or URL..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500 text-xs">
                  🔍
                </span>
              </div>
            </div>

            {filteredPages.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
                <div className="text-3xl">🕸️</div>
                <div className="text-sm font-medium text-slate-300">No matching pages found</div>
                <div className="text-xs text-slate-500">
                  {currentJob.status === 'RUNNING'
                    ? 'Pages will appear here as they are discovered and fetched...'
                    : 'Try crawling a different website or clearing your search filter.'}
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-4 w-12 text-center">#</th>
                        <th className="py-3 px-4">Page Title & URL</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-3 text-center">Words</th>
                        <th className="py-3 px-3 text-center">Links</th>
                        <th className="py-3 px-3 text-center">Images</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredPages.map((page, idx) => (
                        <tr
                          key={page.url + idx}
                          className="hover:bg-slate-800/40 transition group cursor-pointer"
                          onClick={() => setSelectedPage(page)}
                        >
                          <td className="py-3 px-4 text-center text-slate-500 font-mono text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 max-w-md">
                            <div className="font-semibold text-slate-200 group-hover:text-cyan-400 transition truncate">
                              {page.title || 'Untitled Page'}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate flex items-center gap-1 font-mono">
                              <a
                                href={page.url}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="hover:underline text-cyan-500"
                              >
                                {page.url}
                              </a>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                                page.statusCode >= 200 && page.statusCode < 300
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : 'bg-amber-950 text-amber-400 border border-amber-800'
                              }`}
                            >
                              {page.statusCode}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center text-slate-300 font-mono">
                            {page.wordCount.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[11px]">
                              {page.links.length}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-purple-300 font-mono text-[11px]">
                              {page.images.length}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPage(page);
                              }}
                              className="px-3 py-1 bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 rounded-lg text-xs font-medium transition"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State when no job has been started */}
        {!currentJob && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <div className="text-4xl">🚀</div>
            <h3 className="text-base font-bold text-white">Ready to Crawl</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Enter any website URL above, pick your max pages limit, and click <strong>Start Crawl</strong>.
              The crawler will extract all page titles, headings, body text, outgoing links, and images.
            </p>
          </div>
        )}
      </main>

      {/* Page Data Inspector Modal */}
      {selectedPage && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPage(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-950/80">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                      selectedPage.statusCode >= 200 && selectedPage.statusCode < 300
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    HTTP {selectedPage.statusCode}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {selectedPage.wordCount} words
                  </span>
                </div>
                <h3 className="text-base font-bold text-white truncate">
                  {selectedPage.title || 'Untitled Page'}
                </h3>
                <a
                  href={selectedPage.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-cyan-400 hover:underline font-mono truncate block mt-0.5"
                >
                  {selectedPage.url}
                </a>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPage(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Headings */}
              {selectedPage.headings && selectedPage.headings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <span>📌</span> Headings ({selectedPage.headings.length})
                  </h4>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1.5 max-h-40 overflow-y-auto">
                    {selectedPage.headings.map((h, i) => (
                      <div key={i} className="text-slate-300 font-mono text-[11px] leading-relaxed">
                        {h}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Text Content */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <span>📝</span> Extracted Text Content
                </h4>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-300 font-sans text-xs leading-relaxed max-h-56 overflow-y-auto whitespace-pre-line">
                  {selectedPage.textContent || 'No text extracted.'}
                </div>
              </div>

              {/* Discovered Outgoing Links */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <span>🔗</span> Outgoing Links ({selectedPage.links.length})
                </h4>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 max-h-40 overflow-y-auto divide-y divide-slate-900">
                  {selectedPage.links.length === 0 ? (
                    <div className="text-slate-500 text-[11px]">No outgoing links found on this page.</div>
                  ) : (
                    selectedPage.links.map((link, i) => (
                      <div key={i} className="py-1 text-slate-400 font-mono text-[11px] truncate">
                        <a href={link} target="_blank" rel="noreferrer" className="hover:text-cyan-400 hover:underline">
                          {link}
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Discovered Images */}
              {selectedPage.images && selectedPage.images.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <span>🖼️</span> Images ({selectedPage.images.length})
                  </h4>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 max-h-36 overflow-y-auto space-y-1">
                    {selectedPage.images.map((img, i) => (
                      <div key={i} className="text-slate-400 font-mono text-[11px] truncate">
                        <a href={img} target="_blank" rel="noreferrer" className="hover:text-purple-400 hover:underline">
                          {img}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPage(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
