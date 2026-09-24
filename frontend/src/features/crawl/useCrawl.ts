import { useState, useEffect, useRef, useCallback } from 'react';
import { CrawlJob, CrawlRequest, PageData, CrawlAttempt } from '../../types';
import { apiClient, API_BASE } from '../../lib/api';
import { formatErrorMessage } from '../../lib/errors';
import { useInterval } from '../../hooks/useInterval';

export interface FeedItem {
  id: string;
  url: string;
  type: 'CRAWLED' | 'SKIPPED' | 'DISCOVERED';
  status?: number;
  reason?: string;
  timestamp: number;
}

export function useCrawl() {
  const [job, setJob] = useState<CrawlJob | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isWakingUp, setIsWakingUp] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const eventSourceRef = useRef<EventSource | null>(null);
  const isStreamingRef = useRef<boolean>(false);

  // Ping health on mount (cold start warm-up)
  useEffect(() => {
    apiClient.pingHealth().catch(() => {});
  }, []);

  // Real elapsed seconds timer
  useInterval(
    () => {
      setElapsedSeconds((prev) => prev + 1);
    },
    job && job.status === 'RUNNING' ? 1000 : null
  );

  const closeStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    isStreamingRef.current = false;
  }, []);

  // Poll fallback if stream is not active and job is RUNNING
  useInterval(
    async () => {
      if (!job || job.status !== 'RUNNING' || isStreamingRef.current) return;

      try {
        const updated = await apiClient.getJob(job.jobId);
        setJob(updated);
        if (updated.status !== 'RUNNING') {
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('Polling error:', err);
      }
    },
    job && job.status === 'RUNNING' && !isStreamingRef.current ? 1200 : null
  );

  const startCrawl = async (request: CrawlRequest) => {
    closeStream();
    setIsLoading(true);
    setIsWakingUp(false);
    setError(null);
    setFeedItems([]);
    setElapsedSeconds(0);

    try {
      const newJob = await apiClient.startCrawl(request, {
        onSlowResponse: () => setIsWakingUp(true)
      });
      setIsWakingUp(false);
      setJob(newJob);

      // Attempt SSE streaming
      if (typeof window !== 'undefined' && 'EventSource' in window) {
        try {
          const streamUrl = `${API_BASE}/crawl/${encodeURIComponent(newJob.jobId)}/stream`;
          const es = new EventSource(streamUrl);
          eventSourceRef.current = es;
          isStreamingRef.current = true;

          es.addEventListener('page.crawled', (e: MessageEvent) => {
            try {
              const page: PageData = JSON.parse(e.data);
              setJob((prev) => {
                if (!prev) return prev;
                const existing = prev.pages.some((p) => p.url === page.url);
                const nextPages = existing ? prev.pages : [...prev.pages, page];
                return {
                  ...prev,
                  pages: nextPages,
                  pagesCrawled: nextPages.length
                };
              });
              setFeedItems((prev) => [
                {
                  id: Math.random().toString(36).substring(2, 9),
                  url: page.url,
                  type: 'CRAWLED',
                  status: page.statusCode,
                  timestamp: Date.now()
                },
                ...prev.slice(0, 24)
              ]);
            } catch (err) {
              console.warn('Failed parsing page.crawled SSE data:', err);
            }
          });

          es.addEventListener('url.discovered', (e: MessageEvent) => {
            try {
              const data = JSON.parse(e.data);
              setJob((prev) => (prev ? { ...prev, discoveredUrlsCount: data.discoveredCount || prev.discoveredUrlsCount + 1 } : prev));
              setFeedItems((prev) => [
                {
                  id: Math.random().toString(36).substring(2, 9),
                  url: data.url,
                  type: 'DISCOVERED',
                  timestamp: Date.now()
                },
                ...prev.slice(0, 24)
              ]);
            } catch (err) {
              console.warn('Failed parsing url.discovered SSE data:', err);
            }
          });

          es.addEventListener('url.skipped', (e: MessageEvent) => {
            try {
              const attempt: CrawlAttempt = JSON.parse(e.data);
              setJob((prev) => {
                if (!prev) return prev;
                const skipped = prev.skipped ? [...prev.skipped, attempt] : [attempt];
                const errorSummary = { ...prev.errorSummary, [attempt.outcome]: (prev.errorSummary?.[attempt.outcome] || 0) + 1 };
                return { ...prev, skipped, errorSummary };
              });
              setFeedItems((prev) => [
                {
                  id: Math.random().toString(36).substring(2, 9),
                  url: attempt.url,
                  type: 'SKIPPED',
                  status: attempt.httpStatus,
                  reason: attempt.reason || attempt.outcome,
                  timestamp: Date.now()
                },
                ...prev.slice(0, 24)
              ]);
            } catch (err) {
              console.warn('Failed parsing url.skipped SSE data:', err);
            }
          });

          es.addEventListener('progress', (e: MessageEvent) => {
            try {
              const data = JSON.parse(e.data);
              setJob((prev) =>
                prev
                  ? {
                      ...prev,
                      pagesCrawled: data.pagesCrawled ?? prev.pagesCrawled,
                      discoveredUrlsCount: data.discoveredCount ?? prev.discoveredUrlsCount
                    }
                  : prev
              );
            } catch (err) {
              console.warn('Failed parsing progress SSE data:', err);
            }
          });

          es.addEventListener('job.completed', (e: MessageEvent) => {
            try {
              const finalJob: CrawlJob = JSON.parse(e.data);
              setJob(finalJob);
            } catch {
              setJob((prev) => (prev ? { ...prev, status: 'COMPLETED' } : prev));
            }
            setIsLoading(false);
            closeStream();
          });

          es.addEventListener('job.failed', (e: MessageEvent) => {
            try {
              const finalJob: CrawlJob = JSON.parse(e.data);
              setJob(finalJob);
              if (finalJob.errorMessage) {
                setError(finalJob.errorMessage);
              }
            } catch {
              setJob((prev) => (prev ? { ...prev, status: 'FAILED' } : prev));
            }
            setIsLoading(false);
            closeStream();
          });

          es.onerror = () => {
            // Graceful fallback: SSE connection closed or failed, switch to polling
            closeStream();
          };
        } catch (streamErr) {
          console.warn('SSE initiation failed; relying on polling:', streamErr);
          isStreamingRef.current = false;
        }
      }
    } catch (err: any) {
      setIsWakingUp(false);
      setIsLoading(false);
      const msg = formatErrorMessage(err);
      setError(msg);
      throw err;
    }
  };

  const stopCrawl = async () => {
    if (!job) return;
    try {
      await apiClient.stopCrawl(job.jobId);
      closeStream();
      setJob((prev) => (prev ? { ...prev, status: 'STOPPED', endTime: Date.now() } : prev));
      setIsLoading(false);
    } catch (err: any) {
      setError(formatErrorMessage(err));
    }
  };

  const loadJob = async (jobId: string) => {
    closeStream();
    setIsLoading(true);
    setError(null);
    try {
      const loaded = await apiClient.getJob(jobId);
      setJob(loaded);
    } catch (err: any) {
      setError(formatErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const loadLatest = async () => {
    try {
      const latest = await apiClient.getLatestJob();
      if (latest) {
        setJob(latest);
      }
    } catch (err: any) {
      console.warn('Initial loadLatest error:', err);
    }
  };

  return {
    job,
    isLoading,
    isWakingUp,
    error,
    feedItems,
    elapsedSeconds,
    startCrawl,
    stopCrawl,
    loadJob,
    loadLatest,
    clearError: () => setError(null)
  };
}
