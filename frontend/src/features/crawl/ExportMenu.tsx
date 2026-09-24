import React, { useState } from 'react';
import { Download, FileText, Table, Code, Copy, Check } from 'lucide-react';
import { CrawlJob, PageData } from '../../types';

interface ExportMenuProps {
  job: CrawlJob;
  pagesToExport: PageData[];
  selectedCount?: number;
}

export function ExportMenu({ job, pagesToExport, selectedCount }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  const exportJSON = () => {
    const data = {
      ...job,
      pages: pagesToExport,
      exportedAt: new Date().toISOString(),
      exportCount: pagesToExport.length
    };
    downloadFile(JSON.stringify(data, null, 2), `crawl-${job.jobId.slice(0, 8)}.json`, 'application/json');
  };

  const exportNDJSON = () => {
    const lines = pagesToExport.map((p) => JSON.stringify(p)).join('\n');
    downloadFile(lines, `crawl-${job.jobId.slice(0, 8)}.ndjson`, 'application/x-ndjson');
  };

  const exportCSV = () => {
    const headers = ['URL', 'Title', 'Status', 'Word Count', 'Headings Count', 'Links Count', 'Images Count', 'Description'];
    const rows = pagesToExport.map((p) => [
      `"${p.url.replace(/"/g, '""')}"`,
      `"${(p.title || '').replace(/"/g, '""')}"`,
      p.statusCode,
      p.wordCount,
      p.headings ? p.headings.length : 0,
      p.links ? p.links.length : 0,
      p.images ? p.images.length : 0,
      `"${(p.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadFile(csvContent, `crawl-${job.jobId.slice(0, 8)}.csv`, 'text/csv;charset=utf-8;');
  };

  const exportMarkdown = () => {
    let md = `# Crawl Export: ${job.startUrl}\n\n`;
    md += `- **Date**: ${new Date().toLocaleString()}\n`;
    md += `- **Pages**: ${pagesToExport.length}\n\n---\n\n`;

    pagesToExport.forEach((p, idx) => {
      md += `## [${idx + 1}] ${p.title || 'Untitled'}\n\n`;
      md += `- **URL**: ${p.url}\n`;
      md += `- **Status**: ${p.statusCode} | **Words**: ${p.wordCount}\n\n`;

      if (p.textContent) {
        md += `### Content\n\n${p.textContent}\n\n`;
      }

      if (p.links && p.links.length > 0) {
        md += `### Discovered Links (${p.links.length})\n\n`;
        p.links.slice(0, 20).forEach((link) => {
          md += `- [${link}](${link})\n`;
        });
        if (p.links.length > 20) {
          md += `- *...and ${p.links.length - 20} more links*\n`;
        }
        md += '\n';
      }
      md += '---\n\n';
    });

    downloadFile(md, `crawl-${job.jobId.slice(0, 8)}.md`, 'text/markdown;charset=utf-8;');
  };

  const copyMarkdownToClipboard = () => {
    let md = `# Crawl Summary: ${job.startUrl}\n\n`;
    pagesToExport.slice(0, 10).forEach((p) => {
      md += `### ${p.title}\n${p.url}\n\n${p.textContent.slice(0, 300)}...\n\n`;
    });

    navigator.clipboard.writeText(md).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const countLabel = selectedCount && selectedCount > 0 ? `(${selectedCount} Selected)` : `(${pagesToExport.length})`;

  const menuItems = [
    { onClick: exportJSON, icon: Code, iconColor: 'text-gradient-end', title: 'JSON File', desc: 'Full job structure with all blocks' },
    { onClick: exportCSV, icon: Table, iconColor: 'text-status-success', title: 'CSV Spreadsheet', desc: 'Excel & Sheets ready' },
    { onClick: exportMarkdown, icon: FileText, iconColor: 'text-gradient-start', title: 'Markdown Document', desc: 'Formatted text & link trees' },
    { onClick: exportNDJSON, icon: Code, iconColor: 'text-gradient-pink', title: 'NDJSON Stream', desc: 'Line-delimited for large datasets' },
  ];

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-medium rounded-2xl gradient-accent text-white shadow-soft hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] active:shadow-pressed focus-ring transition-all duration-200"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Export crawl results"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Export {countLabel}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-surface-raised border border-line shadow-floating z-50 py-2 animate-modal overflow-hidden">
            <div className="px-4 py-2 border-b border-line text-[10px] font-semibold tracking-wider uppercase text-ink-muted">
              Export {countLabel}
            </div>

            {menuItems.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={item.onClick}
                className="w-full text-left px-4 py-3 text-xs flex items-center space-x-3 text-ink hover:bg-surface-sunken hover:text-ink-strong transition-all duration-150"
              >
                <item.icon className={`w-4 h-4 ${item.iconColor} shrink-0`} />
                <div>
                  <div className="font-medium text-ink-strong">{item.title}</div>
                  <div className="text-[10px] text-ink-muted">{item.desc}</div>
                </div>
              </button>
            ))}

            <div className="my-1 border-t border-line" />

            <button
              type="button"
              onClick={copyMarkdownToClipboard}
              className="w-full text-left px-4 py-3 text-xs flex items-center space-x-3 text-ink hover:bg-surface-sunken hover:text-ink-strong transition-all duration-150"
            >
              {copied ? <Check className="w-4 h-4 text-status-success" /> : <Copy className="w-4 h-4 text-ink-muted" />}
              <div>
                <div className="font-medium text-ink-strong">{copied ? 'Copied to Clipboard!' : 'Copy as Markdown'}</div>
                <div className="text-[10px] text-ink-muted">Quick paste into docs/notes</div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
