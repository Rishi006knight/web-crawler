import React from 'react';

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  className?: string;
  segments?: {
    fetched: number;
    skipped: number;
    failed: number;
    total: number;
  };
}

export function ProgressBar({
  value,
  max = 100,
  label = 'Crawl Progress',
  className = '',
  segments
}: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  if (segments && segments.total > 0) {
    const fetchedPct = Math.min(100, (segments.fetched / segments.total) * 100);
    const skippedPct = Math.min(100 - fetchedPct, (segments.skipped / segments.total) * 100);
    const failedPct = Math.min(100 - fetchedPct - skippedPct, (segments.failed / segments.total) * 100);

    return (
      <div
        role="progressbar"
        aria-valuenow={segments.fetched}
        aria-valuemin={0}
        aria-valuemax={segments.total}
        aria-label={label}
        className={`w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden flex ${className}`}
      >
        <div
          style={{ width: `${fetchedPct}%` }}
          className="bg-sky-500 h-full transition-all duration-300"
          title={`Fetched: ${segments.fetched}`}
        />
        <div
          style={{ width: `${skippedPct}%` }}
          className="bg-amber-500 h-full transition-all duration-300"
          title={`Skipped: ${segments.skipped}`}
        />
        <div
          style={{ width: `${failedPct}%` }}
          className="bg-red-500 h-full transition-all duration-300"
          title={`Failed: ${segments.failed}`}
        />
      </div>
    );
  }

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={`w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden ${className}`}
    >
      <div
        style={{ width: `${percent}%` }}
        className="bg-sky-500 h-full rounded-full transition-all duration-300"
      />
    </div>
  );
}
