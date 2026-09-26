import React, { useState, useMemo } from 'react';
import {
  Search,
  Sparkles,
  ImageIcon,
  FileText,
  ExternalLink,
  Copy,
  Check,
  Download,
  Filter,
  Layers,
  Maximize2,
  X,
  XCircle,
  Tag,
  ArrowRight
} from 'lucide-react';
import { PageData, CrawlJob } from '../../../types';
import {
  searchCrawledContent,
  SearchMatchResult,
  MatchedMediaItem,
  SnippetHighlight
} from '../../../lib/contentSearch';

interface SearchMediaTabProps {
  job: CrawlJob;
  initialQuery?: string;
  onSelectPage: (page: PageData) => void;
}

type ViewMode = 'content' | 'media';
type FilterType = 'all' | 'direct_media' | 'headings_only' | 'high_relevance';

export function SearchMediaTab({ job, initialQuery = '', onSelectPage }: SearchMediaTabProps) {
  const [query, setQuery] = useState(initialQuery || job.searchQuery || '');
  const [viewMode, setViewMode] = useState<ViewMode>('content');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [previewMedia, setPreviewMedia] = useState<MatchedMediaItem | null>(null);
  const [copiedSnippetIndex, setCopiedSnippetIndex] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Compute search analysis across job pages
  const analysis = useMemo(() => {
    return searchCrawledContent(job.pages || [], query);
  }, [job.pages, query]);

  // Filter content results
  const filteredResults = useMemo(() => {
    let list = analysis.results;
    if (filterType === 'direct_media') {
      list = list.filter((r) => r.directMedia.length > 0);
    } else if (filterType === 'headings_only') {
      list = list.filter((r) => r.matchedHeadings.length > 0);
    } else if (filterType === 'high_relevance') {
      list = list.filter((r) => r.score >= 15);
    }
    return list;
  }, [analysis.results, filterType]);

  // Filter media gallery
  const filteredMedia = useMemo(() => {
    let list = analysis.allRelatedMedia;
    if (filterType === 'direct_media') {
      list = list.filter((m) => m.isDirectMatch);
    }
    return list;
  }, [analysis.allRelatedMedia, filterType]);

  const handleCopySnippets = (result: SearchMatchResult, index: number) => {
    const text = result.snippets.map((s) => `${s.prefix}${s.match}${s.suffix}`).join('\n\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSnippetIndex(`card-${index}`);
      setTimeout(() => setCopiedSnippetIndex(null), 2000);
    });
  };

  const handleExportJson = () => {
    const payload = {
      query: analysis.query,
      timestamp: new Date().toISOString(),
      targetUrl: job.startUrl,
      totalMatches: analysis.totalOccurrences,
      matchedPagesCount: analysis.matchedPagesCount,
      relatedMediaCount: analysis.allRelatedMedia.length,
      pages: analysis.results.map((r) => ({
        url: r.page.url,
        title: r.page.title,
        score: r.score,
        totalMatches: r.totalMatches,
        matchedHeadings: r.matchedHeadings,
        snippets: r.snippets.map((s) => `${s.prefix}${s.match}${s.suffix}`),
        matchedImages: r.directMedia.map((m) => ({ url: m.url, alt: m.alt, reason: m.matchReason }))
      })),
      allRelatedMedia: analysis.allRelatedMedia
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search-${query ? query.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'results'}-${job.jobId.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = () => {
    const summary = [
      `Search Query: "${analysis.query}"`,
      `Target Site: ${job.startUrl}`,
      `Total Matches Found: ${analysis.totalOccurrences} across ${analysis.matchedPagesCount} pages`,
      `Related Media Discovered: ${analysis.allRelatedMedia.length} images`,
      '',
      ...analysis.results.slice(0, 5).map((r, i) =>
        `${i + 1}. ${r.page.title || 'Untitled'} (${r.totalMatches} matches)\n   ${r.page.url}\n   Snippet: ${r.snippets[0] ? `${r.snippets[0].prefix}${r.snippets[0].match}${r.snippets[0].suffix}` : 'No snippet'}`
      )
    ].join('\n');

    navigator.clipboard.writeText(summary).then(() => {
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    });
  };

  return (
    <div className="space-y-6 animate-slide-up text-left">
      {/* ═══ Top Search Command & Control Panel ═══ */}
      <div className="p-6 sm:p-7 rounded-3xl glass-panel space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-ink-strong flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-gradient-start" />
              <span>Keyword & Content Explorer</span>
            </h3>
            <p className="text-xs text-ink-secondary">
              Search across crawled text content, headings, metadata, and media.
            </p>
          </div>

          {/* Quick Action Buttons */}
          {analysis.matchedPagesCount > 0 && (
            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={handleCopySummary}
                className="px-3 py-2 rounded-xl glass emboss text-xs font-semibold text-ink hover:text-ink-strong flex items-center space-x-1.5 transition-all duration-200"
              >
                {copiedSummary ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5 text-ink-muted" />}
                <span>{copiedSummary ? 'Copied' : 'Copy Summary'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportJson}
                className="px-3.5 py-2 rounded-xl gradient-accent text-white text-xs font-semibold flex items-center space-x-1.5 shadow-glow-sm hover:brightness-105 active:scale-95 transition-all duration-200"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Matches</span>
              </button>
            </div>
          )}
        </div>

        {/* ═══ Main Search Bar ═══ */}
        <div className="relative">
          <div className="absolute left-4 top-3.5 text-ink-muted">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search in page content, headings, or media..."
            className="w-full pl-12 pr-12 py-3.5 text-sm rounded-2xl bg-surface-raised border border-line text-ink-strong placeholder:text-ink-muted focus-ring emboss transition-all duration-200 shadow-soft focus:shadow-glow-sm"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-4 top-3.5 text-ink-muted hover:text-ink transition"
              aria-label="Clear query"
            >
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* ═══ Keyword Suggestions Pills ═══ */}
        {analysis.suggestedKeywords.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted flex items-center space-x-1">
              <Tag className="w-3 h-3" />
              <span>Page Keywords:</span>
            </span>
            {analysis.suggestedKeywords.map((kw) => (
              <button
                key={kw}
                type="button"
                onClick={() => setQuery(kw)}
                className={`px-3 py-1 rounded-xl text-xs font-medium transition-all duration-200 emboss ${
                  query.toLowerCase() === kw.toLowerCase()
                    ? 'gradient-accent text-white shadow-glow-sm'
                    : 'glass text-ink-secondary hover:text-ink-strong hover:shadow-glow-sm'
                }`}
              >
                {kw}
              </button>
            ))}
          </div>
        )}

        {/* ═══ View Mode & Filter Controls Bar ═══ */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-line/60">
          {/* Mode Switch Tabs */}
          <div className="flex items-center space-x-1.5 p-1 rounded-2xl bg-surface-sunken border border-line">
            <button
              type="button"
              onClick={() => setViewMode('content')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
                viewMode === 'content'
                  ? 'bg-surface-raised text-ink-strong shadow-soft'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Matched Content</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-sunken font-mono">
                {filteredResults.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('media')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
                viewMode === 'media'
                  ? 'bg-surface-raised text-ink-strong shadow-soft'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Related Media & Images</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-sunken font-mono">
                {filteredMedia.length}
              </span>
            </button>
          </div>

          {/* Quick Filter Selectors */}
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-ink-muted hidden sm:inline text-[11px] font-medium mr-1 flex items-center">
              <Filter className="w-3 h-3 mr-1" /> Filter:
            </span>
            {[
              { id: 'all', label: 'All' },
              { id: 'direct_media', label: 'With Images' },
              { id: 'headings_only', label: 'Headings Match' },
              { id: 'high_relevance', label: 'Top Relevance' }
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterType(f.id as FilterType)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all ${
                  filterType === f.id
                    ? 'bg-ink-strong text-white dark:bg-white dark:text-ink-strong font-semibold shadow-soft'
                    : 'glass text-ink-muted hover:text-ink'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ Stats Highlights Banner (When Search is Active) ═══ */}
      {query.trim() && (
        <div className="p-4 rounded-2xl glass emboss border border-line flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-gradient-start animate-pulse" />
            <span className="text-ink-secondary">
              Search results for <strong className="text-ink-strong">&ldquo;{query}&rdquo;</strong>:
            </span>
            <span className="px-2 py-0.5 rounded-full bg-surface-sunken font-mono font-bold text-ink-strong">
              {analysis.totalOccurrences} occurrences
            </span>
            <span className="text-ink-muted">•</span>
            <span className="text-ink-secondary">
              across <strong className="text-ink-strong">{analysis.matchedPagesCount}</strong> pages
            </span>
            {analysis.allRelatedMedia.length > 0 && (
              <>
                <span className="text-ink-muted">•</span>
                <span className="text-ink-secondary">
                  <strong className="gradient-accent-text">{analysis.allRelatedMedia.length}</strong> related images
                </span>
              </>
            )}
          </div>

          <div className="text-ink-muted text-[11px] flex items-center space-x-1">
            <span>Sorted by keyword relevance & context</span>
          </div>
        </div>
      )}

      {/* ═══ Empty / Prompt States ═══ */}
      {!query.trim() && (
        <div className="p-12 text-center rounded-3xl glass-panel space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl gradient-accent flex items-center justify-center text-white shadow-glow">
            <Search className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h4 className="text-base font-bold text-ink-strong">Search Crawled Content & Media</h4>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Enter any word or phrase to surface matching snippets, headings, and related images.
            </p>
          </div>
          {analysis.suggestedKeywords.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {analysis.suggestedKeywords.slice(0, 4).map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => setQuery(kw)}
                  className="px-3.5 py-1.5 rounded-xl glass emboss text-xs font-semibold text-ink hover:text-ink-strong hover:shadow-glow-sm transition"
                >
                  Search &ldquo;{kw}&rdquo; →
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {query.trim() && filteredResults.length === 0 && viewMode === 'content' && (
        <div className="p-10 text-center rounded-3xl glass-panel space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-surface-sunken flex items-center justify-center text-ink-muted">
            <Search className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-ink-strong">No matches found for &ldquo;{query}&rdquo;</h4>
          <p className="text-xs text-ink-secondary max-w-sm mx-auto">
            Try checking for typos or searching a broader term.
          </p>
          <button
            type="button"
            onClick={() => setQuery('')}
            className="text-xs gradient-accent-text hover:underline font-semibold"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* ═══ VIEW 1: Matched Content & Snippets ═══ */}
      {query.trim() && viewMode === 'content' && filteredResults.length > 0 && (
        <div className="space-y-4">
          {filteredResults.map((result, idx) => (
            <div
              key={result.page.url}
              className="p-5 sm:p-6 rounded-3xl bg-surface-raised border border-line shadow-soft hover:shadow-floating hover:border-line-strong transition-all duration-300 space-y-4 stagger-item"
              style={{ animationDelay: `${Math.min(idx, 8) * 40}ms` }}
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full ${
                        result.page.statusCode < 300
                          ? 'bg-status-success-bg text-status-success'
                          : 'bg-status-danger-bg text-status-danger'
                      }`}
                    >
                      {result.page.statusCode}
                    </span>

                    <span className="px-2.5 py-0.5 text-[10px] font-mono font-semibold rounded-full gradient-accent text-white shadow-glow-sm">
                      {result.totalMatches} {result.totalMatches === 1 ? 'match' : 'matches'}
                    </span>

                    {result.score >= 20 && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        ⭐ High Relevance
                      </span>
                    )}

                    <span className="text-[11px] text-ink-muted font-mono">
                      {result.page.wordCount} words
                    </span>
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-ink-strong hover:text-gradient-start transition truncate">
                    {result.page.title || 'Untitled Page'}
                  </h4>

                  <a
                    href={result.page.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-mono text-ink-muted hover:text-gradient-start flex items-center space-x-1 truncate max-w-xl transition"
                  >
                    <span className="truncate">{result.page.url}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>

                {/* Card Top Actions */}
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopySnippets(result, idx)}
                    title="Copy all snippets from this page"
                    className="p-2 rounded-xl glass emboss text-ink-secondary hover:text-ink-strong transition"
                  >
                    {copiedSnippetIndex === `card-${idx}` ? (
                      <Check className="w-4 h-4 text-status-success" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectPage(result.page)}
                    className="px-3 py-1.5 rounded-xl glass emboss text-xs font-semibold text-ink-strong hover:shadow-glow-sm flex items-center space-x-1.5 transition"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Matched Headings Pills */}
              {result.matchedHeadings.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                    Matching Headings:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {result.matchedHeadings.map((h, hIdx) => (
                      <span
                        key={hIdx}
                        className="px-2.5 py-1 rounded-xl bg-surface-sunken border border-line text-[11px] font-medium text-ink-strong flex items-center space-x-1"
                      >
                        <Layers className="w-3 h-3 text-gradient-start shrink-0" />
                        <span>{h}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Contextual Snippets Box */}
              {result.snippets.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                    Contextual Snippets ({result.snippets.length}):
                  </span>
                  <div className="space-y-2">
                    {result.snippets.map((snip, sIdx) => (
                      <div
                        key={sIdx}
                        className="p-3 rounded-2xl bg-surface-sunken border border-line text-xs text-ink leading-relaxed font-sans"
                      >
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-surface-raised border border-line/60 text-ink-muted mr-2">
                          {snip.location}
                        </span>
                        <span>{snip.prefix}</span>
                        <mark className="bg-amber-400/25 text-amber-900 dark:text-amber-200 px-1 py-0.5 rounded border border-amber-500/30 font-bold mx-0.5">
                          {snip.match}
                        </mark>
                        <span>{snip.suffix}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inline Thumbnails of Related Media for This Page */}
              {result.allPageMedia.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-line/50">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-ink-muted flex items-center space-x-1">
                      <ImageIcon className="w-3.5 h-3.5 text-gradient-start" />
                      <span>Images on this page ({result.allPageMedia.length})</span>
                    </span>
                    {result.directMedia.length > 0 && (
                      <span className="text-[10px] gradient-accent-text font-semibold">
                        ⭐ {result.directMedia.length} direct keyword match
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                    {result.allPageMedia.slice(0, 8).map((media) => (
                      <button
                        key={media.id}
                        type="button"
                        onClick={() => setPreviewMedia(media)}
                        className={`relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border transition-all duration-200 group bg-surface-sunken ${
                          media.isDirectMatch
                            ? 'border-amber-500 shadow-glow-sm ring-2 ring-amber-500/20'
                            : 'border-line hover:border-line-strong'
                        }`}
                      >
                        <img
                          src={media.url}
                          alt={media.alt || 'Page media'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        {media.isDirectMatch && (
                          <div className="absolute top-1 right-1 px-1 py-0.2 text-[8px] font-bold rounded bg-amber-500 text-white shadow-soft">
                            MATCH
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <Maximize2 className="w-4 h-4" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ═══ VIEW 2: Related Media & Images Gallery ═══ */}
      {query.trim() && viewMode === 'media' && (
        <div className="space-y-4">
          {filteredMedia.length === 0 ? (
            <div className="p-10 text-center rounded-3xl glass-panel space-y-2">
              <ImageIcon className="w-8 h-8 mx-auto text-ink-muted" />
              <p className="text-xs text-ink-secondary">
                No images matched the query &ldquo;{query}&rdquo;
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {filteredMedia.map((media, mIdx) => (
                <div
                  key={media.id}
                  className={`rounded-2xl bg-surface-raised border overflow-hidden flex flex-col shadow-soft hover:shadow-floating transition-all duration-300 group stagger-item ${
                    media.isDirectMatch
                      ? 'border-amber-500/60 ring-2 ring-amber-500/20'
                      : 'border-line hover:border-line-strong'
                  }`}
                  style={{ animationDelay: `${Math.min(mIdx, 12) * 30}ms` }}
                >
                  {/* Thumbnail Container */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setPreviewMedia(media)}
                    className="relative aspect-square bg-surface-sunken overflow-hidden cursor-pointer"
                  >
                    <img
                      src={media.url}
                      alt={media.alt || 'Media thumbnail'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />

                    {/* Badge */}
                    <div className="absolute top-2 left-2">
                      {media.isDirectMatch ? (
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-amber-500 text-white shadow-soft flex items-center space-x-1">
                          <span>⭐ Match</span>
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 text-[9px] font-medium rounded-full bg-black/60 backdrop-blur-md text-white">
                          Context
                        </span>
                      )}
                    </div>

                    {/* Hover Zoom Icon */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                      <Maximize2 className="w-5 h-5 drop-shadow" />
                    </div>
                  </div>

                  {/* Metadata & Source Footer */}
                  <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between text-xs">
                    <div>
                      <p className="font-semibold text-ink-strong line-clamp-2 text-[11px] leading-tight" title={media.alt || media.title || media.url}>
                        {media.alt || media.title || 'Extracted Image'}
                      </p>
                      {media.matchReason && (
                        <p className="text-[10px] text-ink-muted line-clamp-1 mt-0.5">
                          {media.matchReason}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-line/60 flex items-center justify-between">
                      <a
                        href={media.sourcePageUrl}
                        target="_blank"
                        rel="noreferrer"
                        title={media.sourcePageTitle}
                        className="text-[10px] font-mono text-ink-muted hover:text-gradient-start truncate max-w-[100px] transition"
                      >
                        {media.sourcePageTitle || 'Source Page'}
                      </a>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(media.url);
                        }}
                        title="Copy Image URL"
                        className="p-1 rounded-lg text-ink-muted hover:text-ink transition"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ Media Zoom / Inspector Modal ═══ */}
      {previewMedia && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade"
          onClick={() => setPreviewMedia(null)}
        >
          <div
            className="bg-surface-raised border border-line rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-floating animate-modal text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface-raised">
              <div className="flex items-center space-x-2 truncate mr-3">
                <ImageIcon className="w-4 h-4 text-gradient-start shrink-0" />
                <span className="text-xs font-bold text-ink-strong truncate">
                  {previewMedia.alt || previewMedia.title || 'Image Preview'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewMedia(null)}
                className="p-1.5 rounded-full hover:bg-surface-sunken text-ink-muted hover:text-ink transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Image Stage */}
            <div className="p-6 bg-surface-sunken flex items-center justify-center max-h-[55vh] overflow-hidden">
              <img
                src={previewMedia.url}
                alt={previewMedia.alt || 'Full size preview'}
                className="max-w-full max-h-[50vh] object-contain rounded-xl shadow-soft"
              />
            </div>

            {/* Details Footer */}
            <div className="p-6 space-y-3 bg-surface-raised border-t border-line text-xs">
              {previewMedia.alt && (
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Alt Description:</span>
                  <p className="text-xs text-ink-strong font-medium mt-0.5">{previewMedia.alt}</p>
                </div>
              )}

              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Found On Page:</span>
                <p className="text-xs text-ink truncate mt-0.5">
                  <a
                    href={previewMedia.sourcePageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="gradient-accent-text hover:underline font-semibold"
                  >
                    {previewMedia.sourcePageTitle} ({previewMedia.sourcePageUrl})
                  </a>
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] text-ink-muted truncate">
                  {previewMedia.url}
                </span>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(previewMedia.url);
                    }}
                    className="px-3 py-1.5 rounded-xl glass emboss font-semibold text-xs text-ink hover:text-ink-strong flex items-center space-x-1 transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy URL</span>
                  </button>

                  <a
                    href={previewMedia.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl gradient-accent text-white font-semibold text-xs flex items-center space-x-1 shadow-glow-sm transition"
                  >
                    <span>Open Full Size</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
