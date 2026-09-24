export interface ContentBlock {
  tag: string;
  type: 'HEADING' | 'PARAGRAPH' | 'LIST_ITEM' | 'QUOTE' | 'CODE';
  text: string;
}

export interface PageData {
  url: string;
  title: string;
  description?: string;
  statusCode: number;
  headings: string[];
  textContent: string;
  structuredContent?: ContentBlock[];
  wordCount: number;
  links: string[];
  images: string[];
  crawlTimestamp: number;
}

export interface CrawlAttempt {
  url: string;
  outcome: string;
  httpStatus?: number;
  reason?: string;
  durationMillis: number;
}

export interface CrawlJob {
  jobId: string;
  startUrl: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'STOPPED';
  maxPages: number;
  maxDepth: number;
  pagesCrawled: number;
  discoveredUrlsCount: number;
  duplicatesSkippedCount?: number;
  concurrency?: number;
  pages: PageData[];
  skipped?: CrawlAttempt[];
  errorSummary?: Record<string, number>;
  startTime: number;
  endTime?: number;
  errorMessage?: string;
  durationMillis?: number;
}

export interface CrawlRequest {
  url: string;
  maxPages: number;
  maxDepth: number;
  concurrency?: number;
  ignoreRobotsTxt?: boolean;
  sameDomainOnly?: boolean;
  urlNormalization?: boolean;
  includePattern?: string;
  excludePattern?: string;
}
