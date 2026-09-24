import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  ExternalLink,
  Clock
} from 'lucide-react';
import { PageData, CrawlJob } from '../../types';

interface NetworkGraphProps {
  job: CrawlJob;
  onSelectPage: (page: PageData) => void;
  isRunning?: boolean;
}

interface Node {
  id: string;
  url: string;
  title: string;
  statusCode: number;
  depth: number;
  wordCount: number;
  linksCount: number;
  status: 'processing' | 'completed' | 'error';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rawPage?: PageData;
}

interface Edge {
  source: string;
  target: string;
}

export function NetworkGraph({ job, onSelectPage, isRunning }: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [activeDepthFilter, setActiveDepthFilter] = useState<number | null>(null);

  // Compute pages by depth
  const depthBreakdown = useMemo(() => {
    const map = new Map<number, number>();
    const startHost = (() => {
      try {
        return new URL(job.startUrl).hostname;
      } catch {
        return '';
      }
    })();

    job.pages.forEach((p) => {
      let depth = 0;
      try {
        const u = new URL(p.url);
        const pathSegments = u.pathname.split('/').filter(Boolean);
        depth = Math.min(pathSegments.length, job.maxDepth || 3);
        if (p.url === job.startUrl) depth = 0;
      } catch {
        depth = 1;
      }
      map.set(depth, (map.get(depth) || 0) + 1);
    });

    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([depth, count]) => ({ depth, count }));
  }, [job.pages, job.startUrl, job.maxDepth]);

  // Construct graph data
  const { nodes, edges } = useMemo(() => {
    const nodeMap = new Map<string, Node>();
    const edgeList: Edge[] = [];
    const pages = job.pages || [];

    const width = 800;
    const height = 500;
    const centerX = width / 2;
    const centerY = height / 2;

    pages.forEach((p, idx) => {
      let depth = 0;
      try {
        if (p.url !== job.startUrl) {
          const u = new URL(p.url);
          depth = Math.min(u.pathname.split('/').filter(Boolean).length || 1, 4);
        }
      } catch {
        depth = 1;
      }

      // Arrange nodes in concentric rings by depth
      const ringRadius = depth === 0 ? 0 : 70 + depth * 75;
      const nodesAtDepth = pages.filter((other) => {
        try {
          return other.url === job.startUrl ? depth === 0 : (new URL(other.url).pathname.split('/').filter(Boolean).length || 1) === depth;
        } catch {
          return depth === 1;
        }
      }).length || 1;

      const angle = (idx / Math.max(nodesAtDepth, 1)) * 2 * Math.PI + (depth * 0.4);
      const x = depth === 0 ? centerX : centerX + Math.cos(angle) * (ringRadius + (idx % 3) * 15);
      const y = depth === 0 ? centerY : centerY + Math.sin(angle) * (ringRadius + (idx % 3) * 15);

      const status: 'processing' | 'completed' | 'error' =
        p.statusCode >= 400
          ? 'error'
          : isRunning && idx === pages.length - 1
          ? 'processing'
          : 'completed';

      const radius = depth === 0 ? 14 : Math.min(Math.max(6 + Math.log2((p.links?.length || 1) + 1) * 2, 7), 16);

      const node: Node = {
        id: p.url,
        url: p.url,
        title: p.title || p.url,
        statusCode: p.statusCode || 200,
        depth,
        wordCount: p.wordCount || 0,
        linksCount: p.links?.length || 0,
        status,
        x,
        y,
        vx: 0,
        vy: 0,
        radius,
        rawPage: p
      };
      nodeMap.set(p.url, node);
    });

    // Create edges: root to depth 1, and internal links
    const allUrls = new Set(nodeMap.keys());
    pages.forEach((p) => {
      if (p.url === job.startUrl) {
        // connect root to immediate children
        pages.slice(1, Math.min(pages.length, 12)).forEach((child) => {
          edgeList.push({ source: p.url, target: child.url });
        });
      } else if (p.links) {
        p.links.slice(0, 3).forEach((targetUrl) => {
          if (allUrls.has(targetUrl) && targetUrl !== p.url) {
            edgeList.push({ source: p.url, target: targetUrl });
          }
        });
      }
    });

    return {
      nodes: Array.from(nodeMap.values()),
      edges: edgeList
    };
  }, [job.pages, job.startUrl, isRunning]);

  // Keep a ref of nodes for canvas rendering & interactive physics
  const nodesRef = useRef<Node[]>(nodes);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.resetTransform();
      ctx.scale(dpr, dpr);

      // Clear canvas
      ctx.clearRect(0, 0, rect.width, rect.height);

      ctx.save();
      // Apply pan & zoom
      ctx.translate(rect.width / 2 + pan.x, rect.height / 2 + pan.y);
      ctx.scale(zoom, zoom);
      ctx.translate(-400, -250);

      // Draw subtle concentric background depth rings
      [90, 175, 260, 340].forEach((r, idx) => {
        ctx.beginPath();
        ctx.arc(400, 250, r, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.06)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Draw Edges
      const currentNodes = nodesRef.current;
      const nodePositionMap = new Map<string, { x: number; y: number }>();
      currentNodes.forEach((n) => nodePositionMap.set(n.id, { x: n.x, y: n.y }));

      edges.forEach((edge) => {
        const s = nodePositionMap.get(edge.source);
        const t = nodePositionMap.get(edge.target);
        if (!s || !t) return;

        const grad = ctx.createLinearGradient(s.x, s.y, t.x, t.y);
        grad.addColorStop(0, 'rgba(0, 217, 255, 0.22)');
        grad.addColorStop(1, 'rgba(168, 85, 247, 0.22)');

        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Draw Nodes
      const now = Date.now();
      currentNodes.forEach((node) => {
        const isHovered = hoveredNode?.id === node.id;
        const matchesDepth = activeDepthFilter === null || node.depth === activeDepthFilter;
        const alpha = matchesDepth ? 1 : 0.25;

        // Outer pulse glow for processing or root node
        if (node.status === 'processing' || node.depth === 0) {
          const pulse = (Math.sin(now / 250) + 1) / 2;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 4 + pulse * 4, 0, 2 * Math.PI);
          ctx.fillStyle =
            node.status === 'processing'
              ? `rgba(0, 217, 255, ${0.15 + pulse * 0.2})`
              : `rgba(168, 85, 247, ${0.12 + pulse * 0.15})`;
          ctx.fill();
        }

        // Hover glow
        if (isHovered) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 6, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(0, 217, 255, 0.35)';
          ctx.fill();
        }

        // Node circle with gradient
        ctx.beginPath();
        ctx.arc(node.x, node.y, isHovered ? node.radius * 1.25 : node.radius, 0, 2 * Math.PI);

        const nodeGrad = ctx.createRadialGradient(
          node.x - node.radius * 0.3,
          node.y - node.radius * 0.3,
          1,
          node.x,
          node.y,
          node.radius
        );

        if (node.status === 'error') {
          nodeGrad.addColorStop(0, `rgba(255, 107, 157, ${alpha})`);
          nodeGrad.addColorStop(1, `rgba(239, 68, 68, ${alpha})`);
        } else if (node.status === 'processing') {
          nodeGrad.addColorStop(0, `rgba(0, 217, 255, ${alpha})`);
          nodeGrad.addColorStop(1, `rgba(59, 130, 246, ${alpha})`);
        } else {
          // Completed
          nodeGrad.addColorStop(0, `rgba(0, 217, 255, ${alpha})`);
          nodeGrad.addColorStop(1, `rgba(168, 85, 247, ${alpha})`);
        }

        ctx.fillStyle = nodeGrad;
        ctx.fill();

        // Node border
        ctx.strokeStyle = isHovered ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = isHovered ? 2 : 1;
        ctx.stroke();

        // Label for root node or hovered node
        if (node.depth === 0 || isHovered) {
          ctx.font = '600 10px Inter, system-ui, sans-serif';
          ctx.fillStyle = isHovered ? '#2D3E50' : 'rgba(45, 62, 80, 0.85)';
          ctx.textAlign = 'center';
          const label = node.depth === 0 ? 'START' : node.title.slice(0, 16);
          ctx.fillText(label, node.x, node.y + node.radius + 12);
        }
      });

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [nodes, edges, zoom, pan, hoveredNode, activeDepthFilter]);

  // Handle Mouse Events for Hover, Pan, and Click
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
      return;
    }

    // Hit test for nodes
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.x;
    const mouseY = e.clientY - rect.y;

    // Transform mouse coords to graph space
    const graphX = (mouseX - rect.width / 2 - pan.x) / zoom + 400;
    const graphY = (mouseY - rect.height / 2 - pan.y) / zoom + 250;

    const hit = nodesRef.current.find((node) => {
      const dx = node.x - graphX;
      const dy = node.y - graphY;
      return Math.sqrt(dx * dx + dy * dy) <= node.radius + 4;
    });

    if (hit) {
      setHoveredNode(hit);
      setTooltipPos({ x: e.clientX, y: e.clientY });
    } else {
      setHoveredNode(null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredNode && hoveredNode.rawPage) {
      onSelectPage(hoveredNode.rawPage);
    }
  };

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.min(Math.max(0.4, prev + delta), 2.5));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setActiveDepthFilter(null);
  };

  // Progress metrics calculation
  const totalTarget = job.maxPages || 20;
  const currentCount = job.pages?.length || 0;
  const percentComplete = Math.min(100, Math.round((currentCount / totalTarget) * 100));
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (percentComplete / 100) * circumference;

  return (
    <div className="relative rounded-3xl glass-panel overflow-hidden border border-white/40 shadow-soft animate-slide-up">
      {/* ═══ Header Bar: Progress Ring & Status ═══ */}
      <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-border/50 bg-white/40 backdrop-blur-md">
        <div className="flex items-center space-x-4">
          {/* Progress Ring */}
          <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
            <svg className="w-14 h-14 -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="24"
                className="stroke-surface-sunken"
                strokeWidth="5"
                fill="none"
              />
              <circle
                cx="28"
                cy="28"
                r="24"
                stroke="url(#progress-gradient)"
                strokeWidth="5"
                strokeDasharray={2 * Math.PI * 24}
                strokeDashoffset={2 * Math.PI * 24 - (percentComplete / 100) * (2 * Math.PI * 24)}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-500 ease-out"
              />
              <defs>
                <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00D9FF" />
                  <stop offset="100%" stopColor="#A855F7" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute text-[11px] font-bold font-mono text-ink-strong">
              {percentComplete}%
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-ink-strong">
                {currentCount.toLocaleString()} / {totalTarget.toLocaleString()} Pages
              </span>
              {isRunning && (
                <span className="flex items-center space-x-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                  <span>Live Network</span>
                </span>
              )}
            </div>
            <p className="text-xs text-ink-secondary mt-0.5">
              {isRunning ? 'Crawl in progress... streaming nodes' : 'Network topology complete'}
            </p>
          </div>
        </div>

        {/* Depth Level Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto py-1">
          <span className="text-[11px] font-medium text-ink-muted uppercase tracking-wider mr-1 hidden sm:inline">
            Depth:
          </span>
          <button
            type="button"
            onClick={() => setActiveDepthFilter(null)}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all duration-200 emboss ${
              activeDepthFilter === null
                ? 'gradient-accent text-white shadow-glow-sm'
                : 'glass text-ink-secondary hover:text-ink-strong'
            }`}
          >
            All ({job.pages?.length || 0})
          </button>
          {depthBreakdown.map(({ depth, count }) => (
            <button
              key={depth}
              type="button"
              onClick={() => setActiveDepthFilter(activeDepthFilter === depth ? null : depth)}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all duration-200 emboss flex items-center space-x-1 ${
                activeDepthFilter === depth
                  ? 'gradient-accent text-white shadow-glow-sm'
                  : 'glass text-ink-secondary hover:text-ink-strong'
              }`}
            >
              <span>D{depth}</span>
              <span className="text-[10px] opacity-80 font-mono">({count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Canvas Area ═══ */}
      <div
        ref={containerRef}
        className="relative w-full h-[460px] bg-gradient-to-b from-canvas/40 via-surface/60 to-surface-sunken/40 cursor-grab active:cursor-grabbing select-none"
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleClick}
          className="w-full h-full block"
        />

        {/* Legend Overlay */}
        <div className="absolute top-4 left-4 p-2.5 rounded-2xl glass emboss border border-white/50 backdrop-blur-md text-[11px] space-y-1.5 pointer-events-none hidden sm:block">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-sm" />
            <span className="text-ink-secondary">Processing / Root</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 shadow-sm" />
            <span className="text-ink-secondary">Completed Page</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-pink-400 to-red-500 shadow-sm" />
            <span className="text-ink-secondary">Error / Blocked (4xx/5xx)</span>
          </div>
        </div>

        {/* Zoom & View Controls */}
        <div className="absolute bottom-4 right-4 flex items-center space-x-1.5 p-1.5 rounded-2xl glass emboss border border-white/50 backdrop-blur-md">
          <button
            type="button"
            onClick={() => handleZoom(0.2)}
            className="p-1.5 rounded-xl hover:bg-surface-raised text-ink-secondary hover:text-ink-strong focus-ring transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleZoom(-0.2)}
            className="p-1.5 rounded-xl hover:bg-surface-raised text-ink-secondary hover:text-ink-strong focus-ring transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={resetView}
            className="p-1.5 rounded-xl hover:bg-surface-raised text-ink-secondary hover:text-ink-strong focus-ring transition"
            title="Reset View"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Node Hover Tooltip */}
        {hoveredNode && (
          <div
            className="fixed z-50 pointer-events-none p-3 rounded-2xl glass-strong border border-white/60 shadow-floating text-left max-w-xs space-y-1.5 animate-fade"
            style={{
              left: `${Math.min(tooltipPos.x + 12, window.innerWidth - 300)}px`,
              top: `${Math.min(tooltipPos.y + 12, window.innerHeight - 150)}px`
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-xs text-ink-strong truncate">
                {hoveredNode.title}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                  hoveredNode.statusCode < 400
                    ? 'bg-status-success-bg text-status-success'
                    : 'bg-status-danger-bg text-status-danger'
                }`}
              >
                {hoveredNode.statusCode}
              </span>
            </div>
            <p className="text-[11px] font-mono text-ink-muted truncate">
              {hoveredNode.url}
            </p>
            <div className="flex items-center justify-between text-[10px] text-ink-secondary pt-1 border-t border-line/40">
              <span>Depth {hoveredNode.depth}</span>
              <span>{hoveredNode.wordCount.toLocaleString()} words</span>
              <span>{hoveredNode.linksCount} links</span>
            </div>
            <p className="text-[9px] gradient-accent-text font-semibold pt-0.5">
              Click node to inspect full content
            </p>
          </div>
        )}
      </div>

      {/* ═══ Depth Timeline Footer ═══ */}
      <div className="px-6 py-3 bg-surface/50 border-t border-border/40 flex flex-wrap items-center justify-between text-xs text-ink-secondary gap-3">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-cyan-500" />
          <span>
            Discovered {job.discoveredUrlsCount || job.pages?.length || 0} links across {depthBreakdown.length} depth tier{depthBreakdown.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Depth timeline progression bar */}
        <div className="flex items-center space-x-2 flex-1 max-w-xs">
          <div className="w-full bg-surface-sunken h-2 rounded-full overflow-hidden flex">
            {depthBreakdown.map(({ depth, count }) => {
              const widthPct = ((count / Math.max(job.pages?.length || 1, 1)) * 100);
              return (
                <div
                  key={depth}
                  style={{ width: `${widthPct}%` }}
                  className={`h-full ${
                    depth === 0
                      ? 'bg-cyan-400'
                      : depth === 1
                      ? 'bg-blue-400'
                      : depth === 2
                      ? 'bg-purple-400'
                      : 'bg-pink-400'
                  }`}
                  title={`Depth ${depth}: ${count} pages`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
