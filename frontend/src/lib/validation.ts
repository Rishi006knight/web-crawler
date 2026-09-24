import { z } from 'zod';
import { ContentBlock, PageData, CrawlAttempt, CrawlJob } from '../types';

export const ContentBlockSchema = z.object({
  tag: z.string().default('p'),
  type: z.enum(['HEADING', 'PARAGRAPH', 'LIST_ITEM', 'QUOTE', 'CODE']).default('PARAGRAPH'),
  text: z.string().default('')
});

export const PageDataSchema = z.object({
  url: z.string().default(''),
  title: z.string().default('Untitled'),
  description: z.string().optional().default(''),
  statusCode: z.number().default(200),
  headings: z.array(z.string()).default([]),
  textContent: z.string().default(''),
  structuredContent: z.array(ContentBlockSchema).default([]),
  wordCount: z.number().default(0),
  links: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  crawlTimestamp: z.number().default(() => Date.now())
});

export const CrawlAttemptSchema = z.object({
  url: z.string().default(''),
  outcome: z.string().default('UNKNOWN'),
  httpStatus: z.number().optional(),
  reason: z.string().optional().default(''),
  durationMillis: z.number().default(0)
});

export const CrawlJobSchema = z.object({
  jobId: z.string().default(''),
  startUrl: z.string().default(''),
  status: z.enum(['RUNNING', 'COMPLETED', 'FAILED', 'STOPPED']).default('RUNNING'),
  maxPages: z.number().default(20),
  maxDepth: z.number().default(2),
  pagesCrawled: z.number().default(0),
  discoveredUrlsCount: z.number().default(0),
  pages: z.array(PageDataSchema).default([]),
  skipped: z.array(CrawlAttemptSchema).default([]),
  errorSummary: z.record(z.string(), z.number()).default({}),
  startTime: z.number().default(() => Date.now()),
  endTime: z.number().optional(),
  errorMessage: z.string().optional(),
  durationMillis: z.number().optional()
});

export function normalizeJob(raw: unknown): CrawlJob {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid job response: payload is not an object');
  }
  const result = CrawlJobSchema.safeParse(raw);
  if (!result.success) {
    console.warn('Job schema validation issues (normalized with safe defaults):', result.error.format());
    // Safe fallback ensuring all arrays and required strings exist
    const r = raw as Record<string, any>;
    return {
      jobId: String(r.jobId || ''),
      startUrl: String(r.startUrl || ''),
      status: (['RUNNING', 'COMPLETED', 'FAILED', 'STOPPED'].includes(r.status) ? r.status : 'RUNNING') as any,
      maxPages: Number(r.maxPages) || 20,
      maxDepth: Number(r.maxDepth) || 2,
      pagesCrawled: Number(r.pagesCrawled) || (Array.isArray(r.pages) ? r.pages.length : 0),
      discoveredUrlsCount: Number(r.discoveredUrlsCount) || 0,
      pages: Array.isArray(r.pages) ? r.pages.map(normalizePage) : [],
      skipped: Array.isArray(r.skipped) ? r.skipped : [],
      errorSummary: (r.errorSummary && typeof r.errorSummary === 'object') ? r.errorSummary : {},
      startTime: Number(r.startTime) || Date.now(),
      endTime: r.endTime ? Number(r.endTime) : undefined,
      errorMessage: r.errorMessage ? String(r.errorMessage) : undefined,
      durationMillis: r.durationMillis ? Number(r.durationMillis) : undefined
    };
  }
  return result.data as CrawlJob;
}

export function normalizePage(raw: unknown): PageData {
  if (!raw || typeof raw !== 'object') {
    return {
      url: '',
      title: 'Untitled',
      description: '',
      statusCode: 200,
      headings: [],
      textContent: '',
      structuredContent: [],
      wordCount: 0,
      links: [],
      images: [],
      crawlTimestamp: Date.now()
    };
  }
  const result = PageDataSchema.safeParse(raw);
  if (!result.success) {
    const r = raw as Record<string, any>;
    return {
      url: String(r.url || ''),
      title: String(r.title || 'Untitled'),
      description: r.description ? String(r.description) : '',
      statusCode: Number(r.statusCode) || 200,
      headings: Array.isArray(r.headings) ? r.headings.map(String) : [],
      textContent: String(r.textContent || ''),
      structuredContent: Array.isArray(r.structuredContent) ? r.structuredContent : [],
      wordCount: Number(r.wordCount) || 0,
      links: Array.isArray(r.links) ? r.links.map(String) : [],
      images: Array.isArray(r.images) ? r.images.map(String) : [],
      crawlTimestamp: Number(r.crawlTimestamp) || Date.now()
    };
  }
  return result.data as PageData;
}
