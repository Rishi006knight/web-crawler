import React from 'react';
import { Clock, Globe, FileText, Compass, StopCircle, Activity } from 'lucide-react';
import { CrawlJob } from '../../types';

interface CrawlProgressProps {
  job: CrawlJob;
  elapsedSeconds: number;
  onStop: () => void;
  isLoading: boolean;
}

export function CrawlProgress({ job, elapsedSeconds, onStop, isLoading }: CrawlProgressProps) {
  const pagesCrawled = job.pages?.length || job.pagesCrawled || 0;
  const maxPages = job.maxPages || 20;
  const skippedCount = job.skipped?.length || 0;
  const isRunning = job.status === 'RUNNING';
  const progress = Math.min((pagesCrawled / maxPages) * 100, 100);

  const totalWords = job.pages?.reduce((acc, p) => acc + (p.wordCount || 0), 0) || 0;

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const statusConfig = {
    RUNNING: { color: 'text-gradient-start', bg: 'gradient-accent', label: 'Crawling' },
    COMPLETED: { color: 'text-status-success', bg: 'bg-status-success', label: 'Completed' },
    STOPPED: { color: 'text-status-warning', bg: 'bg-status-warning', label: 'Stopped' },
    FAILED: { color: 'text-status-danger', bg: 'bg-status-danger', label: 'Failed' }
  }[job.status] || { color: 'text-ink-muted', bg: 'bg-surface-sunken', label: job.status };

  // Circular progress ring
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="rounded-3xl glass-panel p-6 sm:p-8 space-y-6 text-left animate-slide-up">
      {/* Top row: Progress Ring + Status + Stop */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-5">
          {/* Circular Progress Ring */}
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 88 88">
              {/* Background track */}
              <circle
                cx="44"
                cy="44"
                r={radius}
                fill="none"
                stroke="var(--border)"
                strokeWidth="5"
              />
              {/* Progress arc */}
              <circle
                cx="44"
                cy="44"
                r={radius}
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500 ease-out"
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00D9FF" />
                  <stop offset="100%" stopColor="#A855F7" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-ink-strong font-mono animate-count-up">
                {Math.round(progress)}%
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full text-white ${statusConfig.bg}`}>
                {isRunning && <Activity className="w-3 h-3 inline mr-1 animate-pulse" />}
                {statusConfig.label}
              </span>
            </div>
            <p className="font-mono text-xs text-ink-strong font-medium truncate max-w-xs md:max-w-md">
              {job.startUrl}
            </p>
            <p className="text-xs text-ink-muted">
              {pagesCrawled} of {maxPages} pages fetched
              {skippedCount > 0 && <span className="ml-2 text-status-warning">• {skippedCount} skipped</span>}
            </p>
          </div>
        </div>

        {isRunning && (
          <button
            type="button"
            onClick={onStop}
            disabled={isLoading}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-status-danger-bg hover:bg-status-danger text-status-danger hover:text-white border border-status-danger-line text-xs font-semibold focus-ring transition-all duration-200 emboss hover:shadow-glow active:scale-[0.98]"
          >
            <StopCircle className="w-4 h-4" />
            <span>Stop</span>
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="h-2.5 rounded-full bg-surface-sunken overflow-hidden">
          <div
            className="h-full rounded-full gradient-accent transition-all duration-500 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            {isRunning && (
              <div className="absolute inset-0 animate-shimmer rounded-full" />
            )}
          </div>
        </div>
      </div>

      {/* Stat Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Globe, label: 'Pages', value: pagesCrawled, sub: `/ ${maxPages}`, color: 'text-gradient-start' },
          { icon: Compass, label: 'Discovered', value: job.discoveredUrlsCount || 0, color: 'text-status-success' },
          { icon: FileText, label: 'Total Words', value: totalWords.toLocaleString(), color: 'text-gradient-end' },
          { icon: Clock, label: 'Duration', value: job.durationMillis ? `${(job.durationMillis / 1000).toFixed(1)}s` : formatElapsed(elapsedSeconds), color: 'text-status-info' },
        ].map((stat, i) => (
          <div key={stat.label} className={`p-4 rounded-2xl glass emboss space-y-1.5 stagger-item animate-slide-up`} style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-center space-x-1.5 text-ink-muted text-xs">
              <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
              <span className="uppercase tracking-wider text-[10px] font-medium">{stat.label}</span>
            </div>
            <div className="text-lg font-bold text-ink-strong font-mono animate-count-up">
              {stat.value}
              {stat.sub && <span className="text-xs text-ink-muted font-normal ml-0.5">{stat.sub}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
