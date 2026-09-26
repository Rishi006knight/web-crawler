package com.ssn.webcrawler.model;

public class CrawlRequest {
    private String url;
    private String seedUrl;
    private Integer maxPages;
    private Integer maxDepth;
    private boolean ignoreRobotsTxt = false;
    private Integer concurrency = 8;
    private boolean sameDomainOnly = true;
    private String includePattern;
    private String excludePattern;
    private boolean urlNormalization = true;
    private String searchQuery;

    public CrawlRequest() {
    }

    public CrawlRequest(String url, Integer maxPages, Integer maxDepth) {
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

    public Integer getMaxPages() {
        return maxPages;
    }

    public void setMaxPages(Integer maxPages) {
        this.maxPages = maxPages;
    }

    public Integer getMaxDepth() {
        return maxDepth;
    }

    public void setMaxDepth(Integer maxDepth) {
        this.maxDepth = maxDepth;
    }

    public boolean isIgnoreRobotsTxt() {
        return ignoreRobotsTxt;
    }

    public void setIgnoreRobotsTxt(boolean ignoreRobotsTxt) {
        this.ignoreRobotsTxt = ignoreRobotsTxt;
    }

    public Integer getConcurrency() {
        return concurrency;
    }

    public void setConcurrency(Integer concurrency) {
        this.concurrency = concurrency;
    }

    public boolean isSameDomainOnly() {
        return sameDomainOnly;
    }

    public void setSameDomainOnly(boolean sameDomainOnly) {
        this.sameDomainOnly = sameDomainOnly;
    }

    public String getIncludePattern() {
        return includePattern;
    }

    public void setIncludePattern(String includePattern) {
        this.includePattern = includePattern;
    }

    public String getExcludePattern() {
        return excludePattern;
    }

    public void setExcludePattern(String excludePattern) {
        this.excludePattern = excludePattern;
    }

    public boolean isUrlNormalization() {
        return urlNormalization;
    }

    public void setUrlNormalization(boolean urlNormalization) {
        this.urlNormalization = urlNormalization;
    }

    public String getSearchQuery() {
        return searchQuery;
    }

    public void setSearchQuery(String searchQuery) {
        this.searchQuery = searchQuery;
    }

    public String getFocusKeyword() {
        return searchQuery;
    }

    public void setFocusKeyword(String focusKeyword) {
        this.searchQuery = focusKeyword;
    }

    public int getEffectiveMaxPages() {
        return (maxPages != null && maxPages > 0) ? maxPages : 20;
    }

    public int getEffectiveMaxDepth() {
        return (maxDepth != null && maxDepth > 0) ? maxDepth : 2;
    }

    public int getEffectiveConcurrency() {
        if (concurrency == null || concurrency < 1) return 8;
        if (concurrency > 16) return 16;
        return concurrency;
    }
}
