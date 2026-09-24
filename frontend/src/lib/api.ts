import { CrawlRequest, CrawlJob, PageData } from '../types';
import { normalizeJob, normalizePage } from './validation';
import {
  NetworkError,
  TimeoutError,
  RateLimitError,
  ValidationError,
  ServerError,
  ColdStartError
} from './errors';

const RAW_BASE = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '') : '';
export const API_BASE = (RAW_BASE ? RAW_BASE : '') + '/api';

interface RequestOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
  onSlowResponse?: () => void;
}

async function requestWithTimeout(
  url: string,
  options: RequestInit = {},
  reqOpts: RequestOptions = {}
): Promise<Response> {
  const { timeoutMs = 15000, signal, onSlowResponse } = reqOpts;
  const controller = new AbortController();

  let slowTimer: ReturnType<typeof setTimeout> | null = null;
  if (onSlowResponse) {
    slowTimer = setTimeout(() => {
      onSlowResponse();
    }, 2000);
  }

  const timeoutId = setTimeout(() => {
    controller.abort(new TimeoutError(`Request to ${url} timed out after ${timeoutMs}ms`));
  }, timeoutMs);

  const combinedSignal = signal
    ? anySignal([signal, controller.signal])
    : controller.signal;

  try {
    const res = await fetch(url, {
      ...options,
      signal: combinedSignal
    });
    return res;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      if (signal?.aborted) {
        throw new Error('Request was aborted');
      }
      throw new TimeoutError('Request timed out while waiting for crawler response.');
    }
    if (err instanceof TypeError || err.message?.includes('Failed to fetch')) {
      throw new NetworkError('Unable to connect to crawler service. It may be offline or unreachable.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
    if (slowTimer) clearTimeout(slowTimer);
  }
}

function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const s of signals) {
    if (s.aborted) {
      controller.abort();
      return controller.signal;
    }
    s.addEventListener('abort', () => controller.abort(), { once: true });
  }
  return controller.signal;
}

export const apiClient = {
  async pingHealth(opts?: RequestOptions): Promise<boolean> {
    try {
      const res = await requestWithTimeout(`${API_BASE}/health`, { method: 'GET' }, { timeoutMs: 4000, ...opts });
      return res.ok;
    } catch {
      return false;
    }
  },

  async startCrawl(request: CrawlRequest, opts?: RequestOptions): Promise<CrawlJob> {
    const res = await requestWithTimeout(
      `${API_BASE}/crawl`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      },
      opts
    );

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const message = errorJson.error || errorJson.message || `Request failed with status ${res.status}`;

      if (res.status === 429) {
        const retryAfter = Number(res.headers.get('Retry-After')) || 60;
        throw new RateLimitError(message, retryAfter);
      }
      if (res.status === 400) {
        throw new ValidationError(message);
      }
      if (res.status >= 500) {
        throw new ServerError(message, res.status);
      }
      throw new Error(message);
    }

    const data = await res.json();
    return normalizeJob(data);
  },

  async getJob(jobId: string, since?: number, opts?: RequestOptions): Promise<CrawlJob> {
    const url = since !== undefined
      ? `${API_BASE}/crawl/${encodeURIComponent(jobId)}?since=${since}`
      : `${API_BASE}/crawl/${encodeURIComponent(jobId)}`;

    const res = await requestWithTimeout(url, { method: 'GET' }, opts);

    if (!res.ok) {
      if (res.status === 404) throw new Error(`Job not found: ${jobId}`);
      if (res.status >= 500) throw new ServerError(`Server error fetching job ${jobId}`, res.status);
      throw new Error(`Failed to fetch job with status ${res.status}`);
    }

    const data = await res.json();
    return normalizeJob(data);
  },

  async getPageDetails(jobId: string, pageIndex: number, opts?: RequestOptions): Promise<PageData> {
    const url = `${API_BASE}/crawl/${encodeURIComponent(jobId)}/pages/${pageIndex}`;
    const res = await requestWithTimeout(url, { method: 'GET' }, opts);
    if (!res.ok) {
      throw new Error(`Failed to fetch page ${pageIndex} details`);
    }
    const data = await res.json();
    return normalizePage(data);
  },

  async stopCrawl(jobId: string, opts?: RequestOptions): Promise<void> {
    await requestWithTimeout(
      `${API_BASE}/crawl/${encodeURIComponent(jobId)}/stop`,
      { method: 'POST' },
      { timeoutMs: 5000, ...opts }
    );
  },

  async getLatestJob(opts?: RequestOptions): Promise<CrawlJob | null> {
    const res = await requestWithTimeout(
      `${API_BASE}/crawl/latest`,
      { method: 'GET' },
      { timeoutMs: 6000, ...opts }
    );

    if (res.status === 204 || !res.ok) return null;
    const data = await res.json();
    return normalizeJob(data);
  }
};
