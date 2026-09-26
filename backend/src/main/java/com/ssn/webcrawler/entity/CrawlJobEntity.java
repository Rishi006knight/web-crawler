package com.ssn.webcrawler.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "crawl_jobs")
public class CrawlJobEntity {

    @Id
    @Column(name = "job_id", nullable = false, length = 64)
    private String jobId;

    @Column(name = "start_url", nullable = false, columnDefinition = "TEXT")
    private String startUrl;

    @Column(name = "status", nullable = false, length = 32)
    private String status; // RUNNING, COMPLETED, FAILED, STOPPED

    @Column(name = "max_pages")
    private int maxPages;

    @Column(name = "max_depth")
    private int maxDepth;

    @Column(name = "pages_crawled")
    private int pagesCrawled;

    @Column(name = "discovered_urls_count")
    private int discoveredUrlsCount;

    @Column(name = "start_time")
    private long startTime;

    @Column(name = "end_time")
    private Long endTime;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "search_query", columnDefinition = "TEXT")
    private String searchQuery;

    @OneToMany(mappedBy = "job", cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    private List<PageDataEntity> pages = new ArrayList<>();

    public CrawlJobEntity() {
    }

    public CrawlJobEntity(String jobId, String startUrl, int maxPages, int maxDepth) {
        this.jobId = jobId;
        this.startUrl = startUrl;
        this.maxPages = maxPages;
        this.maxDepth = maxDepth;
        this.status = "RUNNING";
        this.startTime = System.currentTimeMillis();
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

    public List<PageDataEntity> getPages() {
        return pages;
    }

    public void setPages(List<PageDataEntity> pages) {
        this.pages = pages;
    }

    public void addPage(PageDataEntity page) {
        if (this.pages != null) {
            this.pages.add(page);
            page.setJob(this);
            this.pagesCrawled = this.pages.size();
        }
    }

    public String getSearchQuery() {
        return searchQuery;
    }

    public void setSearchQuery(String searchQuery) {
        this.searchQuery = searchQuery;
    }
}
