import React from 'react';
import { Activity, CheckCircle2, AlertCircle, Compass } from 'lucide-react';
import { FeedItem } from './useCrawl';

interface LiveFeedProps {
  items: FeedItem[];
  isRunning: boolean;
}

export function LiveFeed({ items, isRunning }: LiveFeedProps) {
  if (items.length === 0 && !isRunning) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-3.5 space-y-2 text-xs"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className={`w-3.5 h-3.5 ${isRunning ? 'text-sky-500 animate-pulse' : 'text-slate-400'}`} />
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            Live Crawl Stream
          </span>
          {isRunning && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-sky-500/10 text-sky-500 font-mono font-medium">
              LIVE
            </span>
          )}
        </div>
        <span className="text-[11px] text-slate-400">
          {items.length} recent events
        </span>
      </div>

      <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-100/70 dark:bg-slate-800/50 text-[11px] font-mono animate-in"
          >
            <div className="flex items-center space-x-2 truncate mr-2">
              {item.type === 'CRAWLED' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              ) : item.type === 'SKIPPED' ? (
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              ) : (
                <Compass className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
              )}
              <span className="truncate text-slate-700 dark:text-slate-300">
                {item.url}
              </span>
            </div>

            <div className="flex items-center space-x-1.5 flex-shrink-0">
              {item.status && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] ${
                    item.status < 400
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-red-500/10 text-red-500'
                  }`}
                >
                  {item.status}
                </span>
              )}
              {item.reason && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 max-w-[120px] truncate">
                  {item.reason}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
