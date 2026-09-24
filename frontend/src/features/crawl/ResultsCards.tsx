import React, { memo } from 'react';
import { ExternalLink, Eye, CheckSquare, Square, Globe } from 'lucide-react';
import { PageData } from '../../types';

interface ResultsCardsProps {
  pages: PageData[];
  onSelectPage: (page: PageData) => void;
  selectedPages: Set<string>;
  onToggleSelectPage: (url: string) => void;
  searchQuery: string;
}

export const ResultsCards = memo(function ResultsCards({
  pages,
  onSelectPage,
  selectedPages,
  onToggleSelectPage,
  searchQuery
}: ResultsCardsProps) {
  const highlightMatch = (text: string, query: string) => {
    if (!query || !query.trim() || !text) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-gradient-to-r from-gradient-start/20 to-gradient-end/20 text-ink-strong font-semibold px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="space-y-3 sm:hidden" role="feed" aria-label="Crawled Pages Feed">
      {pages.map((page, i) => {
        const isSelected = selectedPages.has(page.url);
        return (
          <div
            key={page.url}
            className={`p-4 rounded-2xl glass-panel transition-all duration-200 space-y-3 stagger-item animate-slide-up hover:-translate-y-0.5 hover:shadow-floating ${
              isSelected ? 'ring-2 ring-gradient-start/40' : ''
            }`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            {/* Header: Title, Status, Selection */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center space-x-2 truncate">
                <button
                  type="button"
                  onClick={() => onToggleSelectPage(page.url)}
                  aria-label={`Select ${page.title}`}
                  className="p-1 rounded-lg text-ink-muted hover:text-ink focus-ring transition"
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-gradient-start" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
                <div className="font-semibold text-sm text-ink-strong truncate">
                  {highlightMatch(page.title || 'Untitled Page', searchQuery)}
                </div>
              </div>

              <span
                className={`px-2.5 py-0.5 text-xs font-mono font-bold rounded-full shrink-0 ${
                  page.statusCode < 300
                    ? 'bg-status-success-bg text-status-success'
                    : page.statusCode < 400
                    ? 'bg-status-info-bg text-status-info'
                    : 'bg-status-danger-bg text-status-danger'
                }`}
              >
                {page.statusCode}
              </span>
            </div>

            {/* URL */}
            <div className="text-xs text-ink-secondary font-mono truncate flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5 text-ink-muted shrink-0" />
              <span className="truncate">{highlightMatch(page.url, searchQuery)}</span>
              <a
                href={page.url}
                target="_blank"
                rel="noreferrer"
                aria-label={`Open external link to ${page.url}`}
                className="text-ink-muted hover:text-gradient-start p-0.5 shrink-0 transition"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Stats row & Action */}
            <div className="flex items-center justify-between pt-3 border-t border-line text-xs">
              <div className="flex items-center space-x-3 text-ink-muted font-mono text-[11px]">
                <span>{(page.wordCount || 0).toLocaleString()} words</span>
                <span>{page.links?.length || 0} links</span>
                <span>{page.images?.length || 0} imgs</span>
              </div>

              <button
                type="button"
                onClick={() => onSelectPage(page)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl glass emboss font-medium text-xs text-ink hover:text-ink-strong focus-ring transition-all duration-200 hover:shadow-glow-sm active:shadow-pressed active:scale-[0.98]"
              >
                <Eye className="w-3.5 h-3.5 text-gradient-start" />
                <span>Inspect</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
});
