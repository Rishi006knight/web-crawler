import { useState, useEffect } from 'react';
import { CrawlJob } from '../../types';

export interface HistoryItem {
  jobId: string;
  startUrl: string;
  status: string;
  pagesCrawled: number;
  timestamp: number;
  durationMillis?: number;
}

const STORAGE_KEY = 'webcrawler-history';
const MAX_HISTORY = 20;

export function useCrawlHistory() {
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });

  const saveCrawl = (job: CrawlJob) => {
    if (!job || !job.jobId || !job.startUrl) return;

    setHistory((prev) => {
      const filtered = prev.filter((item) => item.jobId !== job.jobId);
      const newItem: HistoryItem = {
        jobId: job.jobId,
        startUrl: job.startUrl,
        status: job.status,
        pagesCrawled: job.pages?.length || job.pagesCrawled || 0,
        timestamp: job.startTime || Date.now(),
        durationMillis: job.durationMillis || (job.endTime && job.startTime ? job.endTime - job.startTime : undefined)
      };
      const updated = [newItem, ...filtered].slice(0, MAX_HISTORY);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to save crawl history to localStorage:', err);
      }
      return updated;
    });
  };

  const removeHistoryItem = (jobId: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.jobId !== jobId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to update localStorage history:', err);
      }
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn('Failed to clear localStorage history:', err);
    }
  };

  return {
    history,
    saveCrawl,
    removeHistoryItem,
    clearHistory
  };
}
