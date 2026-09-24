import React, { useState, useEffect, useRef } from 'react';
import { Search, Globe, Moon, Sun, Download, History, Play, StopCircle, X } from 'lucide-react';
import { useTheme } from '../theme/ThemeProvider';
import { PageData } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCrawlPrompt: () => void;
  onStopCrawl?: () => void;
  isRunning?: boolean;
  onOpenHistory: () => void;
  onExport: () => void;
  pages: PageData[];
  onSelectPage: (page: PageData) => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onStartCrawlPrompt,
  onStopCrawl,
  isRunning,
  onOpenHistory,
  onExport,
  pages,
  onSelectPage
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const { theme, setTheme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredPages = query.trim()
    ? pages.filter(
        (p) =>
          (p.title && p.title.toLowerCase().includes(query.toLowerCase())) ||
          (p.url && p.url.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 5)
    : [];

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/40 backdrop-blur-md animate-fade"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-surface-raised border border-line rounded-3xl shadow-floating overflow-hidden animate-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center px-5 py-4 border-b border-line">
          <Search className="w-5 h-5 text-ink-muted mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search pages... (Esc to exit)"
            className="w-full bg-transparent text-sm text-ink-strong placeholder:text-ink-muted outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close command palette"
            className="p-1.5 rounded-xl text-ink-muted hover:text-ink focus-ring transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action List */}
        <div className="max-h-80 overflow-y-auto p-2.5 space-y-1 text-xs text-left">
          {/* Page Matches */}
          {filteredPages.length > 0 && (
            <div className="mb-2">
              <div className="px-3 py-1.5 font-semibold text-[10px] uppercase tracking-wider text-ink-muted">
                Matching Pages
              </div>
              {filteredPages.map((page) => (
                <button
                  key={page.url}
                  type="button"
                  onClick={() => handleAction(() => onSelectPage(page))}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl flex items-center space-x-2.5 hover:bg-surface-sunken transition-all focus-ring"
                >
                  <Globe className="w-4 h-4 text-gradient-start shrink-0" />
                  <div className="truncate flex-1">
                    <span className="font-medium text-ink-strong">{page.title || 'Untitled'}</span>
                    <span className="ml-2 text-ink-muted text-[11px] truncate font-mono">{page.url}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Quick Commands */}
          <div className="px-3 py-1.5 font-semibold text-[10px] uppercase tracking-wider text-ink-muted">
            Commands
          </div>

          {[
            { action: onStartCrawlPrompt, icon: Play, color: 'text-status-success', label: 'Start New Crawl...' },
            ...(isRunning && onStopCrawl ? [{ action: onStopCrawl, icon: StopCircle, color: 'text-status-danger', label: 'Stop Active Crawl' }] : []),
            { action: onExport, icon: Download, color: 'text-gradient-start', label: 'Export Crawl Results (JSON / CSV / MD)' },
            { action: onOpenHistory, icon: History, color: 'text-gradient-end', label: 'Open Crawl History & Diff...' },
            { action: () => setTheme(theme === 'dark' ? 'light' : 'dark'), icon: theme === 'dark' ? Sun : Moon, color: theme === 'dark' ? 'text-status-warning' : 'text-brand', label: `Toggle Theme (${theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'})` },
          ].map((cmd, i) => (
            <button
              key={cmd.label}
              type="button"
              onClick={() => handleAction(cmd.action)}
              className="w-full text-left px-3.5 py-2.5 rounded-xl flex items-center space-x-2.5 hover:bg-surface-sunken transition-all text-ink hover:text-ink-strong focus-ring"
            >
              <cmd.icon className={`w-4 h-4 ${cmd.color}`} />
              <span>{cmd.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
