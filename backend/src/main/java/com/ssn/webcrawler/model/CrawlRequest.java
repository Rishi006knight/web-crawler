package com.ssn.webcrawler.model;

public class CrawlRequest {
    private String url;
    private String seedUrl;
    private int maxPages = 20;
    private int maxDepth = 2;

    public CrawlRequest() {
    }

    public CrawlRequest(String url, int maxPages, int maxDepth) {
        this.url = url;
        this.maxPages = maxPages;
        this.maxDepth = maxDepth;
    }

    public String getUrl() {
        if (url != null && !url.trim().isEmpty()) {
            return url.trim();
        }
        return seedUrl != null ? seedUrl.trim() : "";
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getSeedUrl() {
        return seedUrl;
    }

    public void setSeedUrl(String seedUrl) {
        this.seedUrl = seedUrl;
    }

    public int getMaxPages() {
        return maxPages > 0 ? maxPages : 20;
    }

    public void setMaxPages(int maxPages) {
        this.maxPages = maxPages;
    }

    public int getMaxDepth() {
        return maxDepth > 0 ? maxDepth : 2;
    }

    public void setMaxDepth(int maxDepth) {
        this.maxDepth = maxDepth;
    }
}
