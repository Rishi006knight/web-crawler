package com.ssn.webcrawler.model;

import java.util.ArrayList;
import java.util.List;

public class CrawlResult {
    private String jobId;
    private String seedUrl;
    private String status;          // QUEUED, RUNNING, COMPLETED, FAILED
    private int pagesVisited;
    private int urlsDiscovered;
    private long durationMillis;
    private List<String> visitedUrls = new ArrayList<>();
    private List<String> matchedUrls = new ArrayList<>();   // URLs whose page content contained keyword
    private List<PageInfo> pageInfos = new ArrayList<>();   // extracted content summary per crawled page
    private List<FailedUrlInfo> failedUrls = new ArrayList<>(); // URLs that failed to fetch with retry details
    private DomainScope scope = DomainScope.SAME_DOMAIN;
    private boolean respectRobotsTxt = true;
    private boolean useSitemap = false;
    private int duplicateCount = 0;
    private long startTime;
    private long endTime;
    private String errorMessage;

    public CrawlResult() {
        this.startTime = System.currentTimeMillis();
    }

    public CrawlResult(String jobId, String seedUrl, String status, int pagesVisited,
                        int urlsDiscovered, long durationMillis, List<String> visitedUrls) {
        this.jobId = jobId;
        this.seedUrl = seedUrl;
        this.status = status;
        this.pagesVisited = pagesVisited;
        this.urlsDiscovered = urlsDiscovered;
        this.durationMillis = durationMillis;
        this.visitedUrls = visitedUrls != null ? visitedUrls : new ArrayList<>();
        this.matchedUrls = new ArrayList<>();
        this.pageInfos = new ArrayList<>();
        this.failedUrls = new ArrayList<>();
        this.startTime = System.currentTimeMillis();
    }

    public String getJobId() { return jobId; }
    public void setJobId(String jobId) { this.jobId = jobId; }

    public String getSeedUrl() { return seedUrl; }
    public void setSeedUrl(String seedUrl) { this.seedUrl = seedUrl; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getPagesVisited() { return pagesVisited; }
    public void setPagesVisited(int pagesVisited) { this.pagesVisited = pagesVisited; }

    public int getUrlsDiscovered() { return urlsDiscovered; }
    public void setUrlsDiscovered(int urlsDiscovered) { this.urlsDiscovered = urlsDiscovered; }

    public long getDurationMillis() { return durationMillis; }
    public void setDurationMillis(long durationMillis) { this.durationMillis = durationMillis; }

    public List<String> getVisitedUrls() { return visitedUrls; }
    public void setVisitedUrls(List<String> visitedUrls) { this.visitedUrls = visitedUrls; }

    public List<String> getMatchedUrls() { return matchedUrls; }
    public void setMatchedUrls(List<String> matchedUrls) { this.matchedUrls = matchedUrls; }

    public List<PageInfo> getPageInfos() { return pageInfos; }
    public void setPageInfos(List<PageInfo> pageInfos) { this.pageInfos = pageInfos; }

    public List<FailedUrlInfo> getFailedUrls() { return failedUrls; }
    public void setFailedUrls(List<FailedUrlInfo> failedUrls) { this.failedUrls = failedUrls; }

    public DomainScope getScope() { return scope; }
    public void setScope(DomainScope scope) { this.scope = scope; }

    public boolean isRespectRobotsTxt() { return respectRobotsTxt; }
    public void setRespectRobotsTxt(boolean respectRobotsTxt) { this.respectRobotsTxt = respectRobotsTxt; }

    public boolean isUseSitemap() { return useSitemap; }
    public void setUseSitemap(boolean useSitemap) { this.useSitemap = useSitemap; }

    public int getDuplicateCount() { return duplicateCount; }
    public void setDuplicateCount(int duplicateCount) { this.duplicateCount = duplicateCount; }

    public long getStartTime() { return startTime; }
    public void setStartTime(long startTime) { this.startTime = startTime; }

    public long getEndTime() { return endTime; }
    public void setEndTime(long endTime) { this.endTime = endTime; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
}
