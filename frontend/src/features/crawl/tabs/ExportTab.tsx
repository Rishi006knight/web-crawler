import React, { useState, useMemo } from 'react';
import {
  Download,
  Copy,
  Check,
  FileCode,
  Table,
  FileText,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { CrawlJob, PageData } from '../../../types';
import { useToast } from '../../../ui/Toast';

interface ExportTabProps {
  job: CrawlJob;
  pagesToExport: PageData[];
}

export function ExportTab({ job, pagesToExport }: ExportTabProps) {
  const { toast } = useToast();
  const [activeFormat, setActiveFormat] = useState<'json' | 'csv' | 'html'>('json');
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const pages = pagesToExport.length > 0 ? pagesToExport : job.pages || [];

  // Generate JSON string
  const jsonContent = useMemo(() => {
    return JSON.stringify(
      {
        jobId: job.jobId,
        startUrl: job.startUrl,
        crawledAt: new Date(job.startTime).toISOString(),
        totalPages: pages.length,
        pages: pages.map((p) => ({
          url: p.url,
          title: p.title,
          statusCode: p.statusCode,
          wordCount: p.wordCount,
          headingsCount: p.headings?.length || 0,
          linksCount: p.links?.length || 0,
          imagesCount: p.images?.length || 0,
          textContentPreview: p.textContent?.slice(0, 200) || '',
          crawlTimestamp: p.crawlTimestamp
        }))
      },
      null,
      2
    );
  }, [job, pages]);

  // Generate CSV string
  const csvContent = useMemo(() => {
    const headers = ['URL', 'Title', 'Status Code', 'Word Count', 'Headings Count', 'Links Count', 'Images Count'];
    const rows = pages.map((p) => [
      `"${p.url.replace(/"/g, '""')}"`,
      `"${(p.title || '').replace(/"/g, '""')}"`,
      p.statusCode,
      p.wordCount || 0,
      p.headings?.length || 0,
      p.links?.length || 0,
      p.images?.length || 0
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }, [pages]);

  // Generate HTML Report string
  const htmlContent = useMemo(() => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Crawl Report: ${job.startUrl}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; color: #2D3E50; background: #FFFBF0; }
    h1 { color: #A855F7; margin-bottom: 4px; }
    .subtitle { color: #727068; margin-bottom: 24px; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
    th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #ECE7DE; font-size: 13px; }
    th { background: #F5F2EA; font-weight: 600; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-weight: bold; font-size: 11px; }
    .status-200 { background: #D1FAE5; color: #065F46; }
    .status-error { background: #FEE2E2; color: #991B1B; }
  </style>
</head>
<body>
  <h1>Crawl Report Summary</h1>
  <div class="subtitle">Target: <strong>${job.startUrl}</strong> &bull; Crawled: ${pages.length} pages &bull; Generated: ${new Date().toLocaleString()}</div>
  <table>
    <thead>
      <tr>
        <th>Status</th>
        <th>URL</th>
        <th>Title</th>
        <th>Word Count</th>
        <th>Links</th>
      </tr>
    </thead>
    <tbody>
      ${pages
        .map(
          (p) => `
      <tr>
        <td><span class="badge ${p.statusCode < 400 ? 'status-200' : 'status-error'}">${p.statusCode}</span></td>
        <td><a href="${p.url}" target="_blank">${p.url}</a></td>
        <td>${p.title || 'Untitled'}</td>
        <td>${p.wordCount || 0}</td>
        <td>${p.links?.length || 0}</td>
      </tr>`
        )
        .join('')}
    </tbody>
  </table>
</body>
</html>`;
  }, [job, pages]);

  const handleCopy = (format: 'json' | 'csv' | 'html') => {
    let text = jsonContent;
    if (format === 'csv') text = csvContent;
    if (format === 'html') text = htmlContent;

    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    toast(`Copied ${format.toUpperCase()} export data to clipboard!`, 'success', 'Export Copied');
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  const handleDownload = (format: 'json' | 'csv' | 'html') => {
    let content = jsonContent;
    let mime = 'application/json';
    let ext = 'json';

    if (format === 'csv') {
      content = csvContent;
      mime = 'text/csv';
      ext = 'csv';
    } else if (format === 'html') {
      content = htmlContent;
      mime = 'text/html';
      ext = 'html';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crawl-export-${job.jobId || 'dataset'}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast(`Exported file downloaded successfully (${ext.toUpperCase()})`, 'success', 'Download Started');
  };

  return (
    <div className="space-y-6 text-left">
      {/* ═══ Top Format Bar & Controls ═══ */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl glass-panel">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setActiveFormat('json')}
            className={`px-4 py-2 rounded-2xl text-xs font-semibold flex items-center space-x-2 transition-all duration-200 emboss ${
              activeFormat === 'json'
                ? 'gradient-accent text-white shadow-glow-sm'
                : 'glass text-ink-secondary hover:text-ink-strong'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>JSON Preview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFormat('csv')}
            className={`px-4 py-2 rounded-2xl text-xs font-semibold flex items-center space-x-2 transition-all duration-200 emboss ${
              activeFormat === 'csv'
                ? 'gradient-accent text-white shadow-glow-sm'
                : 'glass text-ink-secondary hover:text-ink-strong'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>CSV Spreadsheet</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFormat('html')}
            className={`px-4 py-2 rounded-2xl text-xs font-semibold flex items-center space-x-2 transition-all duration-200 emboss ${
              activeFormat === 'html'
                ? 'gradient-accent text-white shadow-glow-sm'
                : 'glass text-ink-secondary hover:text-ink-strong'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>HTML Report</span>
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => handleCopy(activeFormat)}
            className="px-4 py-2 rounded-2xl glass emboss text-xs font-semibold text-ink-strong hover:bg-surface-raised flex items-center space-x-2 focus-ring transition"
          >
            {copiedFormat === activeFormat ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-ink-muted" />
                <span>Copy {activeFormat.toUpperCase()}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleDownload(activeFormat)}
            className="px-4 py-2 rounded-2xl gradient-accent text-white text-xs font-semibold flex items-center space-x-2 hover:opacity-95 shadow-glow-sm focus-ring transition"
          >
            <Download className="w-4 h-4" />
            <span>Download {activeFormat.toUpperCase()}</span>
          </button>
        </div>
      </div>

      {/* ═══ Code / Data Preview Viewport ═══ */}
      <div className="rounded-3xl glass-panel p-6 border border-white/50 space-y-4">
        <div className="flex items-center justify-between text-xs text-ink-muted pb-3 border-b border-line/40">
          <span className="font-mono uppercase font-semibold">
            {activeFormat.toUpperCase()} Export Payload ({pages.length} records)
          </span>
          <span>Click download above to save to disk</span>
        </div>

        {activeFormat === 'json' && (
          <div className="bg-[#1E1B32] text-[#F1F0F7] p-5 rounded-2xl font-mono text-xs overflow-x-auto max-h-[500px]">
            <pre>{jsonContent}</pre>
          </div>
        )}

        {activeFormat === 'csv' && (
          <div className="space-y-4">
            <div className="bg-surface-sunken/60 p-4 rounded-2xl font-mono text-xs overflow-x-auto max-h-[300px]">
              <pre>{csvContent.slice(0, 2000)}...</pre>
            </div>
            <p className="text-xs text-ink-muted">
              Table contains all standard headers: URL, Title, StatusCode, WordCount, Links, Images.
            </p>
          </div>
        )}

        {activeFormat === 'html' && (
          <div className="border border-line/50 rounded-2xl overflow-hidden bg-white">
            <iframe
              title="HTML Report Preview"
              srcDoc={htmlContent}
              className="w-full h-[450px] border-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}
