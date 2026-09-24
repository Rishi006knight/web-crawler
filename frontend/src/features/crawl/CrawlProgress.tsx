import React from 'react';
import { Clock, Globe, FileText, Compass, AlertCircle, StopCircle } from 'lucide-react';
import { CrawlJob } from '../../types';
import { ProgressBar } from '../../components/ui/ProgressBar';

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

  const totalWords = job.pages?.reduce((acc, p) => acc + (p.wordCount || 0), 0) || 0;

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const statusColors = {
    RUNNING: 'bg-sky-500/10 text-sky-500 border-sky-500/30',
    COMPLETED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    STOPPED: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    FAILED: 'bg-red-500/10 text-red-500 border-red-500/30'
  }[job.status] || 'bg-slate-500/10 text-slate-500 border-slate-500/30';

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-5 shadow-sm space-y-4">
      {/* Top row: Status, Start URL, Stop action */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <span
            className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${statusColors}`}
          >
            {job.status}
          </span>
          <span className="font-mono text-xs text-slate-600 dark:text-slate-300 font-medium truncate max-w-xs md:max-w-md">
            {job.startUrl}
          </span>
        </div>

        {isRunning && (
          <button
            type="button"
            onClick={onStop}
            disabled={isLoading}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-medium focus-ring transition"
          >
            <StopCircle className="w-3.5 h-3.5" />
            <span>Stop Crawl</span>
          </button>
        )}
      </div>

      {/* Segmented Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span>
            {pagesCrawled} of {maxPages} pages fetched ({Math.round((pagesCrawled / maxPages) * 100)}%)
          </span>
          {skippedCount > 0 && <span>{skippedCount} skipped</span>}
        </div>

        <ProgressBar
          value={pagesCrawled}
          max={maxPages}
          segments={{
            fetched: pagesCrawled,
            skipped: skippedCount,
            failed: job.status === 'FAILED' ? 1 : 0,
            total: Math.max(pagesCrawled + skippedCount, maxPages)
          }}
        />
      </div>

      {/* Animated Stat Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800/50 space-y-1">
          <div className="flex items-center space-x-1.5 text-slate-400 text-xs">
            <Globe className="w-3.5 h-3.5 text-sky-500" />
            <span>Pages</span>
          </div>
          <div className="text-lg font-bold text-slate-800 dark:text-slate-100 font-mono">
            {pagesCrawled}
            <span className="text-xs text-slate-400 font-normal"> / {maxPages}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800/50 space-y-1">
          <div className="flex items-center space-x-1.5 text-slate-400 text-xs">
            <Compass className="w-3.5 h-3.5 text-emerald-500" />
            <span>Discovered</span>
          </div>
          <div className="text-lg font-bold text-slate-800 dark:text-slate-100 font-mono">
            {job.discoveredUrlsCount || 0}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800/50 space-y-1">
          <div className="flex items-center space-x-1.5 text-slate-400 text-xs">
            <FileText className="w-3.5 h-3.5 text-amber-500" />
            <span>Total Words</span>
          </div>
          <div className="text-lg font-bold text-slate-800 dark:text-slate-100 font-mono">
            {totalWords.toLocaleString()}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800/50 space-y-1">
          <div className="flex items-center space-x-1.5 text-slate-400 text-xs">
            <Clock className="w-3.5 h-3.5 text-purple-500" />
            <span>Duration</span>
          </div>
          <div className="text-lg font-bold text-slate-800 dark:text-slate-100 font-mono">
            {job.durationMillis ? `${(job.durationMillis / 1000).toFixed(1)}s` : formatElapsed(elapsedSeconds)}
          </div>
        </div>
      </div>
    </div>
  );
}
