import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Layers,
  Heading,
  Link2,
  ImageIcon,
  Code2,
  Clock,
  Globe
} from 'lucide-react';
import { PageData } from '../../types';

interface InspectorModalProps {
  page: PageData | null;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

type TabType = 'overview' | 'blocks' | 'text' | 'headings' | 'links' | 'images' | 'raw';

export function InspectorModal({
  page,
  onClose,
  onNext,
  onPrev,
  hasNext,
  hasPrev
}: InspectorModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [copied, setCopied] = useState(false);

  // Keyboard navigation & Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && (e.metaKey || e.ctrlKey)) {
        if (hasNext && onNext) onNext();
      } else if (e.key === 'ArrowLeft' && (e.metaKey || e.ctrlKey)) {
        if (hasPrev && onPrev) onPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev, hasNext, hasPrev]);

  if (!page) return null;

  const copyText = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="inspector-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl w-full max-w-4xl h-[92vh] sm:h-[85vh] flex flex-col shadow-2xl overflow-hidden focus-ring">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center space-x-3 truncate mr-3">
            <span
              className={`px-2 py-0.5 text-xs font-mono font-bold rounded-full border ${
                page.statusCode < 300
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-500 border-red-500/20'
              }`}
            >
              {page.statusCode}
            </span>
            <div className="truncate">
              <h2 id="inspector-title" className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {page.title || 'Untitled Page'}
              </h2>
              <a
                href={page.url}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-mono text-slate-400 hover:text-sky-500 flex items-center space-x-1 truncate"
              >
                <span className="truncate">{page.url}</span>
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 flex-shrink-0">
            {hasPrev && (
              <button
                type="button"
                onClick={onPrev}
                aria-label="Previous page (Ctrl+Left)"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            {hasNext && (
              <button
                type="button"
                onClick={onNext}
                aria-label="Next page (Ctrl+Right)"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close inspector modal"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 px-6 border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-xs bg-slate-50/50 dark:bg-slate-950/40">
          {[
            { id: 'overview', label: 'Overview', icon: Globe },
            { id: 'blocks', label: 'Blocks', count: page.structuredContent?.length, icon: Layers },
            { id: 'text', label: 'Clean Text', icon: FileText },
            { id: 'headings', label: 'Headings', count: page.headings?.length, icon: Heading },
            { id: 'links', label: 'Links', count: page.links?.length, icon: Link2 },
            { id: 'images', label: 'Images', count: page.images?.length, icon: ImageIcon },
            { id: 'raw', label: 'Raw JSON', icon: Code2 }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center space-x-1.5 py-3 px-3 font-medium border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? 'border-sky-500 text-sky-600 dark:text-sky-400 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Panel */}
        <div className="flex-1 overflow-y-auto p-6 text-left">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-400">HTTP Status</div>
                  <div className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100 mt-1">
                    {page.statusCode}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-400">Word Count</div>
                  <div className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100 mt-1">
                    {(page.wordCount || 0).toLocaleString()}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-400">Links Extracted</div>
                  <div className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100 mt-1">
                    {page.links?.length || 0}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-400">Images Found</div>
                  <div className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100 mt-1">
                    {page.images?.length || 0}
                  </div>
                </div>
              </div>

              {page.description && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Meta Description
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {page.description}
                  </p>
                </div>
              )}

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Crawl Timestamp
                </div>
                <div className="text-sm font-mono text-slate-700 dark:text-slate-300 flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-sky-500" />
                  <span>{new Date(page.crawlTimestamp).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'blocks' && (
            <div className="space-y-3">
              {(!page.structuredContent || page.structuredContent.length === 0) ? (
                <div className="text-sm text-slate-400 py-8 text-center">No structured blocks parsed.</div>
              ) : (
                page.structuredContent.map((block, index) => (
                  <div
                    key={index}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-sky-500/10 text-sky-500 border border-sky-500/20">
                        {block.type} ({block.tag})
                      </span>
                    </div>
                    <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                      {block.text}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => copyText(page.textContent || '')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Clean Text'}</span>
                </button>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-[60vh] overflow-y-auto">
                {page.textContent || 'No text extracted.'}
              </div>
            </div>
          )}

          {activeTab === 'headings' && (
            <div className="space-y-2">
              {(!page.headings || page.headings.length === 0) ? (
                <div className="text-sm text-slate-400 py-8 text-center">No headings found on this page.</div>
              ) : (
                page.headings.map((heading, index) => {
                  const [level, ...rest] = heading.split(': ');
                  const text = rest.join(': ');
                  return (
                    <div
                      key={index}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex items-center space-x-3 text-xs"
                    >
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-sky-500/10 text-sky-500">
                        {level}
                      </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {text || heading}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'links' && (
            <div className="space-y-2">
              {(!page.links || page.links.length === 0) ? (
                <div className="text-sm text-slate-400 py-8 text-center">No links extracted.</div>
              ) : (
                page.links.map((link, index) => (
                  <div
                    key={index}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex items-center justify-between text-xs space-x-2"
                  >
                    <span className="font-mono text-slate-700 dark:text-slate-300 truncate">
                      {link}
                    </span>
                    <a
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${link}`}
                      className="p-1 rounded text-slate-400 hover:text-sky-500"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'images' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(!page.images || page.images.length === 0) ? (
                <div className="col-span-full text-sm text-slate-400 py-8 text-center">No images found.</div>
              ) : (
                page.images.map((img, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-900 space-y-2 p-2 text-xs"
                  >
                    <div className="aspect-video bg-slate-200 dark:bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center">
                      <img
                        src={img}
                        alt={`Extracted ${index}`}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="font-mono text-[10px] text-slate-400 truncate px-1">
                      {img}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'raw' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => copyText(JSON.stringify(page, null, 2))}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 overflow-x-auto max-h-[60vh]">
                {JSON.stringify(page, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
