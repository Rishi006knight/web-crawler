import React, { useState, useEffect } from 'react';
import { Play, Settings2, ShieldCheck, ShieldAlert, Check, AlertCircle } from 'lucide-react';
import { CrawlRequest } from '../../types';
import { Button } from '../../components/ui/Button';

interface CrawlFormProps {
  onSubmit: (request: CrawlRequest) => void;
  isLoading: boolean;
  defaultValues?: Partial<CrawlRequest>;
}

export function CrawlForm({ onSubmit, isLoading, defaultValues }: CrawlFormProps) {
  const [url, setUrl] = useState(defaultValues?.url || '');
  const [maxPages, setMaxPages] = useState<number>(defaultValues?.maxPages || 20);
  const [maxDepth, setMaxDepth] = useState<number>(defaultValues?.maxDepth || 2);
  const [concurrency, setConcurrency] = useState<number>(defaultValues?.concurrency || 8);
  const [ignoreRobotsTxt, setIgnoreRobotsTxt] = useState<boolean>(defaultValues?.ignoreRobotsTxt || false);
  const [sameDomainOnly, setSameDomainOnly] = useState<boolean>(true);
  const [urlNormalization, setUrlNormalization] = useState<boolean>(true);
  const [includePattern, setIncludePattern] = useState<string>('');
  const [excludePattern, setExcludePattern] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
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
      concurrency,
      ignoreRobotsTxt,
      sameDomainOnly,
      urlNormalization,
      includePattern: includePattern.trim() || undefined,
      excludePattern: excludePattern.trim() || undefined
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
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-5 shadow-sm space-y-4 text-left"
    >
      {/* URL Input Bar */}
      <div className="space-y-1.5">
        <label htmlFor="target-url" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Target Seed URL
        </label>
        <div className="relative flex items-center">
          <input
            id="target-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            disabled={isLoading}
            required
            className={`w-full pl-4 pr-10 py-3 text-sm rounded-xl bg-white dark:bg-slate-950 border text-slate-900 dark:text-slate-100 placeholder-slate-400 focus-ring transition shadow-inner ${
              urlError
                ? 'border-red-500 focus:border-red-500'
                : isUrlValid
                ? 'border-emerald-500/80 focus:border-emerald-500'
                : 'border-slate-300 dark:border-slate-700 focus:border-sky-500'
            }`}
          />
          <div className="absolute right-3">
            {isUrlValid ? (
              <Check className="w-5 h-5 text-emerald-500" aria-label="Valid URL" />
            ) : urlError ? (
              <AlertCircle className="w-5 h-5 text-red-500" aria-label="Invalid URL" />
            ) : null}
          </div>
        </div>
        {urlError && <p className="text-xs text-red-500 font-medium">{urlError}</p>}
      </div>

      {/* Preset Targets */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400 font-medium text-[11px]">Presets:</span>
        <button
          type="button"
          onClick={() => setPreset('https://books.toscrape.com', 20, 2)}
          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition border border-slate-200 dark:border-slate-700/60 font-mono text-[11px]"
        >
          books.toscrape.com
        </button>
        <button
          type="button"
          onClick={() => setPreset('https://quotes.toscrape.com', 10, 2)}
          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition border border-slate-200 dark:border-slate-700/60 font-mono text-[11px]"
        >
          quotes.toscrape.com
        </button>
        <button
          type="button"
          onClick={() => setPreset('https://example.com', 5, 1)}
          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition border border-slate-200 dark:border-slate-700/60 font-mono text-[11px]"
        >
          example.com
        </button>
      </div>

      {/* Primary Options Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        <div>
          <label htmlFor="max-pages-select" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Max Pages
          </label>
          <select
            id="max-pages-select"
            value={maxPages}
            onChange={(e) => setMaxPages(Number(e.target.value))}
            disabled={isLoading}
            className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus-ring"
          >
            <option value={10}>10 pages</option>
            <option value={20}>20 pages</option>
            <option value={50}>50 pages</option>
            <option value={100}>100 pages</option>
            <option value={250}>250 pages</option>
          </select>
        </div>

        <div>
          <label htmlFor="max-depth-select" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Max Depth
          </label>
          <select
            id="max-depth-select"
            value={maxDepth}
            onChange={(e) => setMaxDepth(Number(e.target.value))}
            disabled={isLoading}
            className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus-ring"
          >
            <option value={1}>1 (Seed only)</option>
            <option value={2}>2 (Direct links)</option>
            <option value={3}>3 (Deep crawl)</option>
            <option value={5}>5 (Maximum)</option>
          </select>
        </div>

        <div>
          <label htmlFor="concurrency-select" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Concurrency
          </label>
          <select
            id="concurrency-select"
            value={concurrency}
            onChange={(e) => setConcurrency(Number(e.target.value))}
            disabled={isLoading}
            className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus-ring"
          >
            <option value={2}>2 workers (Gentle)</option>
            <option value={4}>4 workers (Standard)</option>
            <option value={8}>8 workers (Fast)</option>
            <option value={16}>16 workers (Turbo)</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full px-3 py-2 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center space-x-1.5 focus-ring transition"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>{showAdvanced ? 'Hide Scope' : 'Scope Controls'}</span>
          </button>
        </div>
      </div>

      {/* Advanced Scope Controls */}
      {showAdvanced && (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3.5 animate-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="include-pattern" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Include URL Regex Pattern
              </label>
              <input
                id="include-pattern"
                type="text"
                value={includePattern}
                onChange={(e) => setIncludePattern(e.target.value)}
                placeholder="e.g. /product/.*"
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus-ring font-mono"
              />
            </div>
            <div>
              <label htmlFor="exclude-pattern" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Exclude URL Regex Pattern
              </label>
              <input
                id="exclude-pattern"
                type="text"
                value={excludePattern}
                onChange={(e) => setExcludePattern(e.target.value)}
                placeholder="e.g. /logout|/admin"
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus-ring font-mono"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-1 text-xs">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sameDomainOnly}
                onChange={(e) => setSameDomainOnly(e.target.checked)}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span className="text-slate-700 dark:text-slate-300">Stay within domain</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={urlNormalization}
                onChange={(e) => setUrlNormalization(e.target.checked)}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span className="text-slate-700 dark:text-slate-300">URL Normalization & Dedup</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={ignoreRobotsTxt}
                onChange={(e) => setIgnoreRobotsTxt(e.target.checked)}
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                <span>Override robots.txt</span>
                {ignoreRobotsTxt ? (
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                )}
              </span>
            </label>
          </div>

          {ignoreRobotsTxt && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
              Caution: Overriding robots.txt disables respectful crawl politeness. Only use this on domains you own or have explicit authorization to crawl.
            </p>
          )}
        </div>
      )}

      {/* Full-width thumb-reachable launch button */}
      <Button
        type="submit"
        size="lg"
        isLoading={isLoading}
        disabled={!isUrlValid || isLoading}
        className="w-full text-base font-semibold shadow-lg shadow-sky-500/20"
      >
        <Play className="w-4 h-4 fill-current mr-1" />
        <span>Start Mission Control Crawl</span>
      </Button>
    </form>
  );
}
