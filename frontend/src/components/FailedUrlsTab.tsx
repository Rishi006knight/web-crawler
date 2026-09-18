import React from 'react';
import { CrawlResult } from '../types';
import { AlertCircle } from 'lucide-react';

interface FailedUrlsTabProps {
  job: CrawlResult;
}

export const FailedUrlsTab: React.FC<FailedUrlsTabProps> = ({ job }) => {
  const failed = job.failedUrls || [];

  return (
    <div className="space-y-4">
      <div className="glass-panel p-4 rounded-xl">
        <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Failed & Disallowed Requests ({failed.length})
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          URLs that triggered robots.txt Disallow rules, timed out after exponential backoff retries, or returned HTTP 4xx/5xx status codes.
        </p>
      </div>

      <div className="space-y-2">
        {failed.length === 0 ? (
          <div className="glass-panel p-6 text-center text-xs text-slate-500 italic">
            No failed requests in this crawl.
          </div>
        ) : (
          failed.map((f, idx) => (
            <div
              key={f.url + idx}
              className="glass-panel p-3.5 rounded-xl border-l-4 border-rose-500 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-rose-300 font-bold break-all">{f.url}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono">
                  Status {f.statusCode || 500} • {f.retryCount || 0} Retries
                </span>
              </div>
              <div className="text-xs text-slate-400 font-sans">
                Reason: <span className="text-slate-200">{f.reason || 'Network error'}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
