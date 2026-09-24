import React, { useState, useMemo, memo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, Eye, CheckSquare, Square } from 'lucide-react';
import { PageData } from '../../types';

interface ResultsTableProps {
  pages: PageData[];
  onSelectPage: (page: PageData) => void;
  selectedPages: Set<string>;
  onToggleSelectPage: (url: string) => void;
  onToggleSelectAll: () => void;
  searchQuery: string;
}

type SortField = 'url' | 'title' | 'statusCode' | 'wordCount' | 'links' | 'images' | 'crawlTimestamp';
type SortOrder = 'asc' | 'desc';

export const ResultsTable = memo(function ResultsTable({
  pages,
  onSelectPage,
  selectedPages,
  onToggleSelectPage,
  onToggleSelectAll,
  searchQuery
}: ResultsTableProps) {
  const [sortField, setSortField] = useState<SortField>('crawlTimestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedPages = useMemo(() => {
    return [...pages].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'links') {
        aVal = a.links?.length || 0;
        bVal = b.links?.length || 0;
      } else if (sortField === 'images') {
        aVal = a.images?.length || 0;
        bVal = b.images?.length || 0;
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [pages, sortField, sortOrder]);

  const allSelected = pages.length > 0 && selectedPages.size === pages.length;

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-sky-500" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-sky-500" />
    );
  };

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
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <caption className="sr-only">Web Crawler Discovered Pages Table</caption>
          <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 select-none">
            <tr>
              <th scope="col" className="p-3 w-10 text-center">
                <button
                  type="button"
                  onClick={onToggleSelectAll}
                  aria-label={allSelected ? 'Deselect all rows' : 'Select all rows'}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus-ring"
                >
                  {allSelected ? (
                    <CheckSquare className="w-4 h-4 text-sky-500" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>

              <th
                scope="col"
                aria-sort={sortField === 'title' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                className="p-3 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer group"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center space-x-1.5">
                  <span>Page Title & URL</span>
                  {renderSortIndicator('title')}
                </div>
              </th>

              <th
                scope="col"
                aria-sort={sortField === 'statusCode' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                className="p-3 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer group w-20 text-center"
                onClick={() => handleSort('statusCode')}
              >
                <div className="flex items-center justify-center space-x-1.5">
                  <span>Status</span>
                  {renderSortIndicator('statusCode')}
                </div>
              </th>

              <th
                scope="col"
                aria-sort={sortField === 'wordCount' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                className="p-3 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer group w-24 text-right"
                onClick={() => handleSort('wordCount')}
              >
                <div className="flex items-center justify-end space-x-1.5">
                  <span>Words</span>
                  {renderSortIndicator('wordCount')}
                </div>
              </th>

              <th
                scope="col"
                aria-sort={sortField === 'links' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                className="p-3 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer group w-20 text-center"
                onClick={() => handleSort('links')}
              >
                <div className="flex items-center justify-center space-x-1.5">
                  <span>Links</span>
                  {renderSortIndicator('links')}
                </div>
              </th>

              <th
                scope="col"
                aria-sort={sortField === 'images' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                className="p-3 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer group w-20 text-center"
                onClick={() => handleSort('images')}
              >
                <div className="flex items-center justify-center space-x-1.5">
                  <span>Images</span>
                  {renderSortIndicator('images')}
                </div>
              </th>

              <th scope="col" className="p-3 w-20 text-center">
                <span className="sr-only">Actions</span>
                <span>Action</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {sortedPages.map((page) => {
              const isSelected = selectedPages.has(page.url);
              return (
                <tr
                  key={page.url}
                  className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition cursor-pointer ${
                    isSelected ? 'bg-sky-500/5' : ''
                  }`}
                  onClick={() => onSelectPage(page)}
                >
                  <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onToggleSelectPage(page.url)}
                      aria-label={`Select row for ${page.title}`}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus-ring"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-sky-500" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </td>

                  <td className="p-3 max-w-sm sm:max-w-md truncate">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {highlightMatch(page.title || 'Untitled Page', searchQuery)}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5 flex items-center space-x-1">
                      <span className="truncate">{highlightMatch(page.url, searchQuery)}</span>
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Open ${page.url} in new tab`}
                        className="text-slate-400 hover:text-sky-500 inline-flex flex-shrink-0"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </td>

                  <td className="p-3 text-center">
                    <span
                      className={`inline-flex px-2 py-0.5 text-[11px] font-mono font-semibold rounded-full border ${
                        page.statusCode < 300
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : page.statusCode < 400
                          ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                      }`}
                    >
                      {page.statusCode}
                    </span>
                  </td>

                  <td className="p-3 text-right font-mono text-slate-700 dark:text-slate-300">
                    {(page.wordCount || 0).toLocaleString()}
                  </td>

                  <td className="p-3 text-center font-mono text-slate-500 dark:text-slate-400">
                    {page.links ? page.links.length : 0}
                  </td>

                  <td className="p-3 text-center font-mono text-slate-500 dark:text-slate-400">
                    {page.images ? page.images.length : 0}
                  </td>

                  <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onSelectPage(page)}
                      aria-label={`Inspect ${page.title}`}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 focus-ring transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});
