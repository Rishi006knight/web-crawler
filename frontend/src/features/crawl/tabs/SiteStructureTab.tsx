import React, { useState, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronDown,
  Layers,
  Globe,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { PageData, CrawlJob } from '../../../types';

interface SiteStructureTabProps {
  job: CrawlJob;
  onSelectPage: (page: PageData) => void;
}

interface TreeNode {
  name: string;
  path: string;
  depth: number;
  isFolder: boolean;
  page?: PageData;
  children: Map<string, TreeNode>;
}

export function SiteStructureTab({ job, onSelectPage }: SiteStructureTabProps) {
  const [filterQuery, setFilterQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));
  const [selectedBreadcrumbs, setSelectedBreadcrumbs] = useState<string[]>([]);

  // Build hierarchical tree from URLs
  const treeRoot = useMemo(() => {
    const root: TreeNode = {
      name: 'Site Root',
      path: 'root',
      depth: 0,
      isFolder: true,
      children: new Map()
    };

    const pages = job.pages || [];
    pages.forEach((page) => {
      try {
        const u = new URL(page.url);
        const segments = u.pathname.split('/').filter(Boolean);

        let current = root;
        let cumulativePath = 'root';

        segments.forEach((seg, idx) => {
          cumulativePath += '/' + seg;
          const isLeaf = idx === segments.length - 1;

          if (!current.children.has(seg)) {
            current.children.set(seg, {
              name: seg,
              path: cumulativePath,
              depth: idx + 1,
              isFolder: !isLeaf,
              page: isLeaf ? page : undefined,
              children: new Map()
            });
          } else if (isLeaf) {
            const existing = current.children.get(seg)!;
            existing.page = page;
          }
          current = current.children.get(seg)!;
        });

        // If root path itself
        if (segments.length === 0) {
          root.page = page;
        }
      } catch {
        // Fallback for non-standard URLs
        root.children.set(page.url, {
          name: page.title || page.url,
          path: page.url,
          depth: 1,
          isFolder: false,
          page,
          children: new Map()
        });
      }
    });

    return root;
  }, [job.pages]);

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const expandAll = () => {
    const all = new Set<string>();
    const traverse = (node: TreeNode) => {
      if (node.isFolder) {
        all.add(node.path);
        node.children.forEach(traverse);
      }
    };
    traverse(treeRoot);
    setExpandedFolders(all);
  };

  const collapseAll = () => {
    setExpandedFolders(new Set(['root']));
  };

  // Render tree node recursively
  const renderNode = (node: TreeNode, indent: number = 0) => {
    const hasChildren = node.children.size > 0;
    const isExpanded = expandedFolders.has(node.path) || filterQuery.trim().length > 0;
    const matchesFilter =
      !filterQuery.trim() ||
      node.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (node.page?.title && node.page.title.toLowerCase().includes(filterQuery.toLowerCase()));

    const childNodes = Array.from(node.children.values());

    return (
      <div key={node.path} className="space-y-1">
        {node.path !== 'root' && matchesFilter && (
          <div
            style={{ paddingLeft: `${indent * 20}px` }}
            className="flex items-center space-x-2 py-1.5 px-2 rounded-xl hover:bg-surface-raised/70 group transition-colors"
          >
            {/* Folder Toggle Icon */}
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleFolder(node.path)}
                className="p-1 rounded-lg text-ink-muted hover:text-ink-strong transition"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <span className="w-5" />
            )}

            {/* Folder / File Icon */}
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen className="w-4 h-4 text-cyan-500 shrink-0" />
              ) : (
                <Folder className="w-4 h-4 text-cyan-600 shrink-0" />
              )
            ) : (
              <FileText className="w-4 h-4 text-purple-500 shrink-0" />
            )}

            {/* Title / Name */}
            <span
              onClick={() => {
                if (node.page) {
                  onSelectPage(node.page);
                  setSelectedBreadcrumbs(node.path.split('/').filter((s) => s !== 'root'));
                } else if (hasChildren) {
                  toggleFolder(node.path);
                }
              }}
              className={`text-xs truncate cursor-pointer font-medium ${
                node.page
                  ? 'text-ink-strong hover:gradient-accent-text'
                  : 'text-ink-secondary hover:text-ink-strong'
              }`}
            >
              {node.name}
              {node.page?.title && (
                <span className="ml-2 text-[11px] text-ink-muted hidden sm:inline">
                  — {node.page.title}
                </span>
              )}
            </span>

            {/* Depth Badge */}
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-surface-sunken text-ink-muted ml-auto shrink-0">
              Depth {node.depth}
            </span>

            {/* Status / Inspect CTA */}
            {node.page && (
              <button
                type="button"
                onClick={() => onSelectPage(node.page!)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-ink-muted hover:text-ink-strong hover:bg-surface-sunken transition"
                title="Inspect Page"
              >
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Children Container */}
        {(isExpanded || node.path === 'root') && hasChildren && (
          <div className="border-l border-line/40 ml-4">
            {childNodes.map((child) => renderNode(child, indent + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 text-left">
      {/* ═══ Header Controls & Search ═══ */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-ink-strong flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-500" />
            <span>Site Hierarchy & Directory Tree</span>
          </h3>
          <p className="text-xs text-ink-secondary mt-0.5">
            Nested URL path structure discovered during the crawl
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={expandAll}
            className="px-3 py-1.5 rounded-xl glass emboss text-xs text-ink-secondary hover:text-ink-strong transition"
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="px-3 py-1.5 rounded-xl glass emboss text-xs text-ink-secondary hover:text-ink-strong transition"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* ═══ Search & Breadcrumb Bar ═══ */}
      <div className="p-4 rounded-2xl glass-panel space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-3" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter folders or pages by name..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl glass emboss text-ink-strong placeholder:text-ink-muted focus-ring"
          />
        </div>

        {selectedBreadcrumbs.length > 0 && (
          <div className="flex items-center space-x-1.5 text-xs text-ink-secondary overflow-x-auto pt-1">
            <span className="text-ink-muted text-[11px] uppercase tracking-wider">Path:</span>
            <span className="font-semibold text-ink-strong">Root</span>
            {selectedBreadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight className="w-3 h-3 text-ink-muted shrink-0" />
                <span className="px-2 py-0.5 rounded-md bg-surface-sunken text-ink-strong font-mono text-[11px]">
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* ═══ Tree Explorer Panel ═══ */}
      <div className="p-6 rounded-3xl glass-panel border border-white/50 max-h-[550px] overflow-y-auto">
        {job.pages?.length === 0 ? (
          <p className="text-xs text-ink-muted py-10 text-center">No pages in site tree.</p>
        ) : (
          renderNode(treeRoot)
        )}
      </div>
    </div>
  );
}
