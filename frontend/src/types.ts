export type DomainScope = 'SAME_DOMAIN' | 'SAME_DOMAIN_AND_SUBDOMAINS' | 'ANY';

export interface CrawlRequest {
  seedUrl: string;
  maxDepth: number;
  maxPages: number;
  keyword?: string | null;
  scope?: DomainScope;
  respectRobotsTxt?: boolean;
  useSitemap?: boolean;
}

export interface PageInfo {
  url: string;
  title: string;
  metaDescription: string;
  h1: string;
  wordCount: number;
  imageCount: number;
  internalLinkCount: number;
  externalLinkCount: number;
  emailsFound: string[];
  snippet: string;
  duplicate?: boolean;
  isDuplicateOf?: string;
  contentHash?: string;
  statusCode?: number;
  depth?: number;
}

export interface FailedUrlInfo {
  url: string;
  reason: string;
  statusCode: number;
  retryCount: number;
  timestamp: number;
}

export interface CrawlResult {
  jobId: string;
  seedUrl: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  pagesVisited: number;
  urlsDiscovered: number;
  durationMillis: number;
  visitedUrls: string[];
  matchedUrls: string[];
  pageInfos: PageInfo[];
  failedUrls: FailedUrlInfo[];
  scope: DomainScope;
  respectRobotsTxt: boolean;
  useSitemap: boolean;
  duplicateCount: number;
  startTime: number;
  endTime?: number;
  errorMessage?: string;
}

export interface CrawlerStats {
  totalPagesCrawled: number;
  totalUrlsDiscovered: number;
  totalUniqueDomains: number;
  averageCrawlDurationMs: number;
  activeJobCount: number;
  totalEmailsDiscovered: number;
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  topDomains: Record<string, number>;
}
