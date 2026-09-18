import React from 'react';
import { CrawlResult } from '../types';
import { Hash, ExternalLink } from 'lucide-react';

interface KeywordMatchesTabProps {
  job: CrawlResult;
}

export const KeywordMatchesTab: React.FC<KeywordMatchesTabProps> = ({ job }) => {
  const matches = job.matchedUrls || [];

  return (
    <div className="space-y-4">
      <div className="glass-panel p-4 rounded-xl">
        <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
          <Hash className="w-4 h-4" />
          Keyword Matches ({matches.length})
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Pages whose extracted visible text content contains the target search keyword.
        </p>
      </div>

      <div className="space-y-2">
        {matches.length === 0 ? (
          <div className="glass-panel p-6 text-center text-xs text-slate-500 italic">
            No keyword matches recorded for this crawl.
          </div>
        ) : (
          matches.map((url) => (
            <div
              key={url}
              className="glass-panel p-3.5 rounded-xl flex items-center justify-between border-l-4 border-amber-400"
            >
              <div className="min-w-0 pr-4">
                <span className="text-xs font-mono text-amber-300 font-semibold break-all">{url}</span>
              </div>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 bg-space-800 hover:bg-space-700 text-slate-300 text-xs rounded border border-slate-700 flex-shrink-0 flex items-center gap-1"
              >
                Open <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
