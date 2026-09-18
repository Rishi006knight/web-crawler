import { CrawlRequest, CrawlResult, CrawlerStats } from '../types';

const API_BASE = '/api';

export const api = {
  async startCrawl(request: CrawlRequest): Promise<CrawlResult> {
    const res = await fetch(`${API_BASE}/crawl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || `Failed with status ${res.status}`);
    }
    return res.json();
  },

  async getJob(jobId: string): Promise<CrawlResult> {
    const res = await fetch(`${API_BASE}/crawl/${jobId}`);
    if (!res.ok) throw new Error(`Job not found: ${jobId}`);
    return res.json();
  },

  async getAllJobs(): Promise<CrawlResult[]> {
    const res = await fetch(`${API_BASE}/crawl`);
    if (!res.ok) return [];
    return res.json();
  },

  async clearJobCache(jobId: string): Promise<void> {
    await fetch(`${API_BASE}/crawl/${jobId}/cache`, { method: 'DELETE' });
  },

  async deleteJob(jobId: string): Promise<void> {
    await fetch(`${API_BASE}/crawl/${jobId}`, { method: 'DELETE' });
  },

  async getStats(): Promise<CrawlerStats> {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  getExportUrl(jobId: string, format: 'csv' | 'json'): string {
    return `${API_BASE}/crawl/${jobId}/export?format=${format}`;
  }
};
