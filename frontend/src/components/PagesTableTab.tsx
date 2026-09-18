import React, { useState } from 'react';
import { CrawlResult, PageInfo } from '../types';
import { Search, ExternalLink } from 'lucide-react';

interface PagesTableTabProps {
  job: CrawlResult;
  onSelectPage: (page: PageInfo) => void;
}

export const PagesTableTab: React.FC<PagesTableTabProps> = ({ job, onSelectPage }) => {
  const [query, setQuery] = useState('');
  const [hasEmailsOnly, setHasEmailsOnly] = useState(false);
  const [duplicatesOnly, setDuplicatesOnly] = useState(false);

  const pages = job.pageInfos || [];

  const filtered = pages.filter((p) => {
    if (hasEmailsOnly && (!p.emailsFound || p.emailsFound.length === 0)) return false;
    if (duplicatesOnly && !p.duplicate) return false;
    if (query) {
      const q = query.toLowerCase();
      const matchTitle = (p.title || '').toLowerCase().includes(q);
      const matchUrl = (p.url || '').toLowerCase().includes(q);
      const matchSnippet = (p.snippet || '').toLowerCase().includes(q);
      const matchH1 = (p.h1 || '').toLowerCase().includes(q);
      return matchTitle || matchUrl || matchSnippet || matchH1;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="glass-panel p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter pages by title, URL, H1, or snippet..."
              className="w-full glass-input pl-9 pr-3 py-1.5 text-xs text-slate-200 rounded-lg outline-none placeholder-slate-500"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2" />
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <label className="flex items-center space-x-1.5 cursor-pointer bg-space-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
            <input
              type="checkbox"
              checked={hasEmailsOnly}
              onChange={(e) => setHasEmailsOnly(e.target.checked)}
              className="rounded text-cyan-500 bg-space-900 border-slate-600"
            />
            <span className="text-slate-300">Has Emails</span>
          </label>
          <label className="flex items-center space-x-1.5 cursor-pointer bg-space-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
            <input
              type="checkbox"
              checked={duplicatesOnly}
              onChange={(e) => setDuplicatesOnly(e.target.checked)}
              className="rounded text-purple-500 bg-space-900 border-slate-600"
            />
            <span className="text-slate-300">Duplicates Only</span>
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-space-900/90 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Title & URL</th>
                <th className="py-3 px-3 text-center w-20">Words</th>
                <th className="py-3 px-3 text-center w-20">Images</th>
                <th className="py-3 px-3 text-center w-24">Links (In/Ex)</th>
                <th className="py-3 px-3 text-center w-24">Emails</th>
                <th className="py-3 px-3 text-center w-24">Status</th>
                <th className="py-3 px-4 text-right w-24">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 font-sans italic">
                    No pages matched your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((p, idx) => (
                  <tr
                    key={p.url + idx}
                    onClick={() => onSelectPage(p)}
                    className="hover:bg-space-900/60 transition group cursor-pointer"
                  >
                    <td className="py-3 px-4 text-center text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-4 max-w-xs md:max-w-md">
                      <div className="font-bold text-slate-200 truncate group-hover:text-cyan-300 font-sans text-xs">
                        {p.title || 'Untitled Page'}
                      </div>
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[11px] text-indigo-400 hover:underline truncate flex items-center gap-1 mt-0.5"
                      >
                        {p.url}
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-300">{p.wordCount || 0}</td>
                    <td className="py-3 px-3 text-center text-slate-300">{p.imageCount || 0}</td>
                    <td className="py-3 px-3 text-center text-slate-300">
                      <span className="text-cyan-400 font-semibold">{p.internalLinkCount || 0}</span> /{' '}
                      <span className="text-indigo-400 font-semibold">{p.externalLinkCount || 0}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {p.emailsFound && p.emailsFound.length > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                          {p.emailsFound.length} emails
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {p.duplicate ? (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                          DUPLICATE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                          200 OK
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="px-2.5 py-1 bg-space-800 hover:bg-cyan-500/20 text-cyan-400 rounded border border-slate-700 hover:border-cyan-500/40 text-[11px] transition">
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
