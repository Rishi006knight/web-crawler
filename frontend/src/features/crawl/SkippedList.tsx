import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, ShieldAlert } from 'lucide-react';
import { CrawlAttempt } from '../../types';

interface SkippedListProps {
  skipped: CrawlAttempt[];
  totalAttempted: number;
}

export function SkippedList({ skipped, totalAttempted }: SkippedListProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterOutcome, setFilterOutcome] = useState<string>('ALL');

  if (!skipped || skipped.length === 0) return null;

  const skipRate = totalAttempted > 0 ? (skipped.length / totalAttempted) * 100 : 0;
  const isHighSkipRate = skipRate > 20;

  const outcomes = Array.from(new Set(skipped.map((s) => s.outcome)));

  const filteredSkipped = filterOutcome === 'ALL'
    ? skipped
    : skipped.filter((s) => s.outcome === filterOutcome);

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/10 p-4 space-y-3 text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div>
            <h3 className="text-xs font-bold text-amber-800 dark:text-amber-300">
              Skipped & Blocked URLs ({skipped.length})
            </h3>
            {isHighSkipRate && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                Warning: {Math.round(skipRate)}% of requested URLs were skipped or blocked.
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 transition focus-ring"
          aria-expanded={isOpen}
        >
          <span>{isOpen ? 'Collapse' : 'View Details'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-3 pt-2 border-t border-amber-500/20 animate-in">
          {/* Outcome Filter Pills */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setFilterOutcome('ALL')}
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition ${
                filterOutcome === 'ALL'
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20'
              }`}
            >
              All ({skipped.length})
            </button>
            {outcomes.map((outcome) => (
              <button
                key={outcome}
                type="button"
                onClick={() => setFilterOutcome(outcome)}
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition ${
                  filterOutcome === outcome
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20'
                }`}
              >
                {outcome} ({skipped.filter((s) => s.outcome === outcome).length})
              </button>
            ))}
          </div>

          {/* List of skipped URLs */}
          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
            {filteredSkipped.map((attempt, index) => (
              <div
                key={`${attempt.url}-${index}`}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-500/20 text-xs space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-slate-800 dark:text-slate-200 truncate font-medium">
                    {attempt.url}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex-shrink-0">
                    {attempt.outcome}
                  </span>
                </div>
                {attempt.reason && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {attempt.reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
