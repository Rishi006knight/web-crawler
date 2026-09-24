import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
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
    <div className="rounded-3xl bg-status-warning-bg border border-status-warning-line p-5 sm:p-6 space-y-3 text-left animate-fade">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <AlertTriangle className="w-5 h-5 text-status-warning shrink-0" />
          <div>
            <h3 className="text-xs font-bold text-status-warning">
              Skipped & Blocked URLs ({skipped.length})
            </h3>
            {isHighSkipRate && (
              <p className="text-[11px] text-ink-secondary">
                Notice: {Math.round(skipRate)}% of requested URLs were skipped or blocked.
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-xl glass emboss text-status-warning hover:shadow-glow-sm transition-all focus-ring active:shadow-pressed active:scale-[0.98]"
          aria-expanded={isOpen}
        >
          <span>{isOpen ? 'Collapse' : 'View Details'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-3 pt-3 border-t border-status-warning-line animate-slide-up">
          {/* Outcome Filter Pills */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setFilterOutcome('ALL')}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                filterOutcome === 'ALL'
                  ? 'bg-status-warning text-white shadow-soft'
                  : 'glass emboss text-status-warning hover:shadow-glow-sm'
              }`}
            >
              All ({skipped.length})
            </button>
            {outcomes.map((outcome) => (
              <button
                key={outcome}
                type="button"
                onClick={() => setFilterOutcome(outcome)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                  filterOutcome === outcome
                    ? 'bg-status-warning text-white shadow-soft'
                    : 'glass emboss text-status-warning hover:shadow-glow-sm'
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
                className="p-3.5 rounded-2xl bg-surface-raised border border-status-warning-line text-xs space-y-1.5 shadow-hairline stagger-item animate-slide-up"
                style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-ink-strong truncate font-medium">
                    {attempt.url}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-status-warning-bg text-status-warning shrink-0">
                    {attempt.outcome}
                  </span>
                </div>
                {attempt.reason && (
                  <p className="text-[11px] text-ink-muted">
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
