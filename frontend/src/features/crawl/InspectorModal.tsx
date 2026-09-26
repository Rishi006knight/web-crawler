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
  searchQuery?: string;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

type TabType = 'overview' | 'blocks' | 'text' | 'headings' | 'links' | 'images' | 'raw';

export function InspectorModal({
  page,
  searchQuery,
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-md animate-fade"
    >
      {/* Solid opaque modal container - NOT transparent */}
      <div className="bg-surface-raised border border-line rounded-t-3xl sm:rounded-3xl w-full max-w-4xl h-[92vh] sm:h-[85vh] flex flex-col shadow-floating overflow-hidden animate-sheet sm:animate-modal">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line shrink-0 bg-surface-raised">
          <div className="flex items-center space-x-3 truncate mr-3">
            <span
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded-full ${
                page.statusCode < 300
                  ? 'bg-status-success-bg text-status-success'
                  : 'bg-status-danger-bg text-status-danger'
              }`}
            >
              {page.statusCode}
            </span>
            <div className="truncate">
              <h2 id="inspector-title" className="text-sm font-bold text-ink-strong truncate">
                {page.title || 'Untitled Page'}
              </h2>
              <a
                href={page.url}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-mono text-ink-muted hover:text-gradient-start flex items-center space-x-1 truncate transition"
              >
                <span className="truncate">{page.url}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            {hasPrev && (
              <button
                type="button"
                onClick={onPrev}
                aria-label="Previous page (Ctrl+Left)"
                className="p-2 rounded-xl text-ink-muted hover:text-ink emboss hover:shadow-glow-sm transition-all focus-ring"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            {hasNext && (
              <button
                type="button"
                onClick={onNext}
                aria-label="Next page (Ctrl+Right)"
                className="p-2 rounded-xl text-ink-muted hover:text-ink emboss hover:shadow-glow-sm transition-all focus-ring"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close inspector modal"
              className="p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-status-danger-bg transition-all ml-1 focus-ring"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation - SOLID background, not transparent */}
        <div className="flex items-center space-x-1 px-6 border-b border-line overflow-x-auto text-xs bg-surface-sunken shrink-0">
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
                className={`flex items-center space-x-1.5 py-3 px-3.5 font-medium border-b-2 transition-all whitespace-nowrap focus-ring ${
                  isActive
                    ? 'border-gradient-start text-ink-strong font-semibold'
                    : 'border-transparent text-ink-secondary hover:text-ink'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-gradient-start' : ''}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-surface-sunken text-ink-secondary font-mono">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Panel - SOLID background */}
        <div className="flex-1 overflow-y-auto p-6 text-left bg-surface-raised">
          {activeTab === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'HTTP Status', value: page.statusCode, color: 'text-gradient-start' },
                  { label: 'Word Count', value: (page.wordCount || 0).toLocaleString(), color: 'text-gradient-end' },
                  { label: 'Links Extracted', value: page.links?.length || 0, color: 'text-status-success' },
                  { label: 'Images Found', value: page.images?.length || 0, color: 'text-gradient-pink' },
                ].map((stat, i) => (
                  <div key={stat.label} className="p-4 rounded-2xl glass emboss space-y-1.5 stagger-item animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="text-[10px] text-ink-muted uppercase tracking-wider font-medium">{stat.label}</div>
                    <div className={`text-xl font-bold font-mono text-ink-strong animate-count-up`}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>

              {page.description && (
                <div className="p-5 rounded-2xl glass emboss space-y-2">
                  <div className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">
                    Meta Description
                  </div>
                  <p className="text-sm text-ink leading-relaxed">
                    {page.description}
                  </p>
                </div>
              )}

              <div className="p-5 rounded-2xl glass emboss space-y-2">
                <div className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">
                  Crawl Timestamp
                </div>
                <div className="text-sm font-mono text-ink flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gradient-start" />
                  <span>{new Date(page.crawlTimestamp).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'blocks' && (
            <div className="space-y-3">
              {(!page.structuredContent || page.structuredContent.length === 0) ? (
                <div className="text-sm text-ink-muted py-8 text-center">No structured blocks parsed.</div>
              ) : (
                page.structuredContent.map((block, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-2xl glass emboss space-y-2 stagger-item animate-slide-up"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider gradient-accent text-white">
                        {block.type} ({block.tag})
                      </span>
                    </div>
                    <p className="text-sm text-ink leading-relaxed">
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
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-medium glass emboss text-ink hover:text-ink-strong transition-all duration-200 hover:shadow-glow-sm focus-ring active:shadow-pressed active:scale-[0.98]"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Clean Text'}</span>
                </button>
              </div>
              <div className="p-5 rounded-2xl bg-surface-sunken border border-line text-xs sm:text-sm font-mono text-ink whitespace-pre-wrap leading-relaxed max-h-[60vh] overflow-y-auto">
                {page.textContent || 'No text extracted.'}
              </div>
            </div>
          )}

          {activeTab === 'headings' && (
            <div className="space-y-2">
              {(!page.headings || page.headings.length === 0) ? (
                <div className="text-sm text-ink-muted py-8 text-center">No headings found on this page.</div>
              ) : (
                page.headings.map((heading, index) => {
                  const [level, ...rest] = heading.split(': ');
                  const text = rest.join(': ');
                  return (
                    <div
                      key={index}
                      className="p-3.5 rounded-xl glass emboss flex items-center space-x-3 text-xs stagger-item animate-slide-up"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <span className="px-2.5 py-0.5 rounded-full font-mono font-bold text-[10px] gradient-accent text-white">
                        {level}
                      </span>
                      <span className="font-medium text-ink truncate">
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
                <div className="text-sm text-ink-muted py-8 text-center">No links extracted.</div>
              ) : (
                page.links.map((link, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-xl glass emboss flex items-center justify-between text-xs space-x-2 stagger-item animate-slide-up"
                    style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
                  >
                    <span className="font-mono text-ink truncate">
                      {link}
                    </span>
                    <a
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${link}`}
                      className="p-1.5 rounded-lg text-ink-muted hover:text-gradient-start focus-ring transition"
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
                <div className="col-span-full text-sm text-ink-muted py-8 text-center">No images found.</div>
              ) : (
                page.images.map((img, index) => {
                  const detail = page.imageDetails?.[index];
                  const altText = detail?.alt || '';
                  const isMatch = Boolean(
                    searchQuery && (
                      (altText && altText.toLowerCase().includes(searchQuery.toLowerCase())) ||
                      img.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                  );

                  return (
                    <div
                      key={index}
                      className={`rounded-2xl glass emboss overflow-hidden space-y-2 p-2.5 text-xs stagger-item animate-slide-up hover:-translate-y-0.5 hover:shadow-floating transition-all duration-200 ${
                        isMatch ? 'border-amber-500/70 ring-2 ring-amber-500/20' : ''
                      }`}
                      style={{ animationDelay: `${Math.min(index, 6) * 50}ms` }}
                    >
                      <div className="relative aspect-video bg-surface-sunken rounded-xl overflow-hidden flex items-center justify-center">
                        <img
                          src={img}
                          alt={altText || `Extracted ${index}`}
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        {isMatch && (
                          <div className="absolute top-1.5 right-1.5 px-2 py-0.5 text-[9px] font-bold rounded-full bg-amber-500 text-white shadow-soft">
                            MATCH
                          </div>
                        )}
                      </div>
                      {altText && (
                        <p className="font-semibold text-ink-strong text-[11px] truncate px-1" title={altText}>
                          {altText}
                        </p>
                      )}
                      <div className="font-mono text-[10px] text-ink-muted truncate px-1">
                        {img}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'raw' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => copyText(JSON.stringify(page, null, 2))}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-medium glass emboss text-ink hover:text-ink-strong transition-all duration-200 hover:shadow-glow-sm focus-ring active:shadow-pressed active:scale-[0.98]"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
                </button>
              </div>
              <pre className="p-5 rounded-2xl bg-surface-sunken border border-line text-xs font-mono text-ink overflow-x-auto max-h-[60vh]">
                {JSON.stringify(page, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
