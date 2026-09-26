package com.ssn.webcrawler.model;

import java.util.ArrayList;
import java.util.List;

public class PageData {
    private String url;
    private String title;
    private String description;
    private int statusCode;
    private List<String> headings = new ArrayList<>();
    private String textContent;
    private List<ContentBlock> structuredContent = new ArrayList<>();
    private int wordCount;
    private List<String> links = new ArrayList<>();
    private List<String> images = new ArrayList<>();
    private List<ImageDetail> imageDetails = new ArrayList<>();
    private long crawlTimestamp;

    public PageData() {
        this.crawlTimestamp = System.currentTimeMillis();
    }

    public PageData(String url, String title, String description, int statusCode, List<String> headings, 
                    String textContent, List<ContentBlock> structuredContent, int wordCount, 
                    List<String> links, List<String> images) {
        this(url, title, description, statusCode, headings, textContent, structuredContent, wordCount, links, images, new ArrayList<>());
    }

    public PageData(String url, String title, String description, int statusCode, List<String> headings, 
                    String textContent, List<ContentBlock> structuredContent, int wordCount, 
                    List<String> links, List<String> images, List<ImageDetail> imageDetails) {
        this.url = url;
        this.title = title;
        this.description = description;
        this.statusCode = statusCode;
        this.headings = headings != null ? headings : new ArrayList<>();
        this.textContent = textContent;
        this.structuredContent = structuredContent != null ? structuredContent : new ArrayList<>();
        this.wordCount = wordCount;
        this.links = links != null ? links : new ArrayList<>();
        this.images = images != null ? images : new ArrayList<>();
        this.imageDetails = imageDetails != null ? imageDetails : new ArrayList<>();
        this.crawlTimestamp = System.currentTimeMillis();
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

    public List<String> getHeadings() {
        return headings;
    }

    public void setHeadings(List<String> headings) {
        this.headings = headings;
    }

    public String getTextContent() {
        return textContent;
    }

    public void setTextContent(String textContent) {
        this.textContent = textContent;
    }

    public List<ContentBlock> getStructuredContent() {
        return structuredContent;
    }

    public void setStructuredContent(List<ContentBlock> structuredContent) {
        this.structuredContent = structuredContent;
    }

    public int getWordCount() {
        return wordCount;
    }

    public void setWordCount(int wordCount) {
        this.wordCount = wordCount;
    }

    public List<String> getLinks() {
        return links;
    }

    public void setLinks(List<String> links) {
        this.links = links;
    }

    public List<String> getImages() {
        return images;
    }

    public void setImages(List<String> images) {
        this.images = images;
    }

    public List<ImageDetail> getImageDetails() {
        return imageDetails;
    }

    public void setImageDetails(List<ImageDetail> imageDetails) {
        this.imageDetails = imageDetails;
    }

    public long getCrawlTimestamp() {
        return crawlTimestamp;
    }

    public void setCrawlTimestamp(long crawlTimestamp) {
        this.crawlTimestamp = crawlTimestamp;
    }
}
