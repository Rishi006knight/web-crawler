import React, { memo } from 'react';
import { ExternalLink, Eye, CheckSquare, Square, FileText, Globe } from 'lucide-react';
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
        <mark key={i} className="bg-amber-500/20 text-amber-600 dark:text-amber-300 font-semibold px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="space-y-3 sm:hidden" role="feed" aria-label="Crawled Pages Feed">
      {pages.map((page) => {
        const isSelected = selectedPages.has(page.url);
        return (
          <div
            key={page.url}
            className={`p-4 rounded-xl border transition space-y-2.5 bg-white dark:bg-slate-900 shadow-sm ${
              isSelected ? 'border-sky-500/50 bg-sky-500/5' : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            {/* Header: Title, Status, Selection */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center space-x-2 truncate">
                <button
                  type="button"
                  onClick={() => onToggleSelectPage(page.url)}
                  aria-label={`Select ${page.title}`}
                  className="p-1 rounded text-slate-400 focus-ring"
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-sky-500" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
                <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                  {highlightMatch(page.title || 'Untitled Page', searchQuery)}
                </div>
              </div>

              <span
                className={`px-2 py-0.5 text-xs font-mono font-bold rounded-full border flex-shrink-0 ${
                  page.statusCode < 300
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : page.statusCode < 400
                    ? 'bg-sky-500/10 text-sky-500 border-sky-500/20'
                    : 'bg-red-500/10 text-red-500 border-red-500/20'
                }`}
              >
                {page.statusCode}
              </span>
            </div>

            {/* URL */}
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{highlightMatch(page.url, searchQuery)}</span>
              <a
                href={page.url}
                target="_blank"
                rel="noreferrer"
                aria-label={`Open external link to ${page.url}`}
                className="text-slate-400 hover:text-sky-500 p-0.5 flex-shrink-0"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Stats row & Action */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
              <div className="flex items-center space-x-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                <span>{(page.wordCount || 0).toLocaleString()} words</span>
                <span>{page.links?.length || 0} links</span>
                <span>{page.images?.length || 0} imgs</span>
              </div>

              <button
                type="button"
                onClick={() => onSelectPage(page)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 font-medium text-xs focus-ring"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Inspect</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
});
