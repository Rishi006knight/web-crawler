package com.ssn.webcrawler.model;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class CrawlJob {
    private String jobId;
    private String startUrl;
    private String status; // RUNNING, COMPLETED, FAILED, STOPPED
    private int maxPages;
    private int maxDepth;
    private boolean ignoreRobotsTxt = false;
    private int concurrency = 8;
    private int duplicatesSkippedCount = 0;
    private int pagesCrawled;
    private int discoveredUrlsCount;
    private List<PageData> pages = Collections.synchronizedList(new ArrayList<>());
    private List<CrawlAttempt> skipped = Collections.synchronizedList(new ArrayList<>());
    private Map<String, Integer> errorSummary = new ConcurrentHashMap<>();
    private long startTime;
    private Long endTime;
    private String errorMessage;
    private String searchQuery;

    public CrawlJob() {
        this.startTime = System.currentTimeMillis();
        this.status = "RUNNING";
    }

    public CrawlJob(String jobId, String startUrl, int maxPages, int maxDepth) {
        this.jobId = jobId;
        this.startUrl = startUrl;
        this.maxPages = maxPages;
        this.maxDepth = maxDepth;
        this.startTime = System.currentTimeMillis();
        this.status = "RUNNING";
    }

    public String getJobId() {
        return jobId;
    }

    public void setJobId(String jobId) {
        this.jobId = jobId;
    }

    public String getStartUrl() {
        return startUrl;
    }

    public void setStartUrl(String startUrl) {
        this.startUrl = startUrl;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getMaxPages() {
        return maxPages;
    }

    public void setMaxPages(int maxPages) {
        this.maxPages = maxPages;
    }

    public int getMaxDepth() {
        return maxDepth;
    }

    public void setMaxDepth(int maxDepth) {
        this.maxDepth = maxDepth;
    }

    public boolean isIgnoreRobotsTxt() {
        return ignoreRobotsTxt;
    }

    public void setIgnoreRobotsTxt(boolean ignoreRobotsTxt) {
        this.ignoreRobotsTxt = ignoreRobotsTxt;
    }

    public int getConcurrency() {
        return concurrency;
    }

    public void setConcurrency(int concurrency) {
        this.concurrency = concurrency;
    }

    public int getDuplicatesSkippedCount() {
        return duplicatesSkippedCount;
    }

    public void setDuplicatesSkippedCount(int duplicatesSkippedCount) {
        this.duplicatesSkippedCount = duplicatesSkippedCount;
    }

    public void incrementDuplicatesSkipped() {
        this.duplicatesSkippedCount++;
    }

    public int getPagesCrawled() {
        return pages != null ? pages.size() : pagesCrawled;
    }

    public void setPagesCrawled(int pagesCrawled) {
        this.pagesCrawled = pagesCrawled;
    }

    public int getDiscoveredUrlsCount() {
        return discoveredUrlsCount;
    }

    public void setDiscoveredUrlsCount(int discoveredUrlsCount) {
        this.discoveredUrlsCount = discoveredUrlsCount;
    }

    public List<PageData> getPages() {
        return pages;
    }

    public void setPages(List<PageData> pages) {
        this.pages = pages;
    }

    public void addPage(PageData page) {
        if (this.pages != null) {
            this.pages.add(page);
            this.pagesCrawled = this.pages.size();
        }
    }

    public long getStartTime() {
        return startTime;
    }

    public void setStartTime(long startTime) {
        this.startTime = startTime;
    }

    public Long getEndTime() {
        return endTime;
    }

    public void setEndTime(Long endTime) {
        this.endTime = endTime;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public List<CrawlAttempt> getSkipped() {
        return skipped;
    }

    public void setSkipped(List<CrawlAttempt> skipped) {
        this.skipped = skipped;
    }

    public Map<String, Integer> getErrorSummary() {
        return errorSummary;
    }

    public void setErrorSummary(Map<String, Integer> errorSummary) {
        this.errorSummary = errorSummary;
    }

    public void addSkipped(CrawlAttempt attempt) {
        if (this.skipped != null && attempt != null) {
            this.skipped.add(attempt);
            if (this.errorSummary != null && attempt.getOutcome() != null) {
                this.errorSummary.merge(attempt.getOutcome(), 1, Integer::sum);
            }
        }
    }

    public long getDurationMillis() {
        if (endTime != null) {
            return endTime - startTime;
        }
        return System.currentTimeMillis() - startTime;
    }

    public String getSearchQuery() {
        return searchQuery;
    }

    public void setSearchQuery(String searchQuery) {
        this.searchQuery = searchQuery;
    }
}
