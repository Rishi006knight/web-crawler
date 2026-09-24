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

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 focus-ring transition"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Export crawl results"
      >
        <Download className="w-3.5 h-3.5 text-sky-500" />
        <span>Export {countLabel}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 py-1.5 focus-ring animate-in">
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800/80 text-[10px] font-semibold tracking-wider uppercase text-slate-400">
              Export {countLabel}
            </div>

            <button
              type="button"
              onClick={exportJSON}
              className="w-full text-left px-3 py-2 text-xs flex items-center space-x-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <Code className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <div>
                <div className="font-medium">JSON File</div>
                <div className="text-[10px] text-slate-400">Full job structure with all blocks</div>
              </div>
            </button>

            <button
              type="button"
              onClick={exportCSV}
              className="w-full text-left px-3 py-2 text-xs flex items-center space-x-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <Table className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <div>
                <div className="font-medium">CSV Spreadsheet</div>
                <div className="text-[10px] text-slate-400">Excel & Sheets ready</div>
              </div>
            </button>

            <button
              type="button"
              onClick={exportMarkdown}
              className="w-full text-left px-3 py-2 text-xs flex items-center space-x-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <FileText className="w-4 h-4 text-sky-500 flex-shrink-0" />
              <div>
                <div className="font-medium">Markdown Document</div>
                <div className="text-[10px] text-slate-400">Formatted text & link trees</div>
              </div>
            </button>

            <button
              type="button"
              onClick={exportNDJSON}
              className="w-full text-left px-3 py-2 text-xs flex items-center space-x-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <Code className="w-4 h-4 text-purple-500 flex-shrink-0" />
              <div>
                <div className="font-medium">NDJSON Stream</div>
                <div className="text-[10px] text-slate-400">Line-delimited for large datasets</div>
              </div>
            </button>

            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

            <button
              type="button"
              onClick={copyMarkdownToClipboard}
              className="w-full text-left px-3 py-2 text-xs flex items-center space-x-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <div>
                <div className="font-medium">{copied ? 'Copied to Clipboard!' : 'Copy as Markdown'}</div>
                <div className="text-[10px] text-slate-400">Quick paste into docs/notes</div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
