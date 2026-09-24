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
      className="rounded-2xl glass-panel p-4 space-y-3 text-xs text-left animate-fade"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <Activity className={`w-3.5 h-3.5 ${isRunning ? 'text-gradient-start animate-pulse' : 'text-ink-muted'}`} />
          <span className="font-semibold text-ink-strong text-sm">
            Live Stream
          </span>
          {isRunning && (
            <span className="px-2 py-0.5 rounded-full text-[10px] gradient-accent text-white font-bold tracking-wider uppercase">
              Live
            </span>
          )}
        </div>
        <span className="text-[11px] text-ink-muted font-mono">
          {items.length} events
        </span>
      </div>

      <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
        {items.map((item, i) => (
          <div
            key={item.id}
            className="flex items-center justify-between py-2 px-3 rounded-xl glass emboss text-[11px] font-mono stagger-item animate-slide-up"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex items-center space-x-2 truncate mr-2">
              {item.type === 'CRAWLED' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0" />
              ) : item.type === 'SKIPPED' ? (
                <AlertCircle className="w-3.5 h-3.5 text-status-warning shrink-0" />
              ) : (
                <Compass className="w-3.5 h-3.5 text-gradient-start shrink-0" />
              )}
              <span className="truncate text-ink">
                {item.url}
              </span>
            </div>

            <div className="flex items-center space-x-1.5 shrink-0">
              {item.status && (
                <span
                  className={`px-1.5 py-0.5 rounded-lg text-[10px] font-semibold ${
                    item.status < 400
                      ? 'bg-status-success-bg text-status-success'
                      : 'bg-status-danger-bg text-status-danger'
                  }`}
                >
                  {item.status}
                </span>
              )}
              {item.reason && (
                <span className="text-[10px] text-status-warning max-w-[120px] truncate">
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
