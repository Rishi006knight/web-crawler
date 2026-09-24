import React, { useState } from 'react';
import { X, GitCompare, PlusCircle, MinusCircle, AlertCircle } from 'lucide-react';
import { PageData } from '../../types';

interface CrawlDiffProps {
  isOpen: boolean;
  onClose: () => void;
  basePages: PageData[];
  targetPages: PageData[];
  baseTitle?: string;
  targetTitle?: string;
}

export function CrawlDiffModal({
  isOpen,
  onClose,
  basePages,
  targetPages,
  baseTitle = 'Baseline Crawl',
  targetTitle = 'Current Crawl'
}: CrawlDiffProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'added' | 'removed' | 'changed'>('all');

  if (!isOpen) return null;

  const baseMap = new Map<string, PageData>(basePages.map((p) => [p.url, p]));
  const targetMap = new Map<string, PageData>(targetPages.map((p) => [p.url, p]));

  const added: PageData[] = [];
  const removed: PageData[] = [];
  const changed: Array<{
    url: string;
    before: PageData;
    after: PageData;
    changes: string[];
  }> = [];

  targetPages.forEach((curr) => {
    if (!baseMap.has(curr.url)) {
      added.push(curr);
    } else {
      const prev = baseMap.get(curr.url)!;
      const changes: string[] = [];
      if (prev.statusCode !== curr.statusCode) {
        changes.push(`Status: ${prev.statusCode} → ${curr.statusCode}`);
      }
      if (Math.abs(prev.wordCount - curr.wordCount) > 10) {
        changes.push(`Word count: ${prev.wordCount} → ${curr.wordCount}`);
      }
      if (prev.title !== curr.title) {
        changes.push(`Title changed`);
      }
      if (changes.length > 0) {
        changed.push({ url: curr.url, before: prev, after: curr, changes });
      }
    }
  });

  basePages.forEach((prev) => {
    if (!targetMap.has(prev.url)) {
      removed.push(prev);
    }
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="diff-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <GitCompare className="w-5 h-5 text-sky-500" />
            <h2 id="diff-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
              Crawl Comparison
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ({baseTitle} vs {targetTitle})
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close comparison modal"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metric summary pills */}
        <div className="flex items-center space-x-3 px-6 py-3 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'all'
                ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            All Changes ({added.length + removed.length + changed.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('added')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
              activeTab === 'added'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>Added ({added.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('removed')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
              activeTab === 'removed'
                ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <MinusCircle className="w-3.5 h-3.5 text-red-500" />
            <span>Removed ({removed.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('changed')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
              activeTab === 'changed'
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Changed ({changed.length})</span>
          </button>
        </div>

        {/* Diff Content List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {added.length === 0 && removed.length === 0 && changed.length === 0 && (
            <div className="text-center py-12 text-sm text-slate-500 dark:text-slate-400">
              No differences detected between these two crawl snapshots.
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'added') &&
            added.map((page) => (
              <div
                key={`added-${page.url}`}
                className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs space-y-1"
              >
                <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <PlusCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Added Page: {page.title || 'Untitled'}</span>
                </div>
                <div className="text-slate-600 dark:text-slate-400 font-mono text-[11px] truncate">
                  {page.url}
                </div>
                <div className="text-[11px] text-slate-500">
                  Status: {page.statusCode} • Words: {page.wordCount}
                </div>
              </div>
            ))}

          {(activeTab === 'all' || activeTab === 'removed') &&
            removed.map((page) => (
              <div
                key={`removed-${page.url}`}
                className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 text-xs space-y-1"
              >
                <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 font-semibold">
                  <MinusCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Removed Page: {page.title || 'Untitled'}</span>
                </div>
                <div className="text-slate-600 dark:text-slate-400 font-mono text-[11px] truncate">
                  {page.url}
                </div>
                <div className="text-[11px] text-slate-500">
                  Prior Status: {page.statusCode} • Prior Words: {page.wordCount}
                </div>
              </div>
            ))}

          {(activeTab === 'all' || activeTab === 'changed') &&
            changed.map((item) => (
              <div
                key={`changed-${item.url}`}
                className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs space-y-2"
              >
                <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Changed Page: {item.after.title || 'Untitled'}</span>
                </div>
                <div className="text-slate-600 dark:text-slate-400 font-mono text-[11px] truncate">
                  {item.url}
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {item.changes.map((ch, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-medium"
                    >
                      {ch}
                    </span>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
