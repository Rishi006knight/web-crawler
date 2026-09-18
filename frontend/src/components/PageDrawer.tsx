import React from 'react';
import { PageInfo } from '../types';
import { X, ExternalLink, Mail, AlertTriangle } from 'lucide-react';

interface PageDrawerProps {
  page: PageInfo | null;
  onClose: () => void;
}

export const PageDrawer: React.FC<PageDrawerProps> = ({ page, onClose }) => {
  if (!page) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] glass-panel border-l border-slate-800 shadow-2xl z-40 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-space-900/90">
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-cyan-400" />
          <h3 className="text-sm font-bold text-slate-100">Page Inspector</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-space-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
        <div>
          <label className="text-[10px] uppercase font-mono text-slate-400 font-bold">Page Title</label>
          <div className="text-sm font-bold text-cyan-300 mt-0.5">{page.title || 'Untitled Page'}</div>
        </div>

        <div>
          <label className="text-[10px] uppercase font-mono text-slate-400 font-bold">URL</label>
          <a
            href={page.url}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-mono text-indigo-400 hover:underline break-all block mt-0.5 flex items-center gap-1"
          >
            {page.url} <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
          </a>
        </div>

        <div className="grid grid-cols-2 gap-3 font-mono">
          <div className="bg-space-900 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase">Word Count</span>
            <span className="text-slate-200 font-bold text-sm">{page.wordCount || 0}</span>
          </div>
          <div className="bg-space-900 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase">Image Count</span>
            <span className="text-slate-200 font-bold text-sm">{page.imageCount || 0}</span>
          </div>
          <div className="bg-space-900 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase">Internal Links</span>
            <span className="text-cyan-400 font-bold text-sm">{page.internalLinkCount || 0}</span>
          </div>
          <div className="bg-space-900 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase">External Links</span>
            <span className="text-indigo-400 font-bold text-sm">{page.externalLinkCount || 0}</span>
          </div>
        </div>

        {page.duplicate && (
          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-purple-400" />
              Duplicate Content Detected (SHA-256)
            </div>
            <div className="text-[11px] text-slate-400">Identical content to original URL:</div>
            <div className="font-mono text-xs text-purple-200 break-all">{page.isDuplicateOf}</div>
          </div>
        )}

        <div>
          <label className="text-[10px] uppercase font-mono text-slate-400 font-bold">First H1 Heading</label>
          <div className="font-sans text-slate-200 bg-space-900 p-2.5 rounded border border-slate-800 mt-0.5">
            {page.h1 || 'No H1 tag found'}
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase font-mono text-slate-400 font-bold">Meta Description</label>
          <div className="font-sans text-slate-300 bg-space-900 p-2.5 rounded border border-slate-800 mt-0.5">
            {page.metaDescription || 'No meta description tag provided'}
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase font-mono text-slate-400 font-bold">Emails Extracted</label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {page.emailsFound && page.emailsFound.length > 0 ? (
              page.emailsFound.map((e) => (
                <span
                  key={e}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-xs"
                >
                  <Mail className="w-3 h-3 text-emerald-400" />
                  {e}
                </span>
              ))
            ) : (
              <span className="text-slate-500 italic">None</span>
            )}
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase font-mono text-slate-400 font-bold">Content Snippet (First 200 chars)</label>
          <div className="font-mono text-[11px] text-slate-400 bg-space-900/90 p-3 rounded-lg border border-slate-800 mt-0.5 whitespace-pre-wrap leading-relaxed">
            {page.snippet || 'No text snippet available'}
          </div>
        </div>
      </div>
    </div>
  );
};
