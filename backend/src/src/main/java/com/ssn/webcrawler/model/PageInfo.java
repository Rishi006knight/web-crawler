package com.ssn.webcrawler.model;

import java.util.List;

/** Content extracted from one crawled page - the "creative" part of the crawler:
 *  summarises what each page is actually about and records metadata like deduplication and depth. */
public class PageInfo {
    private String url;
    private String title;
    private String metaDescription;
    private String h1;
    private int wordCount;
    private int imageCount;
    private int internalLinkCount;
    private int externalLinkCount;
    private List<String> emailsFound;
    private String snippet;   // first ~200 chars of visible text
    private boolean duplicate;
    private String isDuplicateOf;
    private String contentHash;
    private int statusCode = 200;
    private int depth;

    public PageInfo() {}

    public PageInfo(String url, String title, String metaDescription, String h1, int wordCount,
                    int imageCount, int internalLinkCount, int externalLinkCount,
                    List<String> emailsFound, String snippet) {
        this.url = url;
        this.title = title;
        this.metaDescription = metaDescription;
        this.h1 = h1;
        this.wordCount = wordCount;
        this.imageCount = imageCount;
        this.internalLinkCount = internalLinkCount;
        this.externalLinkCount = externalLinkCount;
        this.emailsFound = emailsFound;
        this.snippet = snippet;
    }

    public PageInfo(String url, String title, String metaDescription, String h1, int wordCount,
                    int imageCount, int internalLinkCount, int externalLinkCount,
                    List<String> emailsFound, String snippet, boolean duplicate,
                    String isDuplicateOf, String contentHash, int statusCode, int depth) {
        this.url = url;
        this.title = title;
        this.metaDescription = metaDescription;
        this.h1 = h1;
        this.wordCount = wordCount;
        this.imageCount = imageCount;
        this.internalLinkCount = internalLinkCount;
        this.externalLinkCount = externalLinkCount;
        this.emailsFound = emailsFound;
        this.snippet = snippet;
        this.duplicate = duplicate;
        this.isDuplicateOf = isDuplicateOf;
        this.contentHash = contentHash;
        this.statusCode = statusCode;
        this.depth = depth;
    }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMetaDescription() { return metaDescription; }
    public void setMetaDescription(String metaDescription) { this.metaDescription = metaDescription; }
    public String getH1() { return h1; }
    public void setH1(String h1) { this.h1 = h1; }
    public int getWordCount() { return wordCount; }
    public void setWordCount(int wordCount) { this.wordCount = wordCount; }
    public int getImageCount() { return imageCount; }
    public void setImageCount(int imageCount) { this.imageCount = imageCount; }
    public int getInternalLinkCount() { return internalLinkCount; }
    public void setInternalLinkCount(int internalLinkCount) { this.internalLinkCount = internalLinkCount; }
    public int getExternalLinkCount() { return externalLinkCount; }
    public void setExternalLinkCount(int externalLinkCount) { this.externalLinkCount = externalLinkCount; }
    public List<String> getEmailsFound() { return emailsFound; }
    public void setEmailsFound(List<String> emailsFound) { this.emailsFound = emailsFound; }
    public String getSnippet() { return snippet; }
    public void setSnippet(String snippet) { this.snippet = snippet; }
    public boolean isDuplicate() { return duplicate; }
    public void setDuplicate(boolean duplicate) { this.duplicate = duplicate; }
    public String getIsDuplicateOf() { return isDuplicateOf; }
    public void setIsDuplicateOf(String isDuplicateOf) { this.isDuplicateOf = isDuplicateOf; }
    public String getContentHash() { return contentHash; }
    public void setContentHash(String contentHash) { this.contentHash = contentHash; }
    public int getStatusCode() { return statusCode; }
    public void setStatusCode(int statusCode) { this.statusCode = statusCode; }
    public int getDepth() { return depth; }
    public void setDepth(int depth) { this.depth = depth; }
}
