import React, { useState, useEffect } from 'react';
import { Play, Check, AlertCircle, Search, Globe } from 'lucide-react';
import { CrawlRequest } from '../../types';

interface CrawlFormProps {
  onSubmit: (request: CrawlRequest) => void;
  isLoading: boolean;
  defaultValues?: Partial<CrawlRequest>;
}

export function CrawlForm({ onSubmit, isLoading, defaultValues }: CrawlFormProps) {
  const [url, setUrl] = useState(defaultValues?.url || '');
  const [maxPages, setMaxPages] = useState<number>(defaultValues?.maxPages || 20);
  const [maxDepth, setMaxDepth] = useState<number>(defaultValues?.maxDepth || 2);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Validate URL as user types
  useEffect(() => {
    if (!url.trim()) {
      setUrlError(null);
      return;
    }
    const trimmed = url.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setUrlError('URL must start with http:// or https://');
      return;
    }
    try {
      const parsed = new URL(trimmed);
      if (['localhost', '127.0.0.1', '::1', '169.254.169.254'].includes(parsed.hostname)) {
        setUrlError('Internal, loopback, and metadata addresses are restricted');
        return;
      }
      setUrlError(null);
    } catch {
      setUrlError('Invalid URL syntax');
    }
  }, [url]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || urlError) return;

    onSubmit({
      url: url.trim(),
      maxPages,
      maxDepth,
      sameDomainOnly: true,
      urlNormalization: true,
      ignoreRobotsTxt: false
    });
  };

  const setPreset = (presetUrl: string, pages: number = 20, depth: number = 2) => {
    setUrl(presetUrl);
    setMaxPages(pages);
    setMaxDepth(depth);
  };

  const isUrlValid = url.trim().length > 0 && !urlError;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl glass-panel p-6 sm:p-8 space-y-5 text-left animate-slide-up"
    >
      {/* Hero Title */}
      <div className="space-y-1.5">
        <h2 className="text-lg sm:text-xl font-bold text-ink-strong flex items-center space-x-2">
          <Globe className="w-5 h-5 text-gradient-start" />
          <span>Crawl any website</span>
        </h2>
        <p className="text-xs sm:text-sm text-ink-secondary">
          Analyze structure. Extract data. Discover insights.
        </p>
      </div>

      {/* URL Input Bar */}
      <div className="space-y-2">
        <label htmlFor="target-url" className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
          Target Seed URL
        </label>
        <div className="relative flex items-center">
          <div className="absolute left-4">
            <Search className="w-5 h-5 text-ink-muted" />
          </div>
          <input
            id="target-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL to analyze..."
            disabled={isLoading}
            required
            className={`w-full pl-12 pr-12 py-4 text-sm rounded-2xl bg-surface-raised border-2 text-ink-strong placeholder:text-ink-muted focus-ring transition-all duration-300 emboss ${
              urlError
                ? 'border-status-danger focus:border-status-danger focus:shadow-none'
                : isUrlValid
                ? 'border-status-success/50 focus:border-status-success focus:shadow-glow-sm'
                : 'border-line hover:border-line-strong focus:border-gradient-start focus:shadow-glow-sm'
            }`}
          />
          <div className="absolute right-4">
            {isUrlValid ? (
              <div className="w-6 h-6 rounded-full gradient-accent flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-white" aria-label="Valid URL" />
              </div>
            ) : urlError ? (
              <AlertCircle className="w-5 h-5 text-status-danger" aria-label="Invalid URL" />
            ) : null}
          </div>
        </div>
        {urlError && <p className="text-xs text-status-danger font-medium">{urlError}</p>}
      </div>

      {/* Preset Targets */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-ink-muted font-medium text-[11px] uppercase tracking-wider">Try:</span>
        {[
          { label: 'books.toscrape.com', url: 'https://books.toscrape.com', pages: 20, depth: 2 },
          { label: 'quotes.toscrape.com', url: 'https://quotes.toscrape.com', pages: 10, depth: 2 },
          { label: 'example.com', url: 'https://example.com', pages: 5, depth: 1 },
        ].map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => setPreset(preset.url, preset.pages, preset.depth)}
            className="px-3 py-1.5 rounded-xl glass emboss text-ink-secondary hover:text-ink-strong transition-all duration-200 font-mono text-[11px] hover:shadow-glow-sm active:shadow-pressed active:scale-[0.98]"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Primary Options Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="max-pages-select" className="block text-xs font-semibold text-ink-strong mb-1.5">
            Max Pages
          </label>
          <select
            id="max-pages-select"
            value={maxPages}
            onChange={(e) => setMaxPages(Number(e.target.value))}
            disabled={isLoading}
            className="w-full px-3 py-2.5 text-sm rounded-xl bg-surface-raised border border-line text-ink-strong focus-ring emboss cursor-pointer"
          >
            <option value={10}>10 pages</option>
            <option value={20}>20 pages</option>
            <option value={50}>50 pages</option>
            <option value={100}>100 pages</option>
            <option value={250}>250 pages</option>
          </select>
        </div>

        <div>
          <label htmlFor="max-depth-select" className="block text-xs font-semibold text-ink-strong mb-1.5">
            Max Depth
          </label>
          <select
            id="max-depth-select"
            value={maxDepth}
            onChange={(e) => setMaxDepth(Number(e.target.value))}
            disabled={isLoading}
            className="w-full px-3 py-2.5 text-sm rounded-xl bg-surface-raised border border-line text-ink-strong focus-ring emboss cursor-pointer"
          >
            <option value={1}>1 (Seed only)</option>
            <option value={2}>2 (Direct links)</option>
            <option value={3}>3 (Deep crawl)</option>
            <option value={5}>5 (Maximum)</option>
          </select>
        </div>
      </div>

      {/* CTA Launch Button */}
      <button
        type="submit"
        disabled={!isUrlValid || isLoading}
        className="w-full py-4 text-sm font-bold rounded-2xl text-white gradient-accent shadow-soft hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] active:shadow-pressed transition-all duration-200 focus-ring disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-soft flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <>
            <span className="animate-spin inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full" />
            <span>Initiating Crawl...</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-current" />
            <span>Start Crawl</span>
          </>
        )}
      </button>
    </form>
  );
}
