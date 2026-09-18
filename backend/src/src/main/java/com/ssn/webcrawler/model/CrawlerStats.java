package com.ssn.webcrawler.model;

import java.util.Map;

public class CrawlerStats {
    private long totalPagesCrawled;
    private long totalUrlsDiscovered;
    private long totalUniqueDomains;
    private double averageCrawlDurationMs;
    private long activeJobCount;
    private long totalEmailsDiscovered;
    private long totalJobs;
    private long completedJobs;
    private long failedJobs;
    private Map<String, Integer> topDomains;

    public CrawlerStats() {}

    public long getTotalPagesCrawled() { return totalPagesCrawled; }
    public void setTotalPagesCrawled(long totalPagesCrawled) { this.totalPagesCrawled = totalPagesCrawled; }

    public long getTotalUrlsDiscovered() { return totalUrlsDiscovered; }
    public void setTotalUrlsDiscovered(long totalUrlsDiscovered) { this.totalUrlsDiscovered = totalUrlsDiscovered; }

    public long getTotalUniqueDomains() { return totalUniqueDomains; }
    public void setTotalUniqueDomains(long totalUniqueDomains) { this.totalUniqueDomains = totalUniqueDomains; }

    public double getAverageCrawlDurationMs() { return averageCrawlDurationMs; }
    public void setAverageCrawlDurationMs(double averageCrawlDurationMs) { this.averageCrawlDurationMs = averageCrawlDurationMs; }

    public long getActiveJobCount() { return activeJobCount; }
    public void setActiveJobCount(long activeJobCount) { this.activeJobCount = activeJobCount; }

    public long getTotalEmailsDiscovered() { return totalEmailsDiscovered; }
    public void setTotalEmailsDiscovered(long totalEmailsDiscovered) { this.totalEmailsDiscovered = totalEmailsDiscovered; }

    public long getTotalJobs() { return totalJobs; }
    public void setTotalJobs(long totalJobs) { this.totalJobs = totalJobs; }

    public long getCompletedJobs() { return completedJobs; }
    public void setCompletedJobs(long completedJobs) { this.completedJobs = completedJobs; }

    public long getFailedJobs() { return failedJobs; }
    public void setFailedJobs(long failedJobs) { this.failedJobs = failedJobs; }

    public Map<String, Integer> getTopDomains() { return topDomains; }
    public void setTopDomains(Map<String, Integer> topDomains) { this.topDomains = topDomains; }
}
