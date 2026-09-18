package com.ssn.webcrawler.model;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public class CrawlRequest {

    @NotBlank(message = "seedUrl must not be blank")
    private String seedUrl;

    @Min(value = 1, message = "maxDepth must be >= 1")
    private int maxDepth = 2;

    @Min(value = 1, message = "maxPages must be >= 1")
    private int maxPages = 50;

    /** Optional keyword filter. */
    private String keyword;

    /** Domain scope: SAME_DOMAIN (default), SAME_DOMAIN_AND_SUBDOMAINS, ANY. */
    private DomainScope scope = DomainScope.SAME_DOMAIN;

    /** Whether to parse and respect robots.txt rules and crawl-delay. */
    private boolean respectRobotsTxt = true;

    /** Whether to fetch and seed the queue with URLs from /sitemap.xml. */
    private boolean useSitemap = false;

    public String getSeedUrl() { return seedUrl; }
    public void setSeedUrl(String seedUrl) { this.seedUrl = seedUrl; }
    public int getMaxDepth() { return maxDepth; }
    public void setMaxDepth(int maxDepth) { this.maxDepth = maxDepth; }
    public int getMaxPages() { return maxPages; }
    public void setMaxPages(int maxPages) { this.maxPages = maxPages; }
    public String getKeyword() { return keyword; }
    public void setKeyword(String keyword) { this.keyword = keyword; }
    public DomainScope getScope() { return scope; }
    public void setScope(DomainScope scope) { this.scope = scope; }
    public boolean isRespectRobotsTxt() { return respectRobotsTxt; }
    public void setRespectRobotsTxt(boolean respectRobotsTxt) { this.respectRobotsTxt = respectRobotsTxt; }
    public boolean isUseSitemap() { return useSitemap; }
    public void setUseSitemap(boolean useSitemap) { this.useSitemap = useSitemap; }
}
