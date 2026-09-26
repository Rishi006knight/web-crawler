package com.ssn.webcrawler.model;

public class ImageDetail {
    private String url;
    private String alt;
    private String title;

    public ImageDetail() {
    }

    public ImageDetail(String url, String alt, String title) {
        this.url = url;
        this.alt = alt;
        this.title = title;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getAlt() {
        return alt;
    }

    public void setAlt(String alt) {
        this.alt = alt;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }
}
