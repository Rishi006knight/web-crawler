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
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          p.url.toLowerCase().includes(query.toLowerCase())
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
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/70 backdrop-blur-sm animate-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden focus-ring"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search pages... (Esc to exit)"
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close command palette"
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1 text-xs">
          {/* Page Matches */}
          {filteredPages.length > 0 && (
            <div className="mb-2">
              <div className="px-3 py-1 font-semibold text-[10px] uppercase tracking-wider text-slate-400">
                Matching Pages
              </div>
              {filteredPages.map((page) => (
                <button
                  key={page.url}
                  type="button"
                  onClick={() => handleAction(() => onSelectPage(page))}
                  className="w-full text-left px-3 py-2 rounded-lg flex items-center space-x-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <Globe className="w-4 h-4 text-sky-500 flex-shrink-0" />
                  <div className="truncate flex-1">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{page.title}</span>
                    <span className="ml-2 text-slate-400 text-[11px] truncate font-mono">{page.url}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Quick Commands */}
          <div className="px-3 py-1 font-semibold text-[10px] uppercase tracking-wider text-slate-400">
            Commands
          </div>

          <button
            type="button"
            onClick={() => handleAction(onStartCrawlPrompt)}
            className="w-full text-left px-3 py-2 rounded-lg flex items-center space-x-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-800 dark:text-slate-200"
          >
            <Play className="w-4 h-4 text-emerald-500" />
            <span>Start New Crawl...</span>
          </button>

          {isRunning && onStopCrawl && (
            <button
              type="button"
              onClick={() => handleAction(onStopCrawl)}
              className="w-full text-left px-3 py-2 rounded-lg flex items-center space-x-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-red-600 dark:text-red-400"
            >
              <StopCircle className="w-4 h-4 text-red-500" />
              <span>Stop Active Crawl</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleAction(onExport)}
            className="w-full text-left px-3 py-2 rounded-lg flex items-center space-x-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-800 dark:text-slate-200"
          >
            <Download className="w-4 h-4 text-sky-500" />
            <span>Export Crawl Results (JSON / CSV / MD)</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction(onOpenHistory)}
            className="w-full text-left px-3 py-2 rounded-lg flex items-center space-x-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-800 dark:text-slate-200"
          >
            <History className="w-4 h-4 text-indigo-500" />
            <span>Open Crawl History & Diff...</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction(() => setTheme(theme === 'dark' ? 'light' : 'dark'))}
            className="w-full text-left px-3 py-2 rounded-lg flex items-center space-x-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-800 dark:text-slate-200"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400" />
            )}
            <span>Toggle Theme ({theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
