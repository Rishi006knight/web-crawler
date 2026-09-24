import React, { useState, useMemo } from 'react';
import {
  Link2,
  ExternalLink,
  ArrowUpRight,
  Search,
  Globe,
  Share2,
  Layers,
  BarChart3
} from 'lucide-react';
import { PageData, CrawlJob } from '../../../types';

interface LinkAnalysisTabProps {
  job: CrawlJob;
  onSelectPage: (page: PageData) => void;
}

export function LinkAnalysisTab({ job, onSelectPage }: LinkAnalysisTabProps) {
  const [filterQuery, setFilterQuery] = useState('');
  const [activeDomainFilter, setActiveDomainFilter] = useState<'all' | 'internal' | 'external'>('all');
  const [hoveredPoint, setHoveredPoint] = useState<PageData | null>(null);

  const startDomain = useMemo(() => {
    try {
      return new URL(job.startUrl).hostname;
    } catch {
      return '';
    }
  }, [job.startUrl]);

  // Aggregate outbound links across all pages
  const { topLinks, domainDistribution, maxLinksPerPage } = useMemo(() => {
    const linkFrequency = new Map<string, { count: number; isInternal: boolean; sourceUrls: string[] }>();
    const domainCounts = new Map<string, number>();
    let maxLinks = 1;

    (job.pages || []).forEach((p) => {
      const pageLinkCount = p.links?.length || 0;
      if (pageLinkCount > maxLinks) maxLinks = pageLinkCount;

      (p.links || []).forEach((link) => {
        let isInternal = true;
        let hostname = '';
        try {
          const parsed = new URL(link);
          hostname = parsed.hostname;
          isInternal = parsed.hostname === startDomain || parsed.hostname.endsWith(`.${startDomain}`);
        } catch {
          isInternal = true;
          hostname = startDomain;
        }

        domainCounts.set(hostname, (domainCounts.get(hostname) || 0) + 1);

        const current = linkFrequency.get(link) || { count: 0, isInternal, sourceUrls: [] };
        current.count += 1;
        if (current.sourceUrls.length < 5) current.sourceUrls.push(p.url);
        linkFrequency.set(link, current);
      });
    });

    const sortedLinks = Array.from(linkFrequency.entries())
      .map(([url, data]) => ({ url, ...data }))
      .sort((a, b) => b.count - a.count);

    const sortedDomains = Array.from(domainCounts.entries())
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count);

    return {
      topLinks: sortedLinks,
      domainDistribution: sortedDomains,
      maxLinksPerPage: maxLinks
    };
  }, [job.pages, startDomain]);

  // Filtered links list
  const filteredLinks = useMemo(() => {
    return topLinks.filter((item) => {
      if (activeDomainFilter === 'internal' && !item.isInternal) return false;
      if (activeDomainFilter === 'external' && item.isInternal) return false;
      if (!filterQuery.trim()) return true;
      return item.url.toLowerCase().includes(filterQuery.toLowerCase());
    });
  }, [topLinks, activeDomainFilter, filterQuery]);

  // Interactive Bubble Chart calculations
  const pages = job.pages || [];
  const maxWords = useMemo(() => {
    return Math.max(...pages.map((p) => p.wordCount || 100), 1000);
  }, [pages]);

  return (
    <div className="space-y-6 text-left">
      {/* ═══ Top Overview Metrics ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl glass-panel space-y-1">
          <div className="flex items-center justify-between text-ink-secondary text-xs">
            <span>Total Unique Links</span>
            <Link2 className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-bold font-mono gradient-accent-text">
            {topLinks.length.toLocaleString()}
          </div>
          <p className="text-[11px] text-ink-muted">Extracted across {pages.length} crawled pages</p>
        </div>

        <div className="p-5 rounded-2xl glass-panel space-y-1">
          <div className="flex items-center justify-between text-ink-secondary text-xs">
            <span>Internal vs External</span>
            <Globe className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-ink-strong">
            {topLinks.filter((l) => l.isInternal).length}{' '}
            <span className="text-sm font-normal text-ink-muted">
              / {topLinks.filter((l) => !l.isInternal).length} ext
            </span>
          </div>
          <p className="text-[11px] text-ink-muted">Target host: {startDomain || 'Same-origin'}</p>
        </div>

        <div className="p-5 rounded-2xl glass-panel space-y-1">
          <div className="flex items-center justify-between text-ink-secondary text-xs">
            <span>Peak Page Outbound</span>
            <Share2 className="w-4 h-4 text-pink-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-ink-strong">
            {maxLinksPerPage} links
          </div>
          <p className="text-[11px] text-ink-muted">Density peak on highest-connected document</p>
        </div>
      </div>

      {/* ═══ Main Split: Interactive Bubble Chart (Left) + Top Links (Right) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Bubble Chart */}
        <div className="lg:col-span-7 rounded-3xl glass-panel p-6 space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-ink-strong flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-cyan-500" />
                <span>Link Distribution Matrix (Bubble Scatter)</span>
              </h3>
              <p className="text-xs text-ink-secondary">
                X = Page Index &bull; Y = Outbound Link Count &bull; Bubble Size = Word Count
              </p>
            </div>
          </div>

          {/* SVG Bubble Chart Area */}
          <div className="relative flex-1 min-h-[340px] bg-surface-sunken/40 rounded-2xl p-4 border border-line/40 flex items-center justify-center">
            {pages.length === 0 ? (
              <p className="text-xs text-ink-muted">No page link data available yet.</p>
            ) : (
              <svg className="w-full h-full min-h-[300px]" viewBox="0 0 500 300">
                {/* Horizontal grid lines */}
                {[0.25, 0.5, 0.75].map((pct) => (
                  <line
                    key={pct}
                    x1="40"
                    y1={300 * pct}
                    x2="480"
                    y2={300 * pct}
                    stroke="rgba(0,0,0,0.06)"
                    strokeDasharray="4 4"
                  />
                ))}

                {/* Axis lines */}
                <line x1="40" y1="20" x2="40" y2="270" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
                <line x1="40" y1="270" x2="480" y2="270" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />

                {/* Y Axis Label */}
                <text x="12" y="145" fontSize="9" fill="rgba(0,0,0,0.4)" transform="rotate(-90 12,145)">
                  Outbound Links
                </text>
                {/* X Axis Label */}
                <text x="240" y="290" fontSize="9" fill="rgba(0,0,0,0.4)">
                  Pages Crawled
                </text>

                {/* Render Bubbles */}
                {pages.map((p, idx) => {
                  const x = 50 + (idx / Math.max(pages.length - 1, 1)) * 410;
                  const outbound = p.links?.length || 0;
                  const y = 260 - (outbound / Math.max(maxLinksPerPage, 1)) * 220;
                  const radius = Math.min(Math.max(5 + ((p.wordCount || 100) / maxWords) * 16, 6), 22);

                  const isHovered = hoveredPoint?.url === p.url;

                  return (
                    <g key={p.url}>
                      <circle
                        cx={x}
                        cy={y}
                        r={radius}
                        fill={isHovered ? '#00D9FF' : 'url(#bubble-grad)'}
                        fillOpacity={isHovered ? 0.9 : 0.65}
                        stroke="#FFFFFF"
                        strokeWidth={isHovered ? 2.5 : 1}
                        className="cursor-pointer transition-all duration-200"
                        onMouseEnter={() => setHoveredPoint(p)}
                        onMouseLeave={() => setHoveredPoint(null)}
                        onClick={() => onSelectPage(p)}
                      />
                    </g>
                  );
                })}

                <defs>
                  <linearGradient id="bubble-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00D9FF" />
                    <stop offset="100%" stopColor="#A855F7" />
                  </linearGradient>
                </defs>
              </svg>
            )}

            {/* Hover Tooltip inside Chart */}
            {hoveredPoint && (
              <div className="absolute top-4 right-4 p-3 rounded-2xl glass-strong border border-white/60 shadow-floating text-left max-w-xs animate-fade pointer-events-none">
                <p className="font-semibold text-xs text-ink-strong truncate">
                  {hoveredPoint.title || hoveredPoint.url}
                </p>
                <p className="text-[10px] font-mono text-ink-muted truncate">{hoveredPoint.url}</p>
                <div className="flex items-center space-x-3 text-[11px] text-ink-secondary pt-1.5 border-t border-line/40">
                  <span>
                    <strong>{hoveredPoint.links?.length || 0}</strong> Outbound
                  </span>
                  <span>
                    <strong>{(hoveredPoint.wordCount || 0).toLocaleString()}</strong> Words
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top Referenced Links Sidebar */}
        <div className="lg:col-span-5 rounded-3xl glass-panel p-6 space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink-strong flex items-center space-x-2">
              <Link2 className="w-4 h-4 text-purple-500" />
              <span>Top Referenced Links</span>
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-surface-sunken text-ink-muted">
              {filteredLinks.length} total
            </span>
          </div>

          {/* Filter Bar & Pills */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-2.5" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter URLs or domains..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl glass emboss text-ink-strong placeholder:text-ink-muted focus-ring"
              />
            </div>
            <div className="flex items-center space-x-1.5">
              {(['all', 'internal', 'external'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setActiveDomainFilter(mode)}
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium capitalize transition ${
                    activeDomainFilter === mode
                      ? 'gradient-accent text-white shadow-sm'
                      : 'text-ink-secondary hover:text-ink-strong'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Links List */}
          <div className="flex-1 overflow-y-auto max-h-[380px] space-y-2 pr-1">
            {filteredLinks.length === 0 ? (
              <p className="text-xs text-ink-muted py-6 text-center">No links matched criteria.</p>
            ) : (
              filteredLinks.slice(0, 30).map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl glass emboss hover:bg-surface-raised transition-all flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <span className="text-[10px] font-mono text-ink-muted w-5 shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-[11px] text-ink-strong hover:gradient-accent-text truncate flex items-center space-x-1"
                      >
                        <span className="truncate">{item.url}</span>
                        <ArrowUpRight className="w-3 h-3 shrink-0 opacity-60" />
                      </a>
                      <div className="flex items-center space-x-2 text-[10px] text-ink-muted mt-0.5">
                        <span
                          className={`px-1 rounded ${
                            item.isInternal
                              ? 'bg-cyan-500/10 text-cyan-600'
                              : 'bg-purple-500/10 text-purple-600'
                          }`}
                        >
                          {item.isInternal ? 'Internal' : 'External'}
                        </span>
                        <span>Referenced on {item.count} page{item.count !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-lg gradient-accent text-white font-mono text-[11px] font-bold shrink-0">
                    {item.count}x
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
