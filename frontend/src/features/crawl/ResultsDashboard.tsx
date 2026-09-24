import React, { useState } from 'react';
import {
  FileText,
  Link2,
  Layers,
  BarChart3,
  Download,
  Search,
  XCircle
} from 'lucide-react';
import { PageData, CrawlJob } from '../../types';
import { ResultsTable } from './ResultsTable';
import { ResultsCards } from './ResultsCards';
import { LinkAnalysisTab } from './tabs/LinkAnalysisTab';
import { SiteStructureTab } from './tabs/SiteStructureTab';
import { AnalyticsTab } from './tabs/AnalyticsTab';
import { ExportTab } from './tabs/ExportTab';
import { ExportMenu } from './ExportMenu';

interface ResultsDashboardProps {
  job: CrawlJob;
  filteredPages: PageData[];
  pagesToExport: PageData[];
  selectedUrls: Set<string>;
  searchFilter: string;
  onSearchChange: (value: string) => void;
  onSelectPage: (page: PageData) => void;
  onToggleSelectPage: (url: string) => void;
  onToggleSelectAll: () => void;
}

export type DashboardTab = 'pages' | 'links' | 'structure' | 'analytics' | 'export';

export function ResultsDashboard({
  job,
  filteredPages,
  pagesToExport,
  selectedUrls,
  searchFilter,
  onSearchChange,
  onSelectPage,
  onToggleSelectPage,
  onToggleSelectAll
}: ResultsDashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('pages');

  const tabs: { id: DashboardTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'pages', label: 'Pages Overview', icon: <FileText className="w-4 h-4" />, badge: job.pages?.length || 0 },
    { id: 'links', label: 'Link Analysis', icon: <Link2 className="w-4 h-4" /> },
    { id: 'structure', label: 'Site Structure', icon: <Layers className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'export', label: 'Export Data', icon: <Download className="w-4 h-4" /> }
  ];

  return (
    <div className="space-y-5 animate-slide-up">
      {/* ═══ Sticky Navigation Tabs Bar ═══ */}
      <div className="sticky top-20 z-20 p-2 rounded-3xl glass-panel border border-white/50 backdrop-blur-xl shadow-soft flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto w-full sm:w-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-semibold flex items-center space-x-2 transition-all duration-200 emboss shrink-0 ${
                  isActive
                    ? 'gradient-accent text-white shadow-glow-sm'
                    : 'glass text-ink-secondary hover:text-ink-strong'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-surface-sunken text-ink-muted'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Global Export CTA Quick Button */}
        <div className="hidden md:flex items-center space-x-2">
          <ExportMenu
            job={job}
            pagesToExport={pagesToExport}
            selectedCount={selectedUrls.size}
          />
        </div>
      </div>

      {/* ═══ Tab 1: Pages Overview ═══ */}
      {activeTab === 'pages' && (
        <div className="space-y-4">
          {/* Search Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Filter by title, URL or body text..."
                className="w-full pl-10 pr-8 py-2.5 text-xs rounded-2xl glass emboss text-ink-strong placeholder:text-ink-muted focus-ring transition-all duration-200 focus:shadow-glow-sm"
              />
              {searchFilter && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  aria-label="Clear filter"
                  className="absolute right-3 top-2.5 text-ink-muted hover:text-ink transition"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="text-xs text-ink-muted flex items-center space-x-2">
              <span>Showing {filteredPages.length} of {job.pages?.length || 0} pages</span>
              {selectedUrls.size > 0 && (
                <span className="font-semibold gradient-accent-text">
                  ({selectedUrls.size} selected)
                </span>
              )}
            </div>
          </div>

          {/* Filter Mismatch State */}
          {job.pages && job.pages.length > 0 && filteredPages.length === 0 && (
            <div className="p-8 text-center rounded-3xl glass-panel space-y-2">
              <p className="text-sm text-ink-secondary">
                No pages match filter &ldquo;{searchFilter}&rdquo;
              </p>
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="text-xs gradient-accent-text hover:underline font-semibold"
              >
                Clear Search Filter
              </button>
            </div>
          )}

          {/* Desktop Table View */}
          {filteredPages.length > 0 && (
            <div className="hidden sm:block">
              <ResultsTable
                pages={filteredPages}
                onSelectPage={onSelectPage}
                selectedPages={selectedUrls}
                onToggleSelectPage={onToggleSelectPage}
                onToggleSelectAll={onToggleSelectAll}
                searchQuery={searchFilter}
              />
            </div>
          )}

          {/* Mobile Card View (<640px) */}
          {filteredPages.length > 0 && (
            <ResultsCards
              pages={filteredPages}
              onSelectPage={onSelectPage}
              selectedPages={selectedUrls}
              onToggleSelectPage={onToggleSelectPage}
              searchQuery={searchFilter}
            />
          )}
        </div>
      )}

      {/* ═══ Tab 2: Link Analysis ═══ */}
      {activeTab === 'links' && (
        <LinkAnalysisTab job={job} onSelectPage={onSelectPage} />
      )}

      {/* ═══ Tab 3: Site Structure ═══ */}
      {activeTab === 'structure' && (
        <SiteStructureTab job={job} onSelectPage={onSelectPage} />
      )}

      {/* ═══ Tab 4: Analytics ═══ */}
      {activeTab === 'analytics' && (
        <AnalyticsTab job={job} />
      )}

      {/* ═══ Tab 5: Export ═══ */}
      {activeTab === 'export' && (
        <ExportTab job={job} pagesToExport={pagesToExport} />
      )}
    </div>
  );
}
