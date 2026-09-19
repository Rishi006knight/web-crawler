import { CrawlRequest, CrawlJob } from '../types';

const API_BASE = '/api';

export const api = {
  async startCrawl(request: CrawlRequest): Promise<CrawlJob> {
    const res = await fetch(`${API_BASE}/crawl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `Failed with status ${res.status}` }));
      throw new Error(err.error || `Failed with status ${res.status}`);
    }
    return res.json();
  },

  async getJob(jobId: string): Promise<CrawlJob> {
    const res = await fetch(`${API_BASE}/crawl/${jobId}`);
    if (!res.ok) throw new Error(`Job not found: ${jobId}`);
    return res.json();
  },

  async stopCrawl(jobId: string): Promise<void> {
    await fetch(`${API_BASE}/crawl/${jobId}/stop`, { method: 'POST' });
  },

  async getLatestJob(): Promise<CrawlJob | null> {
    const res = await fetch(`${API_BASE}/crawl/latest`);
    if (res.status === 204 || !res.ok) return null;
    return res.json();
  },

  getExportUrl(jobId: string, format: 'csv' | 'json'): string {
    return `${API_BASE}/crawl/${jobId}/export?format=${format}`;
  }
};
