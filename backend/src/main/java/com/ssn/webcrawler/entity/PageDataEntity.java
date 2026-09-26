package com.ssn.webcrawler.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "crawled_pages")
public class PageDataEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    @JsonIgnore
    private CrawlJobEntity job;

    @Column(name = "url", nullable = false, columnDefinition = "TEXT")
    private String url;

    @Column(name = "title", columnDefinition = "TEXT")
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "status_code")
    private int statusCode;

    @Column(name = "word_count")
    private int wordCount;

    @Column(name = "headings_json", columnDefinition = "TEXT")
    private String headingsJson;

    @Column(name = "text_content", columnDefinition = "TEXT")
    private String textContent;

    @Column(name = "structured_content_json", columnDefinition = "TEXT")
    private String structuredContentJson;

    @Column(name = "links_json", columnDefinition = "TEXT")
    private String linksJson;

    @Column(name = "images_json", columnDefinition = "TEXT")
    private String imagesJson;

    @Column(name = "image_details_json", columnDefinition = "TEXT")
    private String imageDetailsJson;

    @Column(name = "crawl_timestamp")
    private long crawlTimestamp;

    public PageDataEntity() {
        this.crawlTimestamp = System.currentTimeMillis();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public CrawlJobEntity getJob() {
        return job;
    }

    public void setJob(CrawlJobEntity job) {
        this.job = job;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public void setStatusCode(int statusCode) {
        this.statusCode = statusCode;
    }

    public int getWordCount() {
        return wordCount;
    }

    public void setWordCount(int wordCount) {
        this.wordCount = wordCount;
    }

    public String getHeadingsJson() {
        return headingsJson;
    }

    public void setHeadingsJson(String headingsJson) {
        this.headingsJson = headingsJson;
    }

    public String getTextContent() {
        return textContent;
    }

    public void setTextContent(String textContent) {
        this.textContent = textContent;
    }

    public String getStructuredContentJson() {
        return structuredContentJson;
    }

    public void setStructuredContentJson(String structuredContentJson) {
        this.structuredContentJson = structuredContentJson;
    }

    public String getLinksJson() {
        return linksJson;
    }

    public void setLinksJson(String linksJson) {
        this.linksJson = linksJson;
    }

    public String getImagesJson() {
        return imagesJson;
    }

    public void setImagesJson(String imagesJson) {
        this.imagesJson = imagesJson;
    }

    public String getImageDetailsJson() {
        return imageDetailsJson;
    }

    public void setImageDetailsJson(String imageDetailsJson) {
        this.imageDetailsJson = imageDetailsJson;
    }

    public long getCrawlTimestamp() {
        return crawlTimestamp;
    }

    public void setCrawlTimestamp(long crawlTimestamp) {
        this.crawlTimestamp = crawlTimestamp;
    }
}
