import React, { useRef, useEffect, useState } from 'react';
import { CrawlResult, PageInfo } from '../types';
import { RotateCcw } from 'lucide-react';

interface LinkGraphTabProps {
  job: CrawlResult;
  onSelectPage: (page: PageInfo) => void;
}

interface GraphNode {
  id: string;
  url: string;
  title: string;
  isSeed: boolean;
  depth: number;
  wordCount: number;
  radius: number;
  color: string;
  internal: number;
  external: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isPinned?: boolean;
  pageInfo?: PageInfo;
}

interface GraphLink {
  source: GraphNode;
  target: GraphNode;
}

export const LinkGraphTab: React.FC<LinkGraphTabProps> = ({ job, onSelectPage }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tooltip, setTooltip] = useState<{ node: GraphNode; x: number; y: number } | null>(null);

  const stateRef = useRef<{
    nodes: GraphNode[];
    links: GraphLink[];
    zoom: number;
    pan: { x: number; y: number };
    isDragging: boolean;
    dragStart: { x: number; y: number };
    selectedNode: GraphNode | null;
  }>({
    nodes: [],
    links: [],
    zoom: 1,
    pan: { x: 400, y: 300 },
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    selectedNode: null
  });

  // Build Graph Nodes & Links
  useEffect(() => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const nodeMap = new Map<string, GraphNode>();

    const seedUrl = job.seedUrl;
    const seedNode: GraphNode = {
      id: seedUrl,
      url: seedUrl,
      title: 'Seed URL (Root)',
      isSeed: true,
      depth: 0,
      wordCount: 100,
      radius: 16,
      color: '#f59e0b',
      internal: 0,
      external: 0,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0
    };
    nodes.push(seedNode);
    nodeMap.set(seedUrl, seedNode);

    if (job.pageInfos) {
      job.pageInfos.forEach((p, idx) => {
        if (!nodeMap.has(p.url)) {
          const isDup = p.duplicate;
          const node: GraphNode = {
            id: p.url,
            url: p.url,
            title: p.title || `Page ${idx + 1}`,
            isSeed: p.url === seedUrl,
            depth: p.depth || 1,
            wordCount: p.wordCount || 0,
            radius: Math.min(18, Math.max(7, Math.sqrt(p.wordCount || 50) * 0.7)),
            color: p.url === seedUrl ? '#f59e0b' : isDup ? '#a855f7' : '#06b6d4',
            internal: p.internalLinkCount || 0,
            external: p.externalLinkCount || 0,
            x: (Math.random() - 0.5) * 400,
            y: (Math.random() - 0.5) * 400,
            vx: 0,
            vy: 0,
            pageInfo: p
          };
          nodes.push(node);
          nodeMap.set(p.url, node);
          links.push({ source: seedNode, target: node });
        }
      });
    }

    if (job.failedUrls) {
      job.failedUrls.forEach((f) => {
        if (!nodeMap.has(f.url)) {
          const failNode: GraphNode = {
            id: f.url,
            url: f.url,
            title: `Blocked / Failed (${f.statusCode || 500})`,
            isSeed: false,
            depth: 2,
            wordCount: 0,
            radius: 6,
            color: '#ef4444',
            internal: 0,
            external: 0,
            x: (Math.random() - 0.5) * 500,
            y: (Math.random() - 0.5) * 500,
            vx: 0,
            vy: 0
          };
          nodes.push(failNode);
          nodeMap.set(f.url, failNode);
          links.push({ source: seedNode, target: failNode });
        }
      });
    }

    stateRef.current.nodes = nodes;
    stateRef.current.links = links;
  }, [job]);

  // Simulation & Animation loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      if (containerRef.current && canvas) {
        canvas.width = containerRef.current.clientWidth;
        canvas.height = containerRef.current.clientHeight;
        stateRef.current.pan = { x: canvas.width / 2, y: canvas.height / 2 };
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      const { nodes, links, zoom, pan } = stateRef.current;

      // Force calculations
      const k = 0.05;
      const rep = 800;
      const length = 90;

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = rep / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          if (!nodes[i].isPinned && !nodes[i].isSeed) {
            nodes[i].vx -= fx;
            nodes[i].vy -= fy;
          }
          if (!nodes[j].isPinned && !nodes[j].isSeed) {
            nodes[j].vx += fx;
            nodes[j].vy += fy;
          }
        }
      }

      for (const link of links) {
        const dx = link.target.x - link.source.x;
        const dy = link.target.y - link.source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - length) * k;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (!link.source.isPinned && !link.source.isSeed) {
          link.source.vx += fx;
          link.source.vy += fy;
        }
        if (!link.target.isPinned && !link.target.isSeed) {
          link.target.vx -= fx;
          link.target.vy -= fy;
        }
      }

      for (const node of nodes) {
        if (!node.isPinned && !node.isSeed) {
          node.vx *= 0.85;
          node.vy *= 0.85;
          node.x += node.vx;
          node.y += node.vy;
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // Links
      ctx.lineWidth = 1.2;
      for (const link of links) {
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.45)';
        ctx.beginPath();
        ctx.moveTo(link.source.x, link.source.y);
        ctx.lineTo(link.target.x, link.target.y);
        ctx.stroke();
      }

      // Nodes
      for (const node of nodes) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = node.isSeed ? 16 : 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (node.isSeed) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 6, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
          ctx.stroke();
        }
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { pan, zoom, nodes } = stateRef.current;
    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;

    let clicked: GraphNode | null = null;
    for (const node of nodes) {
      const dx = node.x - mouseX;
      const dy = node.y - mouseY;
      if (Math.sqrt(dx * dx + dy * dy) <= node.radius + 4) {
        clicked = node;
        break;
      }
    }

    if (clicked) {
      stateRef.current.selectedNode = clicked;
      clicked.isPinned = true;
      if (clicked.pageInfo) {
        onSelectPage(clicked.pageInfo);
      }
    } else {
      stateRef.current.isDragging = true;
      stateRef.current.dragStart = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    const { pan, zoom, nodes, isDragging, dragStart, selectedNode } = stateRef.current;
    const mouseX = (rawX - pan.x) / zoom;
    const mouseY = (rawY - pan.y) / zoom;

    if (selectedNode && selectedNode.isPinned) {
      selectedNode.x = mouseX;
      selectedNode.y = mouseY;
      return;
    }

    if (isDragging) {
      stateRef.current.pan = { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y };
      return;
    }

    let hovered: GraphNode | null = null;
    for (const node of nodes) {
      const dx = node.x - mouseX;
      const dy = node.y - mouseY;
      if (Math.sqrt(dx * dx + dy * dy) <= node.radius + 4) {
        hovered = node;
        break;
      }
    }

    if (hovered) {
      setTooltip({ node: hovered, x: rawX + 15, y: rawY + 15 });
    } else {
      setTooltip(null);
    }
  };

  const handleMouseUp = () => {
    if (stateRef.current.selectedNode) {
      stateRef.current.selectedNode.isPinned = false;
      stateRef.current.selectedNode = null;
    }
    stateRef.current.isDragging = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    stateRef.current.zoom = Math.max(0.2, Math.min(4, stateRef.current.zoom * factor));
  };

  const resetView = () => {
    if (canvasRef.current) {
      stateRef.current.zoom = 1;
      stateRef.current.pan = {
        x: canvasRef.current.width / 2,
        y: canvasRef.current.height / 2
      };
    }
  };

  return (
    <div className="space-y-4">
      <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            Interactive Crawl Link Graph (BFS Force-Directed Simulation)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Seed radiates outward by depth. Node size indicates word count. Click any node to open the Page Inspector Drawer.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400" /> Seed</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-cyan-400" /> Visited</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-purple-400" /> Duplicate</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500" /> Failed</div>
          <button
            onClick={resetView}
            className="px-2.5 py-1 bg-space-800 hover:bg-space-700 text-slate-200 text-xs rounded border border-slate-700 transition flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Reset View
          </button>
        </div>
      </div>

      <div ref={containerRef} className="relative w-full h-[620px] rounded-xl overflow-hidden glass-panel border border-slate-800">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          className="w-full h-full cursor-grab active:cursor-grabbing block"
        />

        {tooltip && (
          <div
            style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
            className="absolute pointer-events-none bg-space-900/95 border border-cyan-500/40 p-3 rounded-lg text-xs shadow-2xl z-20 max-w-sm backdrop-blur-md"
          >
            <div className="font-bold text-cyan-300 truncate">{tooltip.node.title}</div>
            <div className="text-[11px] font-mono text-slate-400 truncate mt-0.5">{tooltip.node.url}</div>
            <div className="mt-2 pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div>Depth: <span className="text-slate-200 font-bold">{tooltip.node.depth}</span></div>
              <div>Words: <span className="text-slate-200 font-bold">{tooltip.node.wordCount}</span></div>
              <div>Internal: <span className="text-slate-200 font-bold">{tooltip.node.internal}</span></div>
              <div>External: <span className="text-slate-200 font-bold">{tooltip.node.external}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
