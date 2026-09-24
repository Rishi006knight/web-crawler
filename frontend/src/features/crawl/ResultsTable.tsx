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
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-30 group-hover:opacity-80 transition" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-gradient-start" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-gradient-start" />
    );
  };

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
    <div className="w-full overflow-hidden rounded-3xl glass-panel animate-fade">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <caption className="sr-only">Web Crawler Discovered Pages Table</caption>
          <thead className="bg-surface-sunken border-b border-line sticky top-0 z-10 select-none">
            <tr>
              <th scope="col" className="p-3.5 w-10 text-center">
                <button
                  type="button"
                  onClick={onToggleSelectAll}
                  aria-label={allSelected ? 'Deselect all rows' : 'Select all rows'}
                  className="p-1 rounded-lg text-ink-muted hover:text-ink focus-ring transition"
                >
                  {allSelected ? (
                    <CheckSquare className="w-4 h-4 text-gradient-start" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>

              {[
                { field: 'title' as SortField, label: 'Page Title & URL', align: 'text-left' },
                { field: 'statusCode' as SortField, label: 'Status', align: 'text-center', w: 'w-20' },
                { field: 'wordCount' as SortField, label: 'Words', align: 'text-right', w: 'w-24' },
                { field: 'links' as SortField, label: 'Links', align: 'text-center', w: 'w-20' },
                { field: 'images' as SortField, label: 'Images', align: 'text-center', w: 'w-20' },
              ].map((col) => (
                <th
                  key={col.field}
                  scope="col"
                  aria-sort={sortField === col.field ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                  className={`p-3.5 font-semibold text-ink-strong cursor-pointer group ${col.align} ${col.w || ''}`}
                  onClick={() => handleSort(col.field)}
                >
                  <div className={`flex items-center space-x-1.5 ${col.align === 'text-right' ? 'justify-end' : col.align === 'text-center' ? 'justify-center' : ''}`}>
                    <span>{col.label}</span>
                    {renderSortIndicator(col.field)}
                  </div>
                </th>
              ))}

              <th scope="col" className="p-3.5 w-24 text-center">
                <span className="text-ink-strong font-semibold">Action</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-line">
            {sortedPages.map((page, i) => {
              const isSelected = selectedPages.has(page.url);
              return (
                <tr
                  key={page.url}
                  className={`hover:bg-surface-sunken transition-all duration-150 cursor-pointer ${
                    isSelected ? 'bg-brand-subtle' : ''
                  }`}
                  onClick={() => onSelectPage(page)}
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onToggleSelectPage(page.url)}
                      aria-label={`Select row for ${page.title}`}
                      className="p-1 rounded-lg text-ink-muted hover:text-ink focus-ring transition"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-gradient-start" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </td>

                  <td className="p-3.5 max-w-sm sm:max-w-md truncate">
                    <div className="font-semibold text-ink-strong truncate">
                      {highlightMatch(page.title || 'Untitled Page', searchQuery)}
                    </div>
                    <div className="text-[11px] text-ink-muted font-mono truncate mt-0.5 flex items-center space-x-1">
                      <span className="truncate">{highlightMatch(page.url, searchQuery)}</span>
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Open ${page.url} in new tab`}
                        className="text-ink-muted hover:text-gradient-start inline-flex shrink-0 transition"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </td>

                  <td className="p-3.5 text-center">
                    <span
                      className={`inline-flex px-2.5 py-0.5 text-[11px] font-mono font-bold rounded-full ${
                        page.statusCode < 300
                          ? 'bg-status-success-bg text-status-success'
                          : page.statusCode < 400
                          ? 'bg-status-info-bg text-status-info'
                          : 'bg-status-danger-bg text-status-danger'
                      }`}
                    >
                      {page.statusCode}
                    </span>
                  </td>

                  <td className="p-3.5 text-right font-mono text-ink">
                    {(page.wordCount || 0).toLocaleString()}
                  </td>

                  <td className="p-3.5 text-center font-mono text-ink-secondary">
                    {page.links ? page.links.length : 0}
                  </td>

                  <td className="p-3.5 text-center font-mono text-ink-secondary">
                    {page.images ? page.images.length : 0}
                  </td>

                  <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onSelectPage(page)}
                      aria-label={`Inspect ${page.title}`}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium glass emboss text-ink hover:text-ink-strong focus-ring transition-all duration-200 hover:shadow-glow-sm active:shadow-pressed active:scale-[0.98]"
                    >
                      <Eye className="w-3.5 h-3.5 text-gradient-start" />
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
