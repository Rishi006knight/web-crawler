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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade"
    >
      <div className="bg-surface-raised border border-line rounded-t-3xl sm:rounded-2xl w-full max-w-4xl max-h-[92vh] sm:max-h-[85vh] flex flex-col shadow-floating overflow-hidden animate-sheet sm:animate-modal transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line shrink-0">
          <div className="flex items-center space-x-2.5">
            <GitCompare className="w-5 h-5 text-brand" />
            <h2 id="diff-title" className="text-base font-bold text-ink-strong">
              Crawl Comparison
            </h2>
            <span className="text-xs text-ink-muted">
              ({baseTitle} vs {targetTitle})
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close comparison modal"
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-sunken transition focus-ring"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metric summary pills */}
        <div className="flex items-center space-x-2 px-6 py-3 bg-surface-sunken border-b border-line text-xs overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition focus-ring ${
              activeTab === 'all'
                ? 'bg-surface-raised text-ink-strong shadow-hairline border border-line'
                : 'text-ink-secondary hover:text-ink hover:bg-surface/50 border border-transparent'
            }`}
          >
            All Changes ({added.length + removed.length + changed.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('added')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 focus-ring ${
              activeTab === 'added'
                ? 'bg-status-success-bg text-status-success border border-status-success-line'
                : 'text-ink-secondary hover:text-ink hover:bg-surface/50 border border-transparent'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5 text-status-success" />
            <span>Added ({added.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('removed')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 focus-ring ${
              activeTab === 'removed'
                ? 'bg-status-danger-bg text-status-danger border border-status-danger-line'
                : 'text-ink-secondary hover:text-ink hover:bg-surface/50 border border-transparent'
            }`}
          >
            <MinusCircle className="w-3.5 h-3.5 text-status-danger" />
            <span>Removed ({removed.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('changed')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 focus-ring ${
              activeTab === 'changed'
                ? 'bg-status-warning-bg text-status-warning border border-status-warning-line'
                : 'text-ink-secondary hover:text-ink hover:bg-surface/50 border border-transparent'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-status-warning" />
            <span>Changed ({changed.length})</span>
          </button>
        </div>

        {/* Diff Content List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 text-left">
          {added.length === 0 && removed.length === 0 && changed.length === 0 && (
            <div className="text-center py-12 text-sm text-ink-muted">
              No differences detected between these two crawl snapshots.
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'added') &&
            added.map((page) => (
              <div
                key={`added-${page.url}`}
                className="p-3.5 rounded-xl border border-status-success-line bg-status-success-bg text-xs space-y-1"
              >
                <div className="flex items-center space-x-2 text-status-success font-semibold">
                  <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Added Page: {page.title || 'Untitled'}</span>
                </div>
                <div className="text-ink font-mono text-[11px] truncate">
                  {page.url}
                </div>
                <div className="text-[11px] text-ink-muted">
                  Status: {page.statusCode} • Words: {page.wordCount}
                </div>
              </div>
            ))}

          {(activeTab === 'all' || activeTab === 'removed') &&
            removed.map((page) => (
              <div
                key={`removed-${page.url}`}
                className="p-3.5 rounded-xl border border-status-danger-line bg-status-danger-bg text-xs space-y-1"
              >
                <div className="flex items-center space-x-2 text-status-danger font-semibold">
                  <MinusCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Removed Page: {page.title || 'Untitled'}</span>
                </div>
                <div className="text-ink font-mono text-[11px] truncate">
                  {page.url}
                </div>
                <div className="text-[11px] text-ink-muted">
                  Prior Status: {page.statusCode} • Prior Words: {page.wordCount}
                </div>
              </div>
            ))}

          {(activeTab === 'all' || activeTab === 'changed') &&
            changed.map((item) => (
              <div
                key={`changed-${item.url}`}
                className="p-3.5 rounded-xl border border-status-warning-line bg-status-warning-bg text-xs space-y-2"
              >
                <div className="flex items-center space-x-2 text-status-warning font-semibold">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Changed Page: {item.after.title || 'Untitled'}</span>
                </div>
                <div className="text-ink font-mono text-[11px] truncate">
                  {item.url}
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {item.changes.map((ch, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-surface-raised text-status-warning border border-status-warning-line text-[10px] font-medium"
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
