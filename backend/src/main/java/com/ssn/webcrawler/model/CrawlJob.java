package com.ssn.webcrawler.model;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class CrawlJob {
    private String jobId;
    private String startUrl;
    private String status; // RUNNING, COMPLETED, FAILED, STOPPED
    private int maxPages;
    private int maxDepth;
    private int pagesCrawled;
    private int discoveredUrlsCount;
    private List<PageData> pages = Collections.synchronizedList(new ArrayList<>());
    private long startTime;
    private Long endTime;
    private String errorMessage;

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

    public long getDurationMillis() {
        if (endTime != null) {
            return endTime - startTime;
        }
        return System.currentTimeMillis() - startTime;
    }
}
